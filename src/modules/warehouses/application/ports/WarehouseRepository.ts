import { Warehouse } from "../../domain/Warehouse";

export interface WarehouseRepository {
  findById(id: string): Promise<Warehouse | null>;
  findByCode(code: string): Promise<Warehouse | null>;
  findAll(): Promise<Warehouse[]>;
  save(warehouse: Warehouse): Promise<void>;
}
