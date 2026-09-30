import { InboundReceiptRepository } from "../ports/InventoryRepositories";
import { CompanyRepository } from "@/modules/companies/application/ports/CompanyRepository";
import { CatalogRepository } from "@/modules/catalog/application/ports/CatalogRepository";
import { SettingsRepository } from "@/modules/settings/application/ports/SettingsRepository";
import { CounterService } from "@/core/application/ports/CounterService";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import { Result } from "@/core/application/result/Result";
import { InboundReceipt, InboundLine } from "../../domain/InboundReceipt";
import { Lot } from "../../domain/Lot";
import { StockLocation } from "../../domain/StockLocation";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Weight } from "@/core/domain/value-objects/Weight";
import { ReceiptNumber } from "@/core/domain/value-objects/ReceiptNumber";
import { UserRole } from "@/core/application/authorization/Role";

export interface InboundLineInput {
  fishItemId: string;
  fishSizeId: string;
  totalWeightKg: number;
  distributions: {
    warehouseId: string;
    weightKg: number;
  }[];
}

export interface CreateInboundReceiptInput {
  companyId: string;
  entryDate: string; // YYYY-MM-DD
  lines: InboundLineInput[];
  notes?: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class CreateInboundReceiptUseCase {
  constructor(
    private readonly inboundRepository: InboundReceiptRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly catalogRepository: CatalogRepository,
    private readonly settingsRepository: SettingsRepository,
    private readonly counterService: CounterService,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: CreateInboundReceiptInput): Promise<Result<InboundReceipt, Error>> {
    try {
      const company = await this.companyRepository.findById(input.companyId);
      if (!company) {
        return Result.fail(new Error("الشركة المحددة غير موجودة في النظام."));
      }

      const entryDate = BusinessDate.fromString(input.entryDate);
      const settings = await this.settingsRepository.getSettings();

      const year = entryDate.toDate().getUTCFullYear();
      const receiptNumberStr = await this.counterService.getNextFormattedNumber("IN", year);
      const receiptNumber = ReceiptNumber.fromString(receiptNumberStr);

      const receiptId = receiptNumber.getValue().toLowerCase();

      const domainLines: InboundLine[] = [];
      const lots: Lot[] = [];
      const locations: StockLocation[] = [];

      for (let i = 0; i < input.lines.length; i++) {
        const lineInput = input.lines[i];
        const lineId = `${receiptId}-line-${i + 1}`;

        // 1. Fetch fish item & size snapshots
        const fishItem = await this.catalogRepository.findFishItemById(lineInput.fishItemId);
        if (!fishItem) {
          return Result.fail(new Error(`صنف الصيد (${lineInput.fishItemId}) غير موجود.`));
        }

        const fishSize = await this.catalogRepository.findFishSizeById(lineInput.fishSizeId);
        if (!fishSize) {
          return Result.fail(new Error(`حجم الصيد (${lineInput.fishSizeId}) غير موجود.`));
        }

        // 2. Compute effective rate snapshot
        const effectiveRate = await this.catalogRepository.getEffectiveDailyRate(
          lineInput.fishItemId,
          lineInput.fishSizeId
        );

        const totalWeight = Weight.fromKilograms(lineInput.totalWeightKg);
        const domainDistributions = lineInput.distributions.map((d) => ({
          warehouseId: d.warehouseId,
          weight: Weight.fromKilograms(d.weightKg),
        }));

        domainLines.push({
          id: lineId,
          fishItemId: lineInput.fishItemId,
          fishSizeId: lineInput.fishSizeId,
          totalWeight,
          distributions: domainDistributions,
        });

        // 3. Generate atomic lot number
        const lotNumberStr = await this.counterService.getNextFormattedNumber("LOT", year);
        const lotNumber = ReceiptNumber.fromString(lotNumberStr);
        const lotId = lotNumber.getValue().toLowerCase();

        // 4. Create Lot with Snapshots
        const lot = Lot.create({
          id: lotId,
          lotNumber,
          inboundReceiptId: receiptId,
          companyId: company.getId(),
          fishItemId: fishItem.getId(),
          fishSizeId: fishSize.getId(),
          fishNameSnapshot: fishItem.getName(),
          fishSizeSnapshot: fishSize.getLabel(),
          baseDailyRateSnapshot: effectiveRate,
          freeDaysSnapshot: settings.getDefaultFreeDays(),
          stageDaysSnapshot: settings.getStageDays(),
          doublingFactorSnapshot: settings.getDoublingFactor(),
          originalWeight: totalWeight,
          entryDate,
          createdBy: input.actor.userId,
        });
        lots.push(lot);

        // 5. Create Stock Locations for this lot
        for (let j = 0; j < domainDistributions.length; j++) {
          const dist = domainDistributions[j];
          const locId = `${lotId}-loc-${j + 1}`;
          locations.push(
            StockLocation.create({
              id: locId,
              lotId,
              warehouseId: dist.warehouseId,
              remainingWeight: dist.weight,
            })
          );
        }
      }

      // 6. Build Inbound Receipt
      const receipt = InboundReceipt.create({
        id: receiptId,
        receiptNumber,
        companyId: company.getId(),
        entryDate,
        lines: domainLines,
        notes: input.notes,
        createdBy: input.actor.userId,
      });

      // 7. Save atomically via batch
      await this.inboundRepository.save(receipt, lots, locations);

      // 8. Audit entry
      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "CREATE_INBOUND",
        entityType: "InboundReceipt",
        entityId: receipt.getId(),
        reference: receipt.getReceiptNumber().getValue(),
        after: {
          receiptNumber: receipt.getReceiptNumber().getValue(),
          companyId: receipt.getCompanyId(),
          entryDate: receipt.getEntryDate().toString(),
          lotsCount: lots.length,
        },
      });

      return Result.ok(receipt);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
