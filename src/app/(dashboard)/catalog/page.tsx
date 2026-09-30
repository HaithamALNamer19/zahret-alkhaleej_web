import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { CatalogManagerView } from "./CatalogManagerView";

export default async function CatalogPage() {
  const user = await requireAuth();
  const fishItems = await container.catalogRepository.findAllFishItems();

  const sizesResults = await Promise.all(
    fishItems.map((item) => container.catalogRepository.findSizesByFishItemId(item.getId()))
  );

  const fullCatalog = fishItems.map((item, idx) => ({
    id: item.getId(),
    name: item.getName(),
    defaultRateYer: item.getDefaultDailyRate().toYer(),
    active: item.isActive(),
    sizes: sizesResults[idx].map((s) => ({
      id: s.getId(),
      label: s.getLabel(),
      overrideRateYer: s.getDailyRateOverride() ? s.getDailyRateOverride()!.toYer() : null,
    })),
  }));

  const isManager = user.role === "WAREHOUSE_MANAGER" || user.role === "GENERAL_MANAGER";

  return <CatalogManagerView catalog={fullCatalog} isManager={isManager} />;
}
