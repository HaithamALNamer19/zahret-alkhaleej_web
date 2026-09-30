import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { WarehouseManagerView } from "./WarehouseManagerView";

export default async function WarehousesPage() {
  const user = await requireAuth();
  const warehouses = await container.warehouseRepository.findAll();
  const isManager = user.role === "WAREHOUSE_MANAGER" || user.role === "GENERAL_MANAGER";

  return (
    <WarehouseManagerView
      warehouses={warehouses.map((w) => ({
        id: w.getId(),
        code: w.getCode(),
        name: w.getName(),
        notes: w.getNotes(),
        status: w.getStatus(),
        createdAt: w.getCreatedAt().toISOString(),
      }))}
      isManager={isManager}
    />
  );
}
