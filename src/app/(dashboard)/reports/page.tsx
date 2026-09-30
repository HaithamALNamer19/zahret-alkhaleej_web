import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { ReportsView } from "./ReportsView";

export default async function ReportsPage() {
  const user = await requireAuth();
  const isManager = user.role === "WAREHOUSE_MANAGER" || user.role === "GENERAL_MANAGER";

  const companies = await container.companyRepository.findAll();
  const warehouses = await container.warehouseRepository.findAll();
  const fishItems = await container.catalogRepository.findAllFishItems();

  return (
    <ReportsView
      isManager={isManager}
      companies={companies.map((c) => ({ id: c.getId(), name: c.getName(), code: c.getCode().getValue() }))}
      warehouses={warehouses.map((w) => ({ id: w.getId(), name: w.getName(), code: w.getCode() }))}
      fishItems={fishItems.map((f) => ({ id: f.getId(), name: f.getName() }))}
    />
  );
}
