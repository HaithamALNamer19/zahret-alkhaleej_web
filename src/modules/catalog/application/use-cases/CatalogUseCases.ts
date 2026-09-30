import { CatalogRepository } from "../ports/CatalogRepository";
import { FishItem } from "../../domain/FishItem";
import { FishSize } from "../../domain/FishSize";
import { DailyStorageRate } from "@/core/domain/value-objects/DailyStorageRate";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import { Result } from "@/core/application/result/Result";
import { UserRole } from "@/core/application/authorization/Role";

export interface CreateFishItemInput {
  name: string;
  defaultDailyRateYer: number;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class CreateFishItemUseCase {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: CreateFishItemInput): Promise<Result<FishItem, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية إضافة أصناف جديدة."));
      }

      const existing = await this.catalogRepository.findFishItemByName(input.name);
      if (existing) {
        return Result.fail(new Error(`صنف الصيد "${input.name}" مضاف مسبقاً.`));
      }

      const id = "fish-" + Math.random().toString(36).substring(2, 9);
      const item = FishItem.create({
        id,
        name: input.name,
        defaultDailyRate: DailyStorageRate.fromYer(input.defaultDailyRateYer),
      });

      await this.catalogRepository.saveFishItem(item);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "CREATE_FISH_ITEM",
        entityType: "FishItem",
        entityId: item.getId(),
        reference: item.getName(),
        after: {
          name: item.getName(),
          rateYer: input.defaultDailyRateYer,
        },
      });

      return Result.ok(item);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export interface UpdateFishPriceInput {
  fishItemId: string;
  newDailyRateYer: number;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class UpdateFishPriceUseCase {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: UpdateFishPriceInput): Promise<Result<FishItem, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية تعديل الأسعار."));
      }

      const item = await this.catalogRepository.findFishItemById(input.fishItemId);
      if (!item) {
        return Result.fail(new Error("الصنف غير موجود."));
      }

      const oldRate = item.getDefaultDailyRate().toYer();
      item.updateRate(DailyStorageRate.fromYer(input.newDailyRateYer));
      await this.catalogRepository.saveFishItem(item);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "UPDATE_FISH_PRICE",
        entityType: "FishItem",
        entityId: item.getId(),
        reference: item.getName(),
        before: { defaultDailyRateYer: oldRate },
        after: { defaultDailyRateYer: input.newDailyRateYer },
        reason: "تعديل السعر اليومي للصنف في الدليل العام (لا يؤثر على الدفعات القديمة)",
      });

      return Result.ok(item);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export interface CreateFishSizeInput {
  fishItemId: string;
  label: string;
  dailyRateOverrideYer?: number | null;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class CreateFishSizeUseCase {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: CreateFishSizeInput): Promise<Result<FishSize, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية إضافة أحجام جديدة."));
      }

      const fishItem = await this.catalogRepository.findFishItemById(input.fishItemId);
      if (!fishItem) {
        return Result.fail(new Error("الصنف السمكي التابع غير موجود."));
      }

      const id = "size-" + Math.random().toString(36).substring(2, 9);
      const size = FishSize.create({
        id,
        fishItemId: input.fishItemId,
        label: input.label,
        dailyRateOverride:
          input.dailyRateOverrideYer != null
            ? DailyStorageRate.fromYer(input.dailyRateOverrideYer)
            : null,
      });

      await this.catalogRepository.saveFishSize(size);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "CREATE_FISH_SIZE",
        entityType: "FishSize",
        entityId: size.getId(),
        reference: `${fishItem.getName()} - ${size.getLabel()}`,
        after: {
          fishItemId: size.getFishItemId(),
          label: size.getLabel(),
          overrideYer: input.dailyRateOverrideYer ?? null,
        },
      });

      return Result.ok(size);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
