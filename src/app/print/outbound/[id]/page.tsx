export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { container } from "@/server/container";
import { PrintButton } from "@/shared/components/PrintButton";

export default async function PrintOutboundReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const outb = await container.outboundRepository.findById(id);
  if (!outb) notFound();

  const [company, settings, catalog, warehouses, allocations] = await Promise.all([
    container.companyRepository.findById(outb.getCompanyId()),
    container.settingsRepository.getSettings(),
    container.catalogRepository.findAllFishItems(),
    container.warehouseRepository.findAll(),
    container.outboundRepository.findAllocationsByReceiptId(id),
  ]);

  const fishMap = new Map<string, string>();
  for (const f of catalog) fishMap.set(f.getId(), f.getName());

  const whMap = new Map<string, string>();
  for (const w of warehouses) whMap.set(w.getId(), w.getName());

  let totalWeightKg = 0;
  for (const line of outb.getLines()) {
    totalWeightKg += line.requestedWeight.toKilograms();
  }

  // Group allocations by lineId
  const allocsByLine = new Map<string, typeof allocations>();
  for (const a of allocations) {
    const list = allocsByLine.get(a.getOutboundLineId()) || [];
    list.push(a);
    allocsByLine.set(a.getOutboundLineId(), list);
  }

  return (
    <div className="bg-white min-h-screen p-8 text-black font-sans print:p-0">
      {/* Print Trigger Button (Hidden when printing) */}
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton label="طباعة سند الصرف (A4)" />
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
              <strong className="text-sm font-black">{outb.getReceiptNumber().getValue()}</strong>
            </div>
            <div>
              <span className="text-slate-500">تاريخ الصرف:</span>{" "}
              <strong>{outb.getWithdrawalDate().formatArabic()}</strong>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black bg-slate-100 py-1.5 px-6 rounded-lg inline-block border border-slate-200">
            سند صرف وتسليم بضاعة (OUTBOUND DISPATCH)
          </h2>
          {outb.getStatus() === "CANCELLED" && (
            <div className="text-rose-600 font-black text-sm border border-rose-300 bg-rose-50 py-1 px-4 rounded">
              ⚠️ هذا السند ملغي (CANCELLED)
              {outb.getCancellationReason() && ` - السبب: ${outb.getCancellationReason()}`}
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

        {/* Table of Outbound Lines */}
        <table className="w-full text-right text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <th className="p-2.5 border border-slate-300 w-12 text-center">#</th>
              <th className="p-2.5 border border-slate-300">الصنف السمكي</th>
              <th className="p-2.5 border border-slate-300">الحجم</th>
              <th className="p-2.5 border border-slate-300">الوزن المصروف</th>
              <th className="p-2.5 border border-slate-300">تفاصيل السحب (المستودع / الدفعة)</th>
            </tr>
          </thead>
          <tbody>
            {outb.getLines().map((line, idx) => {
              const lineAllocs = allocsByLine.get(line.id) || [];
              return (
                <tr key={line.id} className="border-b border-slate-200">
                  <td className="p-2.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                  <td className="p-2.5 border border-slate-300 font-bold">
                    {fishMap.get(line.fishItemId) || line.fishItemId}
                  </td>
                  <td className="p-2.5 border border-slate-300">{line.fishSizeId}</td>
                  <td className="p-2.5 border border-slate-300 font-bold font-mono">
                    {line.requestedWeight.toKilograms().toLocaleString("ar-YE")} كجم
                  </td>
                  <td className="p-2.5 border border-slate-300 text-[11px] leading-relaxed">
                    {lineAllocs.length > 0 ? (
                      <div className="space-y-1">
                        {lineAllocs.map((al) => (
                          <div key={al.getId()} className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-700">
                              {whMap.get(al.getWarehouseId()) || al.getWarehouseId()}:
                            </span>
                            <span>{al.getWeight().toKilograms().toLocaleString("ar-YE")} كجم</span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              (دفعة #{al.getLotId().slice(0, 8)})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">تخصيص FIFO الآلي</span>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-800">
              <td colSpan={3} className="p-2.5 border border-slate-300 text-left">
                إجمالي الوزن المصروف:
              </td>
              <td colSpan={2} className="p-2.5 border border-slate-300 font-black text-sm font-mono text-emerald-800">
                {totalWeightKg.toLocaleString("ar-YE")} كجم ({(totalWeightKg / 1000).toFixed(3)} طن)
              </td>
            </tr>
          </tbody>
        </table>

        {/* Invariant Note regarding withdrawal effect */}
        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
          <strong>ملاحظة نظام التخزين:</strong> وفقاً للائحة مستودعات التبريد، يدخل تخفيض رسوم التخزين للكميات المصروفة حيز التنفيذ ابتداءً من اليوم التالي لتاريخ الصرف ({outb.getWithdrawalDate().formatArabic()}).
        </div>

        {outb.getNotes() && (
          <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-700 block mb-0.5">ملاحظات:</span>
            <p className="text-slate-600">{outb.getNotes()}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-12">
            <span className="font-bold text-slate-700 block">مندوب المستلم / السائق</span>
            <span className="block border-b border-slate-400 w-3/4 mx-auto" />
            <span className="text-slate-400 block text-[10px]">الاسم، التوقيع ورقم الهوية</span>
          </div>

          <div className="space-y-12">
            <span className="font-bold text-slate-700 block">مسؤول الصرف بالمستودع</span>
            <span className="block border-b border-slate-400 w-3/4 mx-auto" />
            <span className="text-slate-400 block text-[10px]">الاسم والتوقيع</span>
          </div>

          <div className="space-y-12">
            <span className="font-bold text-slate-700 block">إدارة المستودعات (الختم)</span>
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-300">
              ختم الإدارة
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
