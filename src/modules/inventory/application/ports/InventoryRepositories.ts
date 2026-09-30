import { InboundReceipt } from "../../domain/InboundReceipt";
import { Lot } from "../../domain/Lot";
import { StockLocation } from "../../domain/StockLocation";
import { OutboundReceipt } from "../../domain/OutboundReceipt";
import { OutboundAllocation } from "../../domain/OutboundAllocation";

export interface InboundReceiptRepository {
  findById(id: string): Promise<InboundReceipt | null>;
  findByNumber(number: string): Promise<InboundReceipt | null>;
  findAll(companyId?: string): Promise<InboundReceipt[]>;
  save(receipt: InboundReceipt, lots: Lot[], locations: StockLocation[]): Promise<void>;
  updateReceiptStatus(id: string, status: "CANCELLED", cancelledBy: string, reason: string): Promise<void>;
}

export interface LotRepository {
  findById(id: string): Promise<Lot | null>;
  findByLotNumber(number: string): Promise<Lot | null>;
  findOpenLotsByStockKey(companyId: string, fishItemId: string, fishSizeId: string): Promise<Lot[]>;
  findByCompanyId(companyId: string): Promise<Lot[]>;
  findAllOpenLots(): Promise<Lot[]>;
  save(lot: Lot, transaction?: FirebaseFirestore.Transaction): Promise<void>;
}

export interface StockLocationRepository {
  findByLotId(lotId: string): Promise<StockLocation[]>;
  findByWarehouseId(warehouseId: string): Promise<StockLocation[]>;
  findAll(): Promise<StockLocation[]>;
  save(location: StockLocation, transaction?: FirebaseFirestore.Transaction): Promise<void>;
}

export interface OutboundReceiptRepository {
  findById(id: string): Promise<OutboundReceipt | null>;
  findByNumber(number: string): Promise<OutboundReceipt | null>;
  findAll(companyId?: string): Promise<OutboundReceipt[]>;
  findAllocationsByReceiptId(receiptId: string): Promise<OutboundAllocation[]>;
  findAllocationsByLotId(lotId: string): Promise<OutboundAllocation[]>;
  findAllAllocations(): Promise<OutboundAllocation[]>;
}
