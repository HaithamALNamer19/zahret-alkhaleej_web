import { LotRepository, StockLocationRepository } from "../ports/InventoryRepositories";
import { CompanyRepository } from "@/modules/companies/application/ports/CompanyRepository";
import { FifoAllocationEngine, LotAllocationPlanItem } from "../../domain/services/FifoAllocationEngine";
import { StockLocation } from "../../domain/StockLocation";
import { Weight } from "@/core/domain/value-objects/Weight";
import { Result } from "@/core/application/result/Result";
import { CompanyWithdrawalBlockedError } from "@/core/domain/errors/InventoryErrors";

export interface PreviewFifoInput {
  companyId: string;
  fishItemId: string;
  fishSizeId: string;
  requestedWeightKg: number;
}

export interface LocationDto {
  stockLocationId: string;
  warehouseId: string;
  remainingWeightKg: number;
}

export interface PlanItemDto {
  lotId: string;
  lotNumber: string;
  entryDate: string;
  allocatedWeightKg: number;
  remainingWeightInLotKg: number;
  availableLocations: LocationDto[];
}

export interface PreviewFifoOutput {
  companyName: string;
  requestedWeightKg: number;
  plan: PlanItemDto[];
}

export class PreviewOutboundFifoAllocationUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly lotRepository: LotRepository,
    private readonly stockLocationRepository: StockLocationRepository
  ) {}

  public async execute(input: PreviewFifoInput): Promise<Result<PreviewFifoOutput, Error>> {
    try {
      const company = await this.companyRepository.findById(input.companyId);
      if (!company) {
        return Result.fail(new Error("الشركة غير موجودة."));
      }

      if (company.isWithdrawalBlocked()) {
        return Result.fail(
          new CompanyWithdrawalBlockedError(
            company.getName(),
            company.getWithdrawalBlockReason()
          )
        );
      }

      const requestedWeight = Weight.fromKilograms(input.requestedWeightKg);

      // 1. Fetch open lots for (company + fish + size)
      const openLots = await this.lotRepository.findOpenLotsByStockKey(
        input.companyId,
        input.fishItemId,
        input.fishSizeId
      );

      // 2. Fetch stock locations for these lots
      const locationsMap = new Map<string, StockLocation[]>();
      for (const lot of openLots) {
        const locs = await this.stockLocationRepository.findByLotId(lot.getId());
        locationsMap.set(lot.getId(), locs);
      }

      // 3. Compute FIFO plan
      const plan = FifoAllocationEngine.calculateFifoPlan(
        openLots,
        locationsMap,
        requestedWeight
      );

      const planDtos: PlanItemDto[] = plan.map((item) => ({
        lotId: item.lot.getId(),
        lotNumber: item.lot.getLotNumber().getValue(),
        entryDate: item.lot.getEntryDate().toString(),
        allocatedWeightKg: item.allocatedWeight.toKilograms(),
        remainingWeightInLotKg: item.lot.getRemainingWeight().toKilograms(),
        availableLocations: item.availableLocations.map((loc) => ({
          stockLocationId: loc.getId(),
          warehouseId: loc.getWarehouseId(),
          remainingWeightKg: loc.getRemainingWeight().toKilograms(),
        })),
      }));

      return Result.ok({
        companyName: company.getName(),
        requestedWeightKg: input.requestedWeightKg,
        plan: planDtos,
      });
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
