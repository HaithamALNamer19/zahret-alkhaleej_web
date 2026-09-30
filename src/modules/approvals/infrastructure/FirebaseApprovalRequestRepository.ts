import { ApprovalRequestRepository } from "../application/ports/ApprovalRequestRepository";
import { ApprovalRequest, ApprovalStatus, ApprovalType } from "../domain/ApprovalRequest";
import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export class FirebaseApprovalRequestRepository implements ApprovalRequestRepository {
  private readonly collection = adminFirestore.collection("approvals");

  public async findById(id: string): Promise<ApprovalRequest | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToApproval(doc.id, doc.data()!);
  }

  public async findPending(): Promise<ApprovalRequest[]> {
    const snap = await this.collection
      .where("status", "==", "PENDING")
      .orderBy("requestedAt", "desc")
      .get();
    return snap.docs.map((doc) => this.mapDocToApproval(doc.id, doc.data()));
  }

  public async findAll(status?: ApprovalStatus): Promise<ApprovalRequest[]> {
    let query: admin.firestore.Query = this.collection.orderBy("requestedAt", "desc");
    if (status) {
      query = query.where("status", "==", status);
    }
    const snap = await query.get();
    return snap.docs.map((doc) => this.mapDocToApproval(doc.id, doc.data()));
  }

  public async save(request: ApprovalRequest): Promise<void> {
    const data = {
      type: request.getType(),
      status: request.getStatus(),
      requestedBy: request.getRequestedBy(),
      requestedByName: request.getRequestedByName(),
      requestedAt: admin.firestore.Timestamp.fromDate(request.getRequestedAt()),
      reviewedBy: request.getReviewedBy() || null,
      reviewedByName: request.getReviewedByName() || null,
      reviewedAt: request.getReviewedAt()
        ? admin.firestore.Timestamp.fromDate(request.getReviewedAt()!)
        : null,
      reason: request.getReason(),
      reviewComment: request.getReviewComment() || null,
      payload: request.getPayload(),
    };

    await this.collection.doc(request.getId()).set(data, { merge: true });
  }

  private mapDocToApproval(id: string, data: admin.firestore.DocumentData): ApprovalRequest {
    return ApprovalRequest.reconstitute({
      id,
      type: data.type as ApprovalType,
      status: data.status as ApprovalStatus,
      requestedBy: data.requestedBy,
      requestedByName: data.requestedByName || "",
      requestedAt: (data.requestedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      reviewedBy: data.reviewedBy || undefined,
      reviewedByName: data.reviewedByName || undefined,
      reviewedAt: (data.reviewedAt as admin.firestore.Timestamp)?.toDate() || undefined,
      reason: data.reason || "",
      reviewComment: data.reviewComment || undefined,
      payload: data.payload || {},
    });
  }
}
