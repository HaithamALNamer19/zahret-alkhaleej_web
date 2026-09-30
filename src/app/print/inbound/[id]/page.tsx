export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { container } from "@/server/container";
import { PrintButton } from "@/shared/components/PrintButton";

export default async function PrintInboundReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inb = await container.inboundRepository.findById(id);
  if (!inb) notFound();

  const company = await container.companyRepository.findById(inb.getCompanyId());
  const settings = await container.settingsRepository.getSettings();

  // Load fish items and sizes
  const catalog = await container.catalogRepository.findAllFishItems();
  const fishMap = new Map<string, string>();
  for (const f of catalog) fishMap.set(f.getId(), f.getName());

  let totalWeightKg = 0;
  for (const line of inb.getLines()) {
    totalWeightKg += line.totalWeight.toKilograms();
  }

  return (
    <div className="bg-white min-h-screen p-8 text-black font-sans print:p-0">
      {/* Print Trigger Button (Hidden when printing) */}
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton label="طباعة سند الإدخال (A4)" />
      </div>

      <div className="border border-slate-300 p-8 rounded-xl max-w-4xl mx-auto space-y-6 print:border-none print:p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
          <div className="text-right space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {settings.getCompanyDisplayName()}
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              إدارة مستودعات التبريد والمخازن السمكية
            </p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl mb-1">
              ZK
            </div>
            <span className="text-[10px] text-slate-400 font-bold">ZAHRET AL KHALEEJ</span>
          </div>

          <div className="text-left space-y-1 font-mono text-xs">
            <div>
              <span className="text-slate-500">رقم السند:</span>{" "}
              <strong className="text-sm font-black">{inb.getReceiptNumber().getValue()}</strong>
            </div>
            <div>
              <span className="text-slate-500">التاريخ:</span>{" "}
              <strong>{inb.getEntryDate().formatArabic()}</strong>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-lg font-black bg-slate-100 py-1.5 px-6 rounded-lg inline-block border border-slate-200">
            سند إدخال صيد (مستودعات التبريد)
          </h2>
          {inb.getStatus() === "CANCELLED" && (
            <div className="text-rose-600 font-black text-sm border border-rose-300 bg-rose-50 py-1 px-4 rounded mt-1">
              ⚠️ هذا السند ملغي (CANCELLED)
              {inb.getCancellationReason() && ` - السبب: ${inb.getCancellationReason()}`}
            </div>
          )}
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-500 font-semibold">اسم الشركة المودعة:</span>{" "}
            <strong className="text-slate-900 text-sm font-bold">{company?.getName()}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">كود العميل:</span>{" "}
            <strong className="font-mono">{company?.getCode().getValue()}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">المسؤول:</span>{" "}
            <span>{company?.getContactPerson() || "—"}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">رقم الهاتف:</span>{" "}
            <span className="font-mono">{company?.getPhone() || "—"}</span>
          </div>
        </div>

        {/* Table of Fish Lines */}
        <table className="w-full text-right text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <th className="p-2.5 border border-slate-300 w-12 text-center">#</th>
              <th className="p-2.5 border border-slate-300">الصنف</th>
              <th className="p-2.5 border border-slate-300">الحجم</th>
              <th className="p-2.5 border border-slate-300">الوزن الإجمالي</th>
              <th className="p-2.5 border border-slate-300">توزيع المستودعات</th>
            </tr>
          </thead>
          <tbody>
            {inb.getLines().map((line, idx) => (
              <tr key={line.id} className="border-b border-slate-200">
                <td className="p-2.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                <td className="p-2.5 border border-slate-300 font-bold">
                  {fishMap.get(line.fishItemId) || line.fishItemId}
                </td>
                <td className="p-2.5 border border-slate-300">{line.fishSizeId}</td>
                <td className="p-2.5 border border-slate-300 font-bold font-mono">
                  {line.totalWeight.toKilograms().toLocaleString("ar-YE")} كجم
                </td>
                <td className="p-2.5 border border-slate-300 text-[11px]">
                  {line.distributions
                    .map((d) => `${d.warehouseId} (${d.weight.toKilograms()} كجم)`)
                    .join(" • ")}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-800">
              <td colSpan={3} className="p-2.5 border border-slate-300 text-left">
                الإجمالي العام:
              </td>
              <td colSpan={2} className="p-2.5 border border-slate-300 font-black text-sm font-mono">
                {totalWeightKg.toLocaleString("ar-YE")} كجم ({(totalWeightKg / 1000).toFixed(3)} طن)
              </td>
            </tr>
          </tbody>
        </table>

        {inb.getNotes() && (
          <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-700 block mb-0.5">ملاحظات:</span>
            <p className="text-slate-600">{inb.getNotes()}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-12">
            <span className="font-bold text-slate-700 block">مندوب الشركة المودعة</span>
            <span className="block border-b border-slate-400 w-3/4 mx-auto" />
            <span className="text-slate-400 block text-[10px]">التوقيع والاسم</span>
          </div>

          <div className="space-y-12">
            <span className="font-bold text-slate-700 block">مسؤول المستودع</span>
            <span className="block border-b border-slate-400 w-3/4 mx-auto" />
            <span className="text-slate-400 block text-[10px]">التوقيع والاسم</span>
          </div>

          <div className="space-y-12">
            <span className="font-bold text-slate-700 block">الختم المعتمد</span>
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-300">
              ختم الشركة
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
