import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { CatalogManagerView } from "./CatalogManagerView";

export default async function CatalogPage() {
  const user = await requireAuth();
  const fishItems = await container.catalogRepository.findAllFishItems();

  const fullCatalog = [];
  for (const item of fishItems) {
    const sizes = await container.catalogRepository.findSizesByFishItemId(item.getId());
    fullCatalog.push({
      id: item.getId(),
      name: item.getName(),
      defaultRateYer: item.getDefaultDailyRate().toYer(),
      active: item.isActive(),
      sizes: sizes.map((s) => ({
        id: s.getId(),
        label: s.getLabel(),
        overrideRateYer: s.getDailyRateOverride() ? s.getDailyRateOverride()!.toYer() : null,
      })),
    });
  }

  const isManager = user.role === "WAREHOUSE_MANAGER" || user.role === "GENERAL_MANAGER";

  return <CatalogManagerView catalog={fullCatalog} isManager={isManager} />;
}
