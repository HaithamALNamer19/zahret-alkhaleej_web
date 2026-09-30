import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import { CounterService } from "@/core/application/ports/CounterService";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import { Result } from "@/core/application/result/Result";
import { OutboundReceipt, OutboundLine } from "../../domain/OutboundReceipt";
import { OutboundAllocation } from "../../domain/OutboundAllocation";
import { Lot, LotStatus } from "../../domain/Lot";
import { StockLocation } from "../../domain/StockLocation";
import {
  FifoAllocationEngine,
  UserLocationChoice,
} from "../../domain/services/FifoAllocationEngine";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Weight } from "@/core/domain/value-objects/Weight";
import { ReceiptNumber } from "@/core/domain/value-objects/ReceiptNumber";
import { DailyStorageRate } from "@/core/domain/value-objects/DailyStorageRate";
import { UserRole } from "@/core/application/authorization/Role";
import {
  CompanyWithdrawalBlockedError,
  ConcurrentStockModificationError,
} from "@/core/domain/errors/InventoryErrors";
import * as admin from "firebase-admin";

export interface OutboundLineRequest {
  fishItemId: string;
  fishSizeId: string;
  requestedWeightKg: number;
  userChoicesByLotId: {
    lotId: string;
    choices: {
      stockLocationId: string;
      warehouseId: string;
      weightKg: number;
    }[];
  }[];
}

