import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { OutboundReceiptWizard } from "./OutboundReceiptWizard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function NewOutboundPage() {
  await requireAuth();

  const [companies, fishItems] = await Promise.all([
    container.companyRepository.findAll({ status: "ACTIVE" }),
    container.catalogRepository.findAllFishItems(),
  ]);

  const sizesResults = await Promise.all(
    fishItems.map((item) => container.catalogRepository.findSizesByFishItemId(item.getId()))
  );

  const sizesByFishId: Record<string, { id: string; label: string }[]> = {};
  fishItems.forEach((item, idx) => {
    sizesByFishId[item.getId()] = sizesResults[idx].map((s) => ({
      id: s.getId(),
      label: s.getLabel(),
    }));
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/outbound"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg border border-slate-200"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">إنشاء سند صرف صيد جديد (قاعدة FIFO)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            يتم تحديد أقدم الدفعات تلقائياً لنفس الصنف والحجم عبر جميع المستودعات مع إمكانية توزيع مواقع السحب
          </p>
        </div>
      </div>

      <OutboundReceiptWizard
        companies={companies.map((c) => ({
          id: c.getId(),
          name: c.getName(),
          code: c.getCode().getValue(),
          withdrawalBlocked: c.isWithdrawalBlocked(),
          withdrawalBlockReason: c.getWithdrawalBlockReason(),
        }))}
        fishItems={fishItems.map((f) => ({ id: f.getId(), name: f.getName() }))}
        sizesByFishId={sizesByFishId}
      />
    </div>
  );
}
