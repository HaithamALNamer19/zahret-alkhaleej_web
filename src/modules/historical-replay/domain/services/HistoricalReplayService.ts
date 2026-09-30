import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import { Result } from "@/core/application/result/Result";
import { BackdatedReplayConflictError } from "@/core/domain/errors/InventoryErrors";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import * as admin from "firebase-admin";

export interface ReplayKey {
  companyId: string;
  fishItemId: string;
  fishSizeId: string;
}

export class HistoricalReplayService {
  constructor(private readonly auditLogger: AuditLogger) {}

  /**
   * Replays inventory history for a specific stock key from a backdated entry onward.
   * Acquires a distributed key lock, replays movements, verifies non-negative balances,
   * updates lot remaining weights, and releases the lock.
   */
  public async executeReplay(
    key: ReplayKey,
    actor: { userId: string; name: string }
  ): Promise<Result<{ success: boolean; movementsReplayed: number }, Error>> {
    const lockKey = `${key.companyId}_${key.fishItemId}_${key.fishSizeId}`;
    const lockRef = adminFirestore.collection("inventoryLocks").doc(lockKey);

    try {
      // 1. Acquire lock
      await adminFirestore.runTransaction(async (transaction) => {
        const snap = await transaction.get(lockRef);
        if (snap.exists && snap.data()?.locked === true) {
          const lockTime = snap.data()?.lockedAt?.toDate?.()?.getTime() || 0;
          // Expire stale locks older than 5 minutes
          if (Date.now() - lockTime < 5 * 60 * 1000) {
            throw new Error("المخزون قيد المعالجة حالياً بحركة أخرى. يرجى الانتظار ثوانٍ والمحاولة.");
          }
        }
        transaction.set(lockRef, {
          locked: true,
          lockedBy: actor.userId,
          lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // 2. Fetch all lots for this key sorted by entryDate ASC
      const lotsSnap = await adminFirestore
        .collection("lots")
        .where("companyId", "==", key.companyId)
        .where("fishItemId", "==", key.fishItemId)
        .where("fishSizeId", "==", key.fishSizeId)
        .where("status", "!=", "CANCELLED")
        .orderBy("status")
        .orderBy("entryDate", "asc")
        .get();

      // Reset lots to originalWeight and re-simulate all outbound allocations
      const lots = lotsSnap.docs.map((doc) => ({
        id: doc.id,
        lotNumber: doc.data().lotNumber,
        originalWeightGrams: doc.data().originalWeightGrams || 0,
        currentSimulatedWeightGrams: doc.data().originalWeightGrams || 0,
        entryDate: doc.data().entryDate,
      }));

      // Fetch all outbound allocations for these lots
      const lotIds = lots.map((l) => l.id);
      let allocations: any[] = [];
      if (lotIds.length > 0) {
        // Chunk into groups of 10 for Firestore 'in' queries
        for (let i = 0; i < lotIds.length; i += 10) {
          const chunk = lotIds.slice(i, i + 10);
          const allocsSnap = await adminFirestore
            .collection("outboundAllocations")
            .where("lotId", "in", chunk)
            .get();
          allocations.push(...allocsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      }

      // Sort allocations chronologically by withdrawalDate
      allocations.sort((a, b) => (a.withdrawalDate < b.withdrawalDate ? -1 : 1));

      // 3. Re-simulate FIFO
      for (const alloc of allocations) {
        const targetLot = lots.find((l) => l.id === alloc.lotId);
        if (!targetLot) continue;

        if (targetLot.currentSimulatedWeightGrams < alloc.weightGrams) {
          throw new BackdatedReplayConflictError(
            `تعارض تاريخي: رصيد الدفعة (${targetLot.lotNumber}) سيصبح سالباً عند إعادة بناء الحركات.`
          );
        }

        targetLot.currentSimulatedWeightGrams -= alloc.weightGrams;
      }

      // 4. Update Lots in batch
      const batch = adminFirestore.batch();
      for (const lot of lots) {
        const lotRef = adminFirestore.collection("lots").doc(lot.id);
        const status = lot.currentSimulatedWeightGrams === 0 ? "EXHAUSTED" : "OPEN";
        batch.update(lotRef, {
          remainingWeightGrams: lot.currentSimulatedWeightGrams,
          status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();

      // 5. Audit entry
      await this.auditLogger.log({
        actorUserId: actor.userId,
        actorName: actor.name,
        action: "HISTORICAL_REPLAY",
        entityType: "InventoryKey",
        entityId: lockKey,
        after: {
          movementsReplayed: allocations.length,
          lotsUpdated: lots.length,
        },
      });

      return Result.ok({ success: true, movementsReplayed: allocations.length });
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    } finally {
      // 6. Release lock
      await lockRef.set({ locked: false, releasedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  }
}
