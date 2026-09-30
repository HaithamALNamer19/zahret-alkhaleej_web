import { AuditLogger, AuditEntryData } from "@/core/application/ports/AuditLogger";
import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export class FirestoreAuditLogger implements AuditLogger {
  private readonly collectionName = "auditLogs";

  public async log(
    entry: AuditEntryData,
    transaction?: FirebaseFirestore.Transaction
  ): Promise<void> {
    const docRef = adminFirestore.collection(this.collectionName).doc();
    const payload = {
      id: docRef.id,
      actorUserId: entry.actorUserId,
      actorName: entry.actorName,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      reference: entry.reference || null,
      before: entry.before || null,
      after: entry.after || null,
      reason: entry.reason || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (transaction) {
      transaction.set(docRef, payload);
    } else {
      await docRef.set(payload);
    }
  }
}
