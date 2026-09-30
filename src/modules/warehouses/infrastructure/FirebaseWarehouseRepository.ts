import { WarehouseRepository } from "../application/ports/WarehouseRepository";
import { Warehouse, WarehouseStatus } from "../domain/Warehouse";
import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export class FirebaseWarehouseRepository implements WarehouseRepository {
  private readonly collection = adminFirestore.collection("warehouses");

  public async findById(id: string): Promise<Warehouse | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapDocToWarehouse(doc.id, doc.data()!);
  }

  public async findByCode(code: string): Promise<Warehouse | null> {
    const snap = await this.collection.where("code", "==", code.trim().toUpperCase()).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return this.mapDocToWarehouse(doc.id, doc.data());
  }

  public async findAll(): Promise<Warehouse[]> {
    const snap = await this.collection.orderBy("code", "asc").get();
    return snap.docs.map((doc) => this.mapDocToWarehouse(doc.id, doc.data()));
  }

  public async save(warehouse: Warehouse): Promise<void> {
    const data = {
      code: warehouse.getCode(),
      name: warehouse.getName(),
      notes: warehouse.getNotes() || "",
      status: warehouse.getStatus(),
      createdAt: admin.firestore.Timestamp.fromDate(warehouse.getCreatedAt()),
      updatedAt: admin.firestore.Timestamp.fromDate(warehouse.getUpdatedAt()),
    };

    await this.collection.doc(warehouse.getId()).set(data, { merge: true });
  }

  private mapDocToWarehouse(id: string, data: admin.firestore.DocumentData): Warehouse {
    return Warehouse.reconstitute({
      id,
      code: data.code,
      name: data.name,
      notes: data.notes || "",
      status: (data.status as WarehouseStatus) || "ACTIVE",
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toDate() || new Date(),
    });
  }
}
