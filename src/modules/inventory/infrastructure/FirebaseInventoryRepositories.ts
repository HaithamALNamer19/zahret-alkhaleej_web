import {
  InboundReceiptRepository,
  LotRepository,
  StockLocationRepository,
  OutboundReceiptRepository,
} from "../application/ports/InventoryRepositories";
import { InboundReceipt, ReceiptStatus } from "../domain/InboundReceipt";
import { Lot, LotStatus } from "../domain/Lot";
import { StockLocation } from "../domain/StockLocation";
import { OutboundReceipt, OutboundReceiptStatus } from "../domain/OutboundReceipt";
import { OutboundAllocation } from "../domain/OutboundAllocation";
import { ReceiptNumber } from "@/core/domain/value-objects/ReceiptNumber";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Weight } from "@/core/domain/value-objects/Weight";
import { DailyStorageRate } from "@/core/domain/value-objects/DailyStorageRate";
import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export class FirebaseInboundReceiptRepository implements InboundReceiptRepository {
  private readonly collection = adminFirestore.collection("inboundReceipts");

  public async findById(id: string): Promise<InboundReceipt | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToInbound(doc.id, doc.data()!);
  }

  public async findByNumber(number: string): Promise<InboundReceipt | null> {
    const snap = await this.collection.where("receiptNumber", "==", number.trim()).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return this.mapDocToInbound(doc.id, doc.data());
  }

  public async findAll(companyId?: string): Promise<InboundReceipt[]> {
    let query: admin.firestore.Query = this.collection.orderBy("createdAt", "desc");
    if (companyId) {
      query = query.where("companyId", "==", companyId);
    }
    const snap = await query.get();
    return snap.docs.map((doc) => this.mapDocToInbound(doc.id, doc.data()));
  }

  public async save(
    receipt: InboundReceipt,
    lots: Lot[],
    locations: StockLocation[]
  ): Promise<void> {
    const batch = adminFirestore.batch();

    // 1. Save Inbound Receipt
    const receiptDoc = this.collection.doc(receipt.getId());
    batch.set(receiptDoc, {
      receiptNumber: receipt.getReceiptNumber().getValue(),
      companyId: receipt.getCompanyId(),
      entryDate: receipt.getEntryDate().toString(),
      lines: receipt.getLines().map((l) => ({
        id: l.id,
        fishItemId: l.fishItemId,
        fishSizeId: l.fishSizeId,
        totalWeightGrams: l.totalWeight.getGrams(),
        distributions: l.distributions.map((d) => ({
          warehouseId: d.warehouseId,
          weightGrams: d.weight.getGrams(),
        })),
      })),
      notes: receipt.getNotes() || "",
      status: receipt.getStatus(),
      createdBy: receipt.getCreatedBy(),
      createdAt: admin.firestore.Timestamp.fromDate(receipt.getCreatedAt()),
      updatedAt: admin.firestore.Timestamp.fromDate(receipt.getUpdatedAt()),
    });

    // 2. Save Lots
    const lotsCol = adminFirestore.collection("lots");
    for (const lot of lots) {
      const lotDoc = lotsCol.doc(lot.getId());
      batch.set(lotDoc, {
        lotNumber: lot.getLotNumber().getValue(),
        inboundReceiptId: lot.getInboundReceiptId(),
        companyId: lot.getCompanyId(),
        fishItemId: lot.getFishItemId(),
        fishSizeId: lot.getFishSizeId(),
        fishNameSnapshot: lot.getFishNameSnapshot(),
        fishSizeSnapshot: lot.getFishSizeSnapshot(),
        baseDailyRateMilliYer: lot.getBaseDailyRateSnapshot().getMilliYer(),
        freeDaysSnapshot: lot.getFreeDaysSnapshot(),
        stageDaysSnapshot: lot.getStageDaysSnapshot(),
        doublingFactorSnapshot: lot.getDoublingFactorSnapshot(),
        originalWeightGrams: lot.getOriginalWeight().getGrams(),
        remainingWeightGrams: lot.getRemainingWeight().getGrams(),
        entryDate: lot.getEntryDate().toString(),
        status: lot.getStatus(),
        createdBy: lot.getCreatedBy(),
        createdAt: admin.firestore.Timestamp.fromDate(lot.getCreatedAt()),
        updatedAt: admin.firestore.Timestamp.fromDate(lot.getUpdatedAt()),
      });
    }

    // 3. Save Stock Locations
    const locsCol = adminFirestore.collection("stockLocations");
    for (const loc of locations) {
      const locDoc = locsCol.doc(loc.getId());
      batch.set(locDoc, {
        lotId: loc.getLotId(),
        warehouseId: loc.getWarehouseId(),
        remainingWeightGrams: loc.getRemainingWeight().getGrams(),
        createdAt: admin.firestore.Timestamp.fromDate(loc.getCreatedAt()),
        updatedAt: admin.firestore.Timestamp.fromDate(loc.getUpdatedAt()),
      });
    }

    await batch.commit();
  }

  public async updateReceiptStatus(
    id: string,
    status: "CANCELLED",
    cancelledBy: string,
    reason: string
  ): Promise<void> {
    await this.collection.doc(id).update({
      status,
      cancelledBy,
      cancellationReason: reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  private mapDocToInbound(id: string, data: admin.firestore.DocumentData): InboundReceipt {
    return InboundReceipt.reconstitute({
      id,
      receiptNumber: ReceiptNumber.fromString(data.receiptNumber),
      companyId: data.companyId,
      entryDate: BusinessDate.fromString(data.entryDate),
      lines: (data.lines || []).map((l: any) => ({
        id: l.id,
        fishItemId: l.fishItemId,
        fishSizeId: l.fishSizeId,
        totalWeight: Weight.fromGrams(l.totalWeightGrams || 0),
        distributions: (l.distributions || []).map((d: any) => ({
          warehouseId: d.warehouseId,
          weight: Weight.fromGrams(d.weightGrams || 0),
        })),
      })),
      notes: data.notes || "",
      status: (data.status as ReceiptStatus) || "POSTED",
      createdBy: data.createdBy,
      cancelledBy: data.cancelledBy,
      cancellationReason: data.cancellationReason,
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }
}

export class FirebaseLotRepository implements LotRepository {
  private readonly collection = adminFirestore.collection("lots");

  public async findById(id: string): Promise<Lot | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToLot(doc.id, doc.data()!);
  }

  public async findByLotNumber(number: string): Promise<Lot | null> {
    const snap = await this.collection.where("lotNumber", "==", number.trim()).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return this.mapDocToLot(doc.id, doc.data());
  }

  public async findOpenLotsByStockKey(
    companyId: string,
    fishItemId: string,
    fishSizeId: string
  ): Promise<Lot[]> {
    const snap = await this.collection
      .where("companyId", "==", companyId)
      .where("fishItemId", "==", fishItemId)
      .where("fishSizeId", "==", fishSizeId)
      .where("status", "==", "OPEN")
      .orderBy("entryDate", "asc")
      .get();

    return snap.docs.map((doc) => this.mapDocToLot(doc.id, doc.data()));
  }

  public async findByCompanyId(companyId: string): Promise<Lot[]> {
    const snap = await this.collection
      .where("companyId", "==", companyId)
      .orderBy("entryDate", "desc")
      .get();
    return snap.docs.map((doc) => this.mapDocToLot(doc.id, doc.data()));
  }

  public async findAllOpenLots(): Promise<Lot[]> {
    const snap = await this.collection
      .where("status", "==", "OPEN")
      .orderBy("entryDate", "asc")
      .get();
    return snap.docs.map((doc) => this.mapDocToLot(doc.id, doc.data()));
  }

  public async save(lot: Lot, transaction?: FirebaseFirestore.Transaction): Promise<void> {
    const docRef = this.collection.doc(lot.getId());
    const data = {
      lotNumber: lot.getLotNumber().getValue(),
      inboundReceiptId: lot.getInboundReceiptId(),
      companyId: lot.getCompanyId(),
      fishItemId: lot.getFishItemId(),
      fishSizeId: lot.getFishSizeId(),
      fishNameSnapshot: lot.getFishNameSnapshot(),
      fishSizeSnapshot: lot.getFishSizeSnapshot(),
      baseDailyRateMilliYer: lot.getBaseDailyRateSnapshot().getMilliYer(),
      freeDaysSnapshot: lot.getFreeDaysSnapshot(),
      stageDaysSnapshot: lot.getStageDaysSnapshot(),
      doublingFactorSnapshot: lot.getDoublingFactorSnapshot(),
      originalWeightGrams: lot.getOriginalWeight().getGrams(),
      remainingWeightGrams: lot.getRemainingWeight().getGrams(),
      entryDate: lot.getEntryDate().toString(),
      lastWithdrawalDate: lot.getLastWithdrawalDate()?.toString() || null,
      status: lot.getStatus(),
      createdBy: lot.getCreatedBy(),
      createdAt: admin.firestore.Timestamp.fromDate(lot.getCreatedAt()),
      updatedAt: admin.firestore.Timestamp.fromDate(lot.getUpdatedAt()),
    };

    if (transaction) {
      transaction.set(docRef, data, { merge: true });
    } else {
      await docRef.set(data, { merge: true });
    }
  }

  private mapDocToLot(id: string, data: admin.firestore.DocumentData): Lot {
    return Lot.reconstitute({
      id,
      lotNumber: ReceiptNumber.fromString(data.lotNumber),
      inboundReceiptId: data.inboundReceiptId,
      companyId: data.companyId,
      fishItemId: data.fishItemId,
      fishSizeId: data.fishSizeId,
      fishNameSnapshot: data.fishNameSnapshot || "",
      fishSizeSnapshot: data.fishSizeSnapshot || "",
      baseDailyRateSnapshot: DailyStorageRate.fromMilliYer(data.baseDailyRateMilliYer || 0),
      freeDaysSnapshot: data.freeDaysSnapshot ?? 15,
      stageDaysSnapshot: data.stageDaysSnapshot ?? 30,
      doublingFactorSnapshot: data.doublingFactorSnapshot ?? 2,
      originalWeight: Weight.fromGrams(data.originalWeightGrams || 0),
      remainingWeight: Weight.fromGrams(data.remainingWeightGrams || 0),
      entryDate: BusinessDate.fromString(data.entryDate),
      lastWithdrawalDate: data.lastWithdrawalDate ? BusinessDate.fromString(data.lastWithdrawalDate) : undefined,
      status: (data.status as LotStatus) || "OPEN",
      createdBy: data.createdBy || "",
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }
}

export class FirebaseStockLocationRepository implements StockLocationRepository {
  private readonly collection = adminFirestore.collection("stockLocations");

  public async findByLotId(lotId: string): Promise<StockLocation[]> {
    const snap = await this.collection.where("lotId", "==", lotId).get();
    return snap.docs.map((doc) => this.mapDocToLocation(doc.id, doc.data()));
  }

  public async findByWarehouseId(warehouseId: string): Promise<StockLocation[]> {
    const snap = await this.collection
      .where("warehouseId", "==", warehouseId)
      .where("remainingWeightGrams", ">", 0)
      .get();
    return snap.docs.map((doc) => this.mapDocToLocation(doc.id, doc.data()));
  }

  public async save(location: StockLocation, transaction?: FirebaseFirestore.Transaction): Promise<void> {
    const docRef = this.collection.doc(location.getId());
    const data = {
      lotId: location.getLotId(),
      warehouseId: location.getWarehouseId(),
      remainingWeightGrams: location.getRemainingWeight().getGrams(),
      createdAt: admin.firestore.Timestamp.fromDate(location.getCreatedAt()),
      updatedAt: admin.firestore.Timestamp.fromDate(location.getUpdatedAt()),
    };

    if (transaction) {
      transaction.set(docRef, data, { merge: true });
    } else {
      await docRef.set(data, { merge: true });
    }
  }

  private mapDocToLocation(id: string, data: admin.firestore.DocumentData): StockLocation {
    return StockLocation.reconstitute({
      id,
      lotId: data.lotId,
      warehouseId: data.warehouseId,
      remainingWeight: Weight.fromGrams(data.remainingWeightGrams || 0),
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }
}

export class FirebaseOutboundReceiptRepository implements OutboundReceiptRepository {
  private readonly receiptsCol = adminFirestore.collection("outboundReceipts");
  private readonly allocationsCol = adminFirestore.collection("outboundAllocations");

  public async findById(id: string): Promise<OutboundReceipt | null> {
    const doc = await this.receiptsCol.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToOutbound(doc.id, doc.data()!);
  }

  public async findByNumber(number: string): Promise<OutboundReceipt | null> {
    const snap = await this.receiptsCol.where("receiptNumber", "==", number.trim()).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return this.mapDocToOutbound(doc.id, doc.data());
  }

  public async findAll(companyId?: string): Promise<OutboundReceipt[]> {
    let query: admin.firestore.Query = this.receiptsCol.orderBy("createdAt", "desc");
    if (companyId) {
      query = query.where("companyId", "==", companyId);
    }
    const snap = await query.get();
    return snap.docs.map((doc) => this.mapDocToOutbound(doc.id, doc.data()));
  }

  public async findAllocationsByReceiptId(receiptId: string): Promise<OutboundAllocation[]> {
    const snap = await this.allocationsCol.where("outboundReceiptId", "==", receiptId).get();
    return snap.docs.map((doc) => this.mapDocToAllocation(doc.id, doc.data()));
  }

  public async findAllocationsByLotId(lotId: string): Promise<OutboundAllocation[]> {
    const snap = await this.allocationsCol
      .where("lotId", "==", lotId)
      .orderBy("withdrawalDate", "asc")
      .get();
    return snap.docs.map((doc) => this.mapDocToAllocation(doc.id, doc.data()));
  }

  private mapDocToOutbound(id: string, data: admin.firestore.DocumentData): OutboundReceipt {
    return OutboundReceipt.reconstitute({
      id,
      receiptNumber: ReceiptNumber.fromString(data.receiptNumber),
      companyId: data.companyId,
      withdrawalDate: BusinessDate.fromString(data.withdrawalDate),
      lines: (data.lines || []).map((l: any) => ({
        id: l.id,
        fishItemId: l.fishItemId,
        fishSizeId: l.fishSizeId,
        requestedWeight: Weight.fromGrams(l.requestedWeightGrams || 0),
      })),
      notes: data.notes || "",
      status: (data.status as OutboundReceiptStatus) || "POSTED",
      createdBy: data.createdBy,
      cancelledBy: data.cancelledBy,
      cancellationReason: data.cancellationReason,
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }

  private mapDocToAllocation(id: string, data: admin.firestore.DocumentData): OutboundAllocation {
    return OutboundAllocation.reconstitute({
      id,
      outboundReceiptId: data.outboundReceiptId,
      outboundLineId: data.outboundLineId,
      lotId: data.lotId,
      stockLocationId: data.stockLocationId,
      warehouseId: data.warehouseId,
      weight: Weight.fromGrams(data.weightGrams || 0),
      withdrawalDate: BusinessDate.fromString(data.withdrawalDate),
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }
}
