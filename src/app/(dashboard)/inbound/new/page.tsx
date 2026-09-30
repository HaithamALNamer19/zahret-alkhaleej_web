import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { InboundReceiptForm } from "./InboundReceiptForm";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function NewInboundPage() {
  await requireAuth();

  const companies = await container.companyRepository.findAll({ status: "ACTIVE" });
  const warehouses = await container.warehouseRepository.findAll();
  const fishItems = await container.catalogRepository.findAllFishItems();

  // Load sizes for each fish item
  const sizesByFishId: Record<string, { id: string; label: string; overrideYer: number | null }[]> = {};
  for (const item of fishItems) {
    const sizes = await container.catalogRepository.findSizesByFishItemId(item.getId());
    sizesByFishId[item.getId()] = sizes.map((s) => ({
      id: s.getId(),
      label: s.getLabel(),
      overrideYer: s.getDailyRateOverride() ? s.getDailyRateOverride()!.toYer() : null,
    }));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/inbound"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg border border-slate-200"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">إنشاء سند إدخال صيد جديد</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            كل سطر يتم إدخاله سينشئ دفعة مستقلة (Lot) مع لقطة ثابتة من السعر والقواعد وتوزيع المستودعات
          </p>
        </div>
      </div>

      <InboundReceiptForm
        companies={companies.map((c) => ({ id: c.getId(), name: c.getName(), code: c.getCode().getValue() }))}
        warehouses={warehouses.map((w) => ({ id: w.getId(), code: w.getCode(), name: w.getName() }))}
        fishItems={fishItems.map((f) => ({
          id: f.getId(),
          name: f.getName(),
          defaultRateYer: f.getDefaultDailyRate().toYer(),
        }))}
        sizesByFishId={sizesByFishId}
      />
    </div>
  );
}
