import { CatalogRepository } from "../application/ports/CatalogRepository";
import { FishItem } from "../domain/FishItem";
import { FishSize } from "../domain/FishSize";
import { DailyStorageRate } from "@/core/domain/value-objects/DailyStorageRate";
import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export class FirebaseCatalogRepository implements CatalogRepository {
  private readonly fishItemsCol = adminFirestore.collection("fishItems");
  private readonly fishSizesCol = adminFirestore.collection("fishSizes");

  public async findFishItemById(id: string): Promise<FishItem | null> {
    const doc = await this.fishItemsCol.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToFishItem(doc.id, doc.data()!);
  }

  public async findFishItemByName(name: string): Promise<FishItem | null> {
    const snap = await this.fishItemsCol.where("name", "==", name.trim()).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return this.mapDocToFishItem(doc.id, doc.data());
  }

  public async findAllFishItems(): Promise<FishItem[]> {
    const snap = await this.fishItemsCol.orderBy("name", "asc").get();
    return snap.docs.map((doc) => this.mapDocToFishItem(doc.id, doc.data()));
  }

  public async saveFishItem(item: FishItem): Promise<void> {
    const data = {
      name: item.getName(),
      defaultDailyRateMilliYer: item.getDefaultDailyRate().getMilliYer(),
      active: item.isActive(),
      createdAt: admin.firestore.Timestamp.fromDate(item.getCreatedAt()),
      updatedAt: admin.firestore.Timestamp.fromDate(item.getUpdatedAt()),
    };
    await this.fishItemsCol.doc(item.getId()).set(data, { merge: true });
  }

  public async findFishSizeById(id: string): Promise<FishSize | null> {
    const doc = await this.fishSizesCol.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToFishSize(doc.id, doc.data()!);
  }

  public async findSizesByFishItemId(fishItemId: string): Promise<FishSize[]> {
    const snap = await this.fishSizesCol
      .where("fishItemId", "==", fishItemId)
      .get();
    return snap.docs.map((doc) => this.mapDocToFishSize(doc.id, doc.data()));
  }

  public async saveFishSize(size: FishSize): Promise<void> {
    const data = {
      fishItemId: size.getFishItemId(),
      label: size.getLabel(),
      dailyRateOverrideMilliYer: size.getDailyRateOverride()
        ? size.getDailyRateOverride()!.getMilliYer()
        : null,
      active: size.isActive(),
      createdAt: admin.firestore.Timestamp.fromDate(size.getCreatedAt()),
      updatedAt: admin.firestore.Timestamp.fromDate(size.getUpdatedAt()),
    };
    await this.fishSizesCol.doc(size.getId()).set(data, { merge: true });
  }

  public async getEffectiveDailyRate(fishItemId: string, fishSizeId: string): Promise<DailyStorageRate> {
    const size = await this.findFishSizeById(fishSizeId);
    if (size && size.getDailyRateOverride()) {
      return size.getDailyRateOverride()!;
    }

    const item = await this.findFishItemById(fishItemId);
    if (item) {
      return item.getDefaultDailyRate();
    }

    throw new Error(`لم يتم العثور على الصنف السمكي المحدد: ${fishItemId}`);
  }

  private mapDocToFishItem(id: string, data: admin.firestore.DocumentData): FishItem {
    return FishItem.reconstitute({
      id,
      name: data.name,
      defaultDailyRate: DailyStorageRate.fromMilliYer(data.defaultDailyRateMilliYer || 0),
      active: data.active ?? true,
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }

  private mapDocToFishSize(id: string, data: admin.firestore.DocumentData): FishSize {
    return FishSize.reconstitute({
      id,
      fishItemId: data.fishItemId,
      label: data.label,
      dailyRateOverride: data.dailyRateOverrideMilliYer != null
        ? DailyStorageRate.fromMilliYer(data.dailyRateOverrideMilliYer)
        : null,
      active: data.active ?? true,
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }
}
