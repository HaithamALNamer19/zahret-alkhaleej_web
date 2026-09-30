import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import { Result } from "@/core/application/result/Result";
import { UserRole } from "@/core/application/authorization/Role";
import * as admin from "firebase-admin";

export interface CancelReceiptInput {
  receiptId: string;
  reason: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class CancelOutboundReceiptUseCase {
  public async execute(input: CancelReceiptInput): Promise<Result<void, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية إلغاء سندات الصرف."));
      }

      if (!input.reason || input.reason.trim().length === 0) {
        return Result.fail(new Error("يجب كتابة سبب الإلغاء."));
      }

      await adminFirestore.runTransaction(async (transaction) => {
        const receiptRef = adminFirestore.collection("outboundReceipts").doc(input.receiptId);
        const receiptSnap = await transaction.get(receiptRef);
        if (!receiptSnap.exists) {
          throw new Error("سند الصرف غير موجود.");
        }

        const receiptData = receiptSnap.data()!;
        if (receiptData.status === "CANCELLED") {
          throw new Error("سند الصرف ملغي مسبقاً.");
        }

        // Fetch allocations belonging to this outbound receipt
        const allocsQuery = adminFirestore
          .collection("outboundAllocations")
          .where("outboundReceiptId", "==", input.receiptId);
        const allocsSnap = await transaction.get(allocsQuery);

        // For each allocation, restore weight to lot and stock location
        for (const allocDoc of allocsSnap.docs) {
          const alloc = allocDoc.data();
          const weightGrams = alloc.weightGrams || 0;

          // Restore to Lot
          const lotRef = adminFirestore.collection("lots").doc(alloc.lotId);
          const lotSnap = await transaction.get(lotRef);
          if (lotSnap.exists) {
            const lotData = lotSnap.data()!;
            const newRemaining = (lotData.remainingWeightGrams || 0) + weightGrams;
            transaction.update(lotRef, {
              remainingWeightGrams: newRemaining,
              status: "OPEN", // Reopen lot
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          // Restore to StockLocation
          const locRef = adminFirestore.collection("stockLocations").doc(alloc.stockLocationId);
          const locSnap = await transaction.get(locRef);
          if (locSnap.exists) {
            const locData = locSnap.data()!;
            const newLocRemaining = (locData.remainingWeightGrams || 0) + weightGrams;
            transaction.update(locRef, {
              remainingWeightGrams: newLocRemaining,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }

        // Mark receipt as CANCELLED
        transaction.update(receiptRef, {
          status: "CANCELLED",
          cancelledBy: input.actor.userId,
          cancellationReason: input.reason.trim(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Audit entry
        const auditRef = adminFirestore.collection("auditLogs").doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          actorUserId: input.actor.userId,
          actorName: input.actor.name,
          action: "CANCEL_OUTBOUND",
          entityType: "OutboundReceipt",
          entityId: input.receiptId,
          reference: receiptData.receiptNumber,
          reason: input.reason.trim(),
          after: { status: "CANCELLED" },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return Result.ok(undefined);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export class CancelInboundReceiptUseCase {
  public async execute(input: CancelReceiptInput): Promise<Result<void, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية إلغاء سندات الإدخال."));
      }

      if (!input.reason || input.reason.trim().length === 0) {
        return Result.fail(new Error("يجب كتابة سبب الإلغاء."));
      }

      await adminFirestore.runTransaction(async (transaction) => {
        const receiptRef = adminFirestore.collection("inboundReceipts").doc(input.receiptId);
        const receiptSnap = await transaction.get(receiptRef);
        if (!receiptSnap.exists) {
          throw new Error("سند الإدخال غير موجود.");
        }

        const receiptData = receiptSnap.data()!;
        if (receiptData.status === "CANCELLED") {
          throw new Error("سند الإدخال ملغي مسبقاً.");
        }

        // Fetch all lots created by this inbound receipt
        const lotsQuery = adminFirestore
          .collection("lots")
          .where("inboundReceiptId", "==", input.receiptId);
        const lotsSnap = await transaction.get(lotsQuery);

        // Verify that NO withdrawals have been made from any of these lots
        for (const lotDoc of lotsSnap.docs) {
          const lot = lotDoc.data();
          if (lot.remainingWeightGrams < lot.originalWeightGrams) {
            throw new Error(
              `لا يمكن إلغاء سند الإدخال: تم الصرف بالفعل من الدفعة (${lot.lotNumber}). يجب إلغاء حركات الصرف أولاً.`
            );
          }
        }

        // Cancel all lots
        for (const lotDoc of lotsSnap.docs) {
          transaction.update(lotDoc.ref, {
            status: "CANCELLED",
            remainingWeightGrams: 0,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Cancel InboundReceipt
        transaction.update(receiptRef, {
          status: "CANCELLED",
          cancelledBy: input.actor.userId,
          cancellationReason: input.reason.trim(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Audit entry
        const auditRef = adminFirestore.collection("auditLogs").doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          actorUserId: input.actor.userId,
          actorName: input.actor.name,
          action: "CANCEL_INBOUND",
          entityType: "InboundReceipt",
          entityId: input.receiptId,
          reference: receiptData.receiptNumber,
          reason: input.reason.trim(),
          after: { status: "CANCELLED" },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return Result.ok(undefined);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