export interface CreateOutboundReceiptInput {
  companyId: string;
  withdrawalDate: string; // YYYY-MM-DD
  lines: OutboundLineRequest[];
  notes?: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class CreateOutboundReceiptUseCase {
  constructor(
    private readonly counterService: CounterService,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: CreateOutboundReceiptInput): Promise<Result<OutboundReceipt, Error>> {
    try {
      const withdrawalDate = BusinessDate.fromString(input.withdrawalDate);
      const year = withdrawalDate.toDate().getUTCFullYear();

      // We run the entire dispatch inside a Firestore Transaction
      const resultReceipt = await adminFirestore.runTransaction(async (transaction) => {
        // 1. Re-read Company document to verify withdrawal block status
        const companyRef = adminFirestore.collection("companies").doc(input.companyId);
        const companySnap = await transaction.get(companyRef);
        if (!companySnap.exists) {
          throw new Error("الشركة غير موجودة.");
        }
        const companyData = companySnap.data()!;
        if (companyData.withdrawalBlocked === true) {
          throw new CompanyWithdrawalBlockedError(
            companyData.name,
            companyData.withdrawalBlockReason
          );
        }

        // 2. Generate atomic Receipt Number inside transaction
        const counterRef = adminFirestore.collection("counters").doc(`OUT-${year}`);
        const counterSnap = await transaction.get(counterRef);
        let currentSeq = 0;
        if (counterSnap.exists) {
          currentSeq = counterSnap.data()?.currentSequence || 0;
        }
        const nextSeq = currentSeq + 1;
        transaction.set(
          counterRef,
          {
            prefix: "OUT",
            year,
            currentSequence: nextSeq,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        const paddedSeq = String(nextSeq).padStart(6, "0");
        const receiptNumberStr = `OUT-${year}-${paddedSeq}`;
        const receiptNumber = ReceiptNumber.fromString(receiptNumberStr);
        const receiptId = receiptNumber.getValue().toLowerCase();

        const domainLines: OutboundLine[] = [];
        const domainAllocations: OutboundAllocation[] = [];

        // 3. For each line in requested dispatch
        for (let i = 0; i < input.lines.length; i++) {
          const lineReq = input.lines[i];
          const lineId = `${receiptId}-line-${i + 1}`;
          const requestedWeight = Weight.fromKilograms(lineReq.requestedWeightKg);

          domainLines.push({
            id: lineId,
            fishItemId: lineReq.fishItemId,
            fishSizeId: lineReq.fishSizeId,
            requestedWeight,
          });

          // Fetch open lots for (companyId + fishItemId + fishSizeId)
          const lotsQuery = adminFirestore
            .collection("lots")
            .where("companyId", "==", input.companyId)
            .where("fishItemId", "==", lineReq.fishItemId)
            .where("fishSizeId", "==", lineReq.fishSizeId)
            .where("status", "==", "OPEN")
            .orderBy("entryDate", "asc");

          const lotsSnap = await transaction.get(lotsQuery);
          if (lotsSnap.empty) {
            throw new Error("لا توجد دفعات مفتوحة لهذا الصنف والحجم.");
          }

          const lots: Lot[] = [];
          const locationsMap = new Map<string, StockLocation[]>();

          for (const doc of lotsSnap.docs) {
            const data = doc.data();
            const lot = Lot.reconstitute({
              id: doc.id,
              lotNumber: ReceiptNumber.fromString(data.lotNumber),
              inboundReceiptId: data.inboundReceiptId,
              companyId: data.companyId,
              fishItemId: data.fishItemId,
              fishSizeId: data.fishSizeId,
              fishNameSnapshot: data.fishNameSnapshot,
              fishSizeSnapshot: data.fishSizeSnapshot,
              baseDailyRateSnapshot: DailyStorageRate.fromMilliYer(data.baseDailyRateMilliYer || 0),
              freeDaysSnapshot: data.freeDaysSnapshot ?? 15,
              stageDaysSnapshot: data.stageDaysSnapshot ?? 30,
              doublingFactorSnapshot: data.doublingFactorSnapshot ?? 2,
              originalWeight: Weight.fromGrams(data.originalWeightGrams || 0),
              remainingWeight: Weight.fromGrams(data.remainingWeightGrams || 0),
              entryDate: BusinessDate.fromString(data.entryDate),
              lastWithdrawalDate: data.lastWithdrawalDate
                ? BusinessDate.fromString(data.lastWithdrawalDate)
                : undefined,
              status: data.status as LotStatus,
              createdBy: data.createdBy || "",
              createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
              updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
            });
            lots.push(lot);

            // Fetch stock locations for this lot inside transaction
            const locsQuery = adminFirestore
              .collection("stockLocations")
              .where("lotId", "==", lot.getId());
            const locsSnap = await transaction.get(locsQuery);

            const lotLocations = locsSnap.docs.map((ldoc) => {
              const ldata = ldoc.data();
              return StockLocation.reconstitute({
                id: ldoc.id,
                lotId: ldata.lotId,
                warehouseId: ldata.warehouseId,
                remainingWeight: Weight.fromGrams(ldata.remainingWeightGrams || 0),
                createdAt: (ldata.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
                updatedAt: (ldata.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
              });
            });

            locationsMap.set(lot.getId(), lotLocations);
          }

          // 4. Calculate strict FIFO plan with freshly read transaction data
          const plan = FifoAllocationEngine.calculateFifoPlan(
            lots,
            locationsMap,
            requestedWeight
          );

          // 5. Convert user choices for this line
          const choicesMap = new Map<string, UserLocationChoice[]>();
          for (const userLotChoice of lineReq.userChoicesByLotId) {
            choicesMap.set(
              userLotChoice.lotId,
              userLotChoice.choices.map((c) => ({
                stockLocationId: c.stockLocationId,
                warehouseId: c.warehouseId,
                weight: Weight.fromKilograms(c.weightKg),
              }))
            );
          }

          // 6. Validate distribution and build allocations
          const draftAllocations = FifoAllocationEngine.validateAndBuildAllocations(
            plan,
            choicesMap
          );

          // 7. Apply deductions to Domain entities and stage writes in transaction
          for (const draft of draftAllocations) {
            const lot = lots.find((l) => l.getId() === draft.lotId)!;
            const lotLocs = locationsMap.get(draft.lotId)!;
            const loc = lotLocs.find((l) => l.getId() === draft.stockLocationId)!;

            // Deduct location weight
            loc.deduct(draft.weight);
            // Deduct lot weight
            lot.withdraw(draft.weight, withdrawalDate);

            // Stage updates to lot and stockLocation in transaction
            const lotRef = adminFirestore.collection("lots").doc(lot.getId());
            transaction.update(lotRef, {
              remainingWeightGrams: lot.getRemainingWeight().getGrams(),
              status: lot.getStatus(),
              lastWithdrawalDate: withdrawalDate.toString(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            const locRef = adminFirestore.collection("stockLocations").doc(loc.getId());
            transaction.update(locRef, {
              remainingWeightGrams: loc.getRemainingWeight().getGrams(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Create OutboundAllocation domain object
            const allocId = `${receiptId}-alloc-${domainAllocations.length + 1}`;
            const domainAlloc = OutboundAllocation.create({
              id: allocId,
              outboundReceiptId: receiptId,
              outboundLineId: lineId,
              lotId: lot.getId(),
              stockLocationId: loc.getId(),
              warehouseId: loc.getWarehouseId(),
              weight: draft.weight,
              withdrawalDate,
            });
            domainAllocations.push(domainAlloc);

            // Stage allocation document in transaction
            const allocRef = adminFirestore.collection("outboundAllocations").doc(allocId);
            transaction.set(allocRef, {
              outboundReceiptId: receiptId,
              outboundLineId: lineId,
              lotId: lot.getId(),
              stockLocationId: loc.getId(),
              warehouseId: loc.getWarehouseId(),
              weightGrams: draft.weight.getGrams(),
              withdrawalDate: withdrawalDate.toString(),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }

        // 8. Create and stage OutboundReceipt document
        const receipt = OutboundReceipt.create({
          id: receiptId,
          receiptNumber,
          companyId: input.companyId,
          withdrawalDate,
          lines: domainLines,
          notes: input.notes,
          createdBy: input.actor.userId,
        });

        const receiptRef = adminFirestore.collection("outboundReceipts").doc(receiptId);
        transaction.set(receiptRef, {
          receiptNumber: receipt.getReceiptNumber().getValue(),
          companyId: receipt.getCompanyId(),
          withdrawalDate: receipt.getWithdrawalDate().toString(),
          lines: receipt.getLines().map((l) => ({
            id: l.id,
            fishItemId: l.fishItemId,
            fishSizeId: l.fishSizeId,
            requestedWeightGrams: l.requestedWeight.getGrams(),
          })),
          notes: receipt.getNotes() || "",
          status: receipt.getStatus(),
          createdBy: receipt.getCreatedBy(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 9. Stage Audit Entry inside the transaction
        const auditRef = adminFirestore.collection("auditLogs").doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          actorUserId: input.actor.userId,
          actorName: input.actor.name,
          action: "CREATE_OUTBOUND",
          entityType: "OutboundReceipt",
          entityId: receipt.getId(),
          reference: receipt.getReceiptNumber().getValue(),
          after: {
            receiptNumber: receipt.getReceiptNumber().getValue(),
            companyId: receipt.getCompanyId(),
            withdrawalDate: receipt.getWithdrawalDate().toString(),
            allocationsCount: domainAllocations.length,
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return receipt;
      });

      return Result.ok(resultReceipt);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "FirebaseError" && (err as any).code === "aborted") {
        return Result.fail(new ConcurrentStockModificationError());
      }
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
