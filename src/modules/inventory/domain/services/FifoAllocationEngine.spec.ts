import { describe, it, expect } from "vitest";
import { FifoAllocationEngine, UserLocationChoice } from "./FifoAllocationEngine";
import { Lot } from "../Lot";
import { StockLocation } from "../StockLocation";
import { Weight } from "@/core/domain/value-objects/Weight";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { DailyStorageRate } from "@/core/domain/value-objects/DailyStorageRate";
import { ReceiptNumber } from "@/core/domain/value-objects/ReceiptNumber";
import { InsufficientStockError } from "@/core/domain/errors/InventoryErrors";

function makeLot(
  id: string,
  num: string,
  entryIso: string,
  kg: number,
  createdAtMs: number
): Lot {
  return Lot.reconstitute({
    id,
    lotNumber: ReceiptNumber.fromString(num),
    inboundReceiptId: "in-1",
    companyId: "com-1",
    fishItemId: "fish-1",
    fishSizeId: "size-1",
    fishNameSnapshot: "تونة",
    fishSizeSnapshot: "3/5",
    baseDailyRateSnapshot: DailyStorageRate.fromYer(5),
    freeDaysSnapshot: 15,
    stageDaysSnapshot: 30,
    doublingFactorSnapshot: 2,
    originalWeight: Weight.fromKilograms(kg),
    remainingWeight: Weight.fromKilograms(kg),
    entryDate: BusinessDate.fromString(entryIso),
    status: "OPEN",
    createdBy: "user-1",
    createdAt: new Date(createdAtMs),
    updatedAt: new Date(createdAtMs),
  });
}

function makeLocation(
  id: string,
  lotId: string,
  warehouseId: string,
  kg: number
): StockLocation {
  return StockLocation.reconstitute({
    id,
    lotId,
    warehouseId,
    remainingWeight: Weight.fromKilograms(kg),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe("FifoAllocationEngine", () => {
  it("allocates strictly by entryDate ASC (FIFO order)", () => {
    // Lot A entered Oct 01 (8,000 KG)
    const lotA = makeLot("lot-a", "LOT-2026-000001", "2026-10-01", 8000, 1000);
    // Lot B entered Oct 05 (10,000 KG)
    const lotB = makeLot("lot-b", "LOT-2026-000002", "2026-10-05", 10000, 2000);

    const locationsMap = new Map<string, StockLocation[]>([
      ["lot-a", [makeLocation("loc-a1", "lot-a", "WH-1", 8000)]],
      ["lot-b", [makeLocation("loc-b1", "lot-b", "WH-2", 10000)]],
    ]);

    // Request 9,000 KG
    const plan = FifoAllocationEngine.calculateFifoPlan(
      [lotB, lotA], // Pass in reversed order to ensure sorting works
      locationsMap,
      Weight.fromKilograms(9000)
    );

    expect(plan.length).toBe(2);
    expect(plan[0].lot.getId()).toBe("lot-a");
    expect(plan[0].allocatedWeight.toKilograms()).toBe(8000);

    expect(plan[1].lot.getId()).toBe("lot-b");
    expect(plan[1].allocatedWeight.toKilograms()).toBe(1000);
  });

  it("works across warehouses without bias towards warehouse code", () => {
    // Lot A in WH-NORTH entered Oct 01 (5,000 KG)
    const lotA = makeLot("lot-a", "LOT-2026-000001", "2026-10-01", 5000, 1000);
    // Lot B in WH-SOUTH entered Oct 04 (7,000 KG)
    const lotB = makeLot("lot-b", "LOT-2026-000002", "2026-10-04", 7000, 2000);

    const locationsMap = new Map<string, StockLocation[]>([
      ["lot-a", [makeLocation("loc-a", "lot-a", "WH-NORTH", 5000)]],
      ["lot-b", [makeLocation("loc-b", "lot-b", "WH-SOUTH", 7000)]],
    ]);

    // Request 3,000 KG -> MUST be from Lot A (WH-NORTH)
    const plan = FifoAllocationEngine.calculateFifoPlan(
      [lotA, lotB],
      locationsMap,
      Weight.fromKilograms(3000)
    );

    expect(plan.length).toBe(1);
    expect(plan[0].lot.getId()).toBe("lot-a");
    expect(plan[0].allocatedWeight.toKilograms()).toBe(3000);
  });

  it("allows employee to pick warehouse location within the same lot", () => {
    // Lot A is split: 6,000 in WH-1 and 4,000 in WH-2
    const lotA = makeLot("lot-a", "LOT-2026-000001", "2026-10-01", 10000, 1000);
    const loc1 = makeLocation("loc-1", "lot-a", "WH-1", 6000);
    const loc2 = makeLocation("loc-2", "lot-a", "WH-2", 4000);

    const locationsMap = new Map<string, StockLocation[]>([
      ["lot-a", [loc1, loc2]],
    ]);

    // Plan for 3,000 KG from Lot A
    const plan = FifoAllocationEngine.calculateFifoPlan(
      [lotA],
      locationsMap,
      Weight.fromKilograms(3000)
    );

    expect(plan.length).toBe(1);

    // Employee chooses to take all 3,000 KG from WH-2
    const choicesMap = new Map<string, UserLocationChoice[]>([
      [
        "lot-a",
        [
          {
            stockLocationId: "loc-2",
            warehouseId: "WH-2",
            weight: Weight.fromKilograms(3000),
          },
        ],
      ],
    ]);

    const allocations = FifoAllocationEngine.validateAndBuildAllocations(plan, choicesMap);
    expect(allocations.length).toBe(1);
    expect(allocations[0].warehouseId).toBe("WH-2");
    expect(allocations[0].weight.toKilograms()).toBe(3000);
  });

  it("throws InsufficientStockError when requested weight exceeds total available", () => {
    const lotA = makeLot("lot-a", "LOT-2026-000001", "2026-10-01", 4350, 1000);
    const locationsMap = new Map<string, StockLocation[]>([
      ["lot-a", [makeLocation("loc-a", "lot-a", "WH-1", 4350)]],
    ]);

    expect(() =>
      FifoAllocationEngine.calculateFifoPlan(
        [lotA],
        locationsMap,
        Weight.fromKilograms(5000)
      )
    ).toThrow(InsufficientStockError);
  });
});
