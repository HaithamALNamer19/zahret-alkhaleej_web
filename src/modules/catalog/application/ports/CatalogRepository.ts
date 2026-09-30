import { FishItem } from "../../domain/FishItem";
import { FishSize } from "../../domain/FishSize";
import { DailyStorageRate } from "@/core/domain/value-objects/DailyStorageRate";

export interface CatalogRepository {
  // Fish Items
  findFishItemById(id: string): Promise<FishItem | null>;
  findFishItemByName(name: string): Promise<FishItem | null>;
  findAllFishItems(): Promise<FishItem[]>;
  saveFishItem(item: FishItem): Promise<void>;

  // Fish Sizes
  findFishSizeById(id: string): Promise<FishSize | null>;
  findSizesByFishItemId(fishItemId: string): Promise<FishSize[]>;
  saveFishSize(size: FishSize): Promise<void>;

  // Helper to compute effective rate snapshot
  getEffectiveDailyRate(fishItemId: string, fishSizeId: string): Promise<DailyStorageRate>;
}
