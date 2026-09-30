import {
  PaymentRepository,
  DiscountRepository,
} from "../application/ports/FinanceRepositories";
import { Payment, PaymentMethod, PaymentStatus } from "../domain/Payment";
import { Discount, DiscountStatus } from "../domain/Discount";
import { ReceiptNumber } from "@/core/domain/value-objects/ReceiptNumber";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Money } from "@/core/domain/value-objects/Money";
import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export class FirebasePaymentRepository implements PaymentRepository {
  private readonly collection = adminFirestore.collection("payments");

  public async findById(id: string): Promise<Payment | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToPayment(doc.id, doc.data()!);
  }

  public async findByNumber(number: string): Promise<Payment | null> {
    const snap = await this.collection.where("paymentNumber", "==", number.trim()).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return this.mapDocToPayment(doc.id, doc.data());
  }

  public async findByCompanyId(companyId: string): Promise<Payment[]> {
    const snap = await this.collection
      .where("companyId", "==", companyId)
      .orderBy("paymentDate", "asc")
      .get();
    return snap.docs.map((doc) => this.mapDocToPayment(doc.id, doc.data()));
  }

  public async findAll(): Promise<Payment[]> {
    const snap = await this.collection.orderBy("paymentDate", "desc").get();
    return snap.docs.map((doc) => this.mapDocToPayment(doc.id, doc.data()));
  }

  public async save(payment: Payment): Promise<void> {
    const data = {
      paymentNumber: payment.getPaymentNumber().getValue(),
      companyId: payment.getCompanyId(),
      amountMilliYer: payment.getAmount().getMilliYer(),
      paymentMethod: payment.getPaymentMethod(),
      paymentDate: payment.getPaymentDate().toString(),
      notes: payment.getNotes() || "",
      receivedBy: payment.getReceivedBy(),
      status: payment.getStatus(),
      cancelledBy: payment.getCancelledBy() || null,
      cancellationReason: payment.getCancellationReason() || null,
      createdAt: admin.firestore.Timestamp.fromDate(payment.getCreatedAt()),
      updatedAt: admin.firestore.Timestamp.fromDate(payment.getUpdatedAt()),
    };

    await this.collection.doc(payment.getId()).set(data, { merge: true });
  }

  private mapDocToPayment(id: string, data: admin.firestore.DocumentData): Payment {
    return Payment.reconstitute({
      id,
      paymentNumber: ReceiptNumber.fromString(data.paymentNumber),
      companyId: data.companyId,
      amount: Money.fromMilliYer(data.amountMilliYer || 0),
      paymentMethod: (data.paymentMethod as PaymentMethod) || "CASH",
      paymentDate: BusinessDate.fromString(data.paymentDate),
      notes: data.notes || "",
      receivedBy: data.receivedBy || "",
      status: (data.status as PaymentStatus) || "POSTED",
      cancelledBy: data.cancelledBy || undefined,
      cancellationReason: data.cancellationReason || undefined,
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }
}

export class FirebaseDiscountRepository implements DiscountRepository {
  private readonly collection = adminFirestore.collection("discounts");

  public async findById(id: string): Promise<Discount | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToDiscount(doc.id, doc.data()!);
  }

  public async findByNumber(number: string): Promise<Discount | null> {
    const snap = await this.collection.where("discountNumber", "==", number.trim()).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return this.mapDocToDiscount(doc.id, doc.data());
  }

  public async findByCompanyId(companyId: string): Promise<Discount[]> {
    const snap = await this.collection
      .where("companyId", "==", companyId)
      .orderBy("date", "asc")
      .get();
    return snap.docs.map((doc) => this.mapDocToDiscount(doc.id, doc.data()));
  }

  public async findAll(): Promise<Discount[]> {
    const snap = await this.collection.orderBy("date", "desc").get();
    return snap.docs.map((doc) => this.mapDocToDiscount(doc.id, doc.data()));
  }

  public async save(discount: Discount): Promise<void> {
    const data = {
      discountNumber: discount.getDiscountNumber().getValue(),
      companyId: discount.getCompanyId(),
      amountMilliYer: discount.getAmount().getMilliYer(),
      reason: discount.getReason(),
      date: discount.getDate().toString(),
      createdBy: discount.getCreatedBy(),
      approvedBy: discount.getApprovedBy(),
      status: discount.getStatus(),
      createdAt: admin.firestore.Timestamp.fromDate(discount.getCreatedAt()),
      updatedAt: admin.firestore.Timestamp.fromDate(discount.getUpdatedAt()),
    };

    await this.collection.doc(discount.getId()).set(data, { merge: true });
  }

  private mapDocToDiscount(id: string, data: admin.firestore.DocumentData): Discount {
    return Discount.reconstitute({
      id,
      discountNumber: ReceiptNumber.fromString(data.discountNumber),
      companyId: data.companyId,
      amount: Money.fromMilliYer(data.amountMilliYer || 0),
      reason: data.reason || "",
      date: BusinessDate.fromString(data.date),
      createdBy: data.createdBy || "",
      approvedBy: data.approvedBy || "",
      status: (data.status as DiscountStatus) || "POSTED",
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }
}
