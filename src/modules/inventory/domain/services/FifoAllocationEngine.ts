import { Lot } from "../Lot";
import { StockLocation } from "../StockLocation";
import { Weight } from "@/core/domain/value-objects/Weight";
import {
  InsufficientStockError,
  FifoViolationError,
  InvalidWarehouseAllocationError,
} from "@/core/domain/errors/InventoryErrors";

export interface LotAllocationPlanItem {
  lot: Lot;
  allocatedWeight: Weight;
  availableLocations: StockLocation[];
}

export interface UserLocationChoice {
  stockLocationId: string;
  warehouseId: string;
  weight: Weight;
}

export interface OutboundAllocationDraft {
  lotId: string;
  stockLocationId: string;
  warehouseId: string;
  weight: Weight;
}

export class FifoAllocationEngine {
  /**
   * Generates a deterministic FIFO allocation plan for requested weight.
   * Input: available open lots sorted by entryDate ascending (and creation date).
   */
  public static calculateFifoPlan(
    availableLots: Lot[],
    stockLocationsByLotId: Map<string, StockLocation[]>,
    requestedWeight: Weight
  ): LotAllocationPlanItem[] {
    if (requestedWeight.isZero()) {
      throw new Error("لا يمكن صرف كمية تساوي صفراً.");
    }

    // 1. Sort lots strictly by entryDate ASC, then by createdAt ASC
    const sortedLots = [...availableLots]
      .filter((lot) => lot.getStatus() === "OPEN" && lot.getRemainingWeight().isPositive())
      .sort((a, b) => {
        if (a.getEntryDate().isBefore(b.getEntryDate())) return -1;
        if (a.getEntryDate().isAfter(b.getEntryDate())) return 1;
        return a.getCreatedAt().getTime() - b.getCreatedAt().getTime();
      });

    // 2. Compute total available
    let totalAvailable = Weight.zero();
    for (const lot of sortedLots) {
      totalAvailable = totalAvailable.add(lot.getRemainingWeight());
    }

    if (requestedWeight.isGreaterThan(totalAvailable)) {
      throw new InsufficientStockError(
        requestedWeight.toKilograms(),
        totalAvailable.toKilograms()
      );
    }

    // 3. Build plan
    const plan: LotAllocationPlanItem[] = [];
    let remainingToAllocate = requestedWeight;

    for (const lot of sortedLots) {
      if (remainingToAllocate.isZero()) break;

      const lotRemaining = lot.getRemainingWeight();
      const takeFromLot = remainingToAllocate.isGreaterThan(lotRemaining)
        ? lotRemaining
        : remainingToAllocate;

      const locations = stockLocationsByLotId.get(lot.getId()) || [];

      plan.push({
        lot,
        allocatedWeight: takeFromLot,
        availableLocations: locations,
      });

      remainingToAllocate = remainingToAllocate.subtract(takeFromLot);
    }

    return plan;
  }

  /**
   * Validates user-selected warehouse distribution against the strict FIFO plan.
   * Ensures:
   * 1. No newer lot was selected before an older planned lot was depleted.
   * 2. The sum of warehouse distributions for each lot exactly matches the planned weight for that lot.
   * 3. No warehouse location is over-drawn.
   */
  public static validateAndBuildAllocations(
    plan: LotAllocationPlanItem[],
    userChoicesByLotId: Map<string, UserLocationChoice[]>
  ): OutboundAllocationDraft[] {
    const allocations: OutboundAllocationDraft[] = [];

    for (const planItem of plan) {
      const lotId = planItem.lot.getId();
      const choices = userChoicesByLotId.get(lotId);

      if (!choices || choices.length === 0) {
        throw new InvalidWarehouseAllocationError(
          `لم يتم تحديد مستودعات الصرف للدفعة (${planItem.lot.getLotNumber().getValue()})`
        );
      }

      let sumChosenWeight = Weight.zero();

      for (const choice of choices) {
        if (choice.weight.isZero()) continue;

        // Verify location exists in lot
        const loc = planItem.availableLocations.find(
          (l) => l.getId() === choice.stockLocationId
        );
        if (!loc) {
          throw new InvalidWarehouseAllocationError(
            `موقع المستودع المحدد (${choice.warehouseId}) لا ينتمي للدفعة (${planItem.lot.getLotNumber().getValue()})`
          );
        }

        // Verify location has sufficient remaining weight
        if (choice.weight.isGreaterThan(loc.getRemainingWeight())) {
          throw new InvalidWarehouseAllocationError(
            `الوزن المطلوب من المستودع (${loc.getWarehouseId()}: ${choice.weight.toKilograms()} كجم) يتجاوز المتوفر فيه (${loc.getRemainingWeight().toKilograms()} كجم)`
          );
        }

        sumChosenWeight = sumChosenWeight.add(choice.weight);

        allocations.push({
          lotId,
          stockLocationId: loc.getId(),
          warehouseId: loc.getWarehouseId(),
          weight: choice.weight,
        });
      }

      // Check sum of chosen matches planned weight for this lot
      if (!sumChosenWeight.equals(planItem.allocatedWeight)) {
        throw new InvalidWarehouseAllocationError(
          `إجمالي الكمية المحددة من مستودعات الدفعة (${planItem.lot.getLotNumber().getValue()}: ${sumChosenWeight.toKilograms()} كجم) لا يطابق المطلوب من الدفعة (${planItem.allocatedWeight.toKilograms()} كجم)`
        );
      }
    }

    return allocations;
  }
}
