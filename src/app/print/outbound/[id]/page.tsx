export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { container } from "@/server/container";
import { OfficialLetterhead } from "@/shared/components/OfficialLetterhead";
import { DocumentQrCode, OfficialEmbossedSeal } from "@/shared/components/DocumentSecurity";

export default async function PrintOutboundReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const outb = await container.outboundRepository.findById(id);
  if (!outb) notFound();

  const [company, catalog, warehouses, allocations] = await Promise.all([
    container.companyRepository.findById(outb.getCompanyId()),
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

  const qrPayload = `OF-OUT|${outb.getReceiptNumber().getValue()}|${company?.getCode().getValue()}|${outb.getWithdrawalDate().toString()}|${totalWeightKg}KG`;

  return (
    <div className="bg-slate-200/80 min-h-screen p-4 sm:p-8 print:p-0 print:bg-white text-black font-sans">
      {/* Official A4 Letterhead Document with Mode Controller */}
      <OfficialLetterhead
        receiptNumber={outb.getReceiptNumber().getValue()}
        dateArabic={outb.getWithdrawalDate().formatArabic()}
        dateEnglish={outb.getWithdrawalDate().toString()}
        documentTitle="سند صرف وإفراج صيد (مستودعات التبريد)"
        documentSubtitle="OUTBOUND FISH RELEASE ORDER"
        isCancelled={outb.getStatus() === "CANCELLED"}
        cancellationReason={outb.getCancellationReason()}
        qrValue={qrPayload}
      >
        <div className="space-y-4">
          {/* Recipient / Company Info Box & QR Code */}
          <div className="flex items-stretch gap-3">
            <div className="flex-1 grid grid-cols-2 gap-2 text-xs bg-slate-50/90 p-3 rounded-lg border border-[#0e3a82]/25">
              <div>
                <span className="text-slate-500 font-semibold">الشركة المستفيدة:</span>{" "}
                <strong className="text-slate-900 text-sm font-black block mt-0.5">{company?.getName()}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">كود العميل:</span>{" "}
                <strong className="font-mono font-bold text-[#0e3a82] block mt-0.5">
                  {company?.getCode().getValue()}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">المسؤول المفوض:</span>{" "}
                <strong className="text-slate-800 block mt-0.5">{company?.getContactPerson() || "—"}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">رقم الهاتف:</span>{" "}
                <span className="font-mono font-bold text-slate-800 block mt-0.5">
                  {company?.getPhone() || "—"}
                </span>
              </div>
            </div>

            {/* Verification QR Code */}
            <div className="shrink-0 flex items-center justify-center">
              <DocumentQrCode value={qrPayload} size={68} label="تحقق الصرف" />
            </div>
          </div>

          {/* Table of Outbound Lines & Allocations */}
          <table className="w-full text-right text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-[#0e3a82] text-white font-bold">
                <th className="p-2 border border-slate-400 w-10 text-center">#</th>
                <th className="p-2 border border-slate-400">الصنف السمكي</th>
                <th className="p-2 border border-slate-400">الحجم</th>
                <th className="p-2 border border-slate-400">الوزن المصروف</th>
                <th className="p-2 border border-slate-400">تفاصيل السحب والتخصيص (FIFO)</th>
              </tr>
            </thead>
            <tbody>
              {outb.getLines().map((line, idx) => {
                const lineAllocs = allocsByLine.get(line.id) || [];
                return (
                  <tr key={line.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                    <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      {fishMap.get(line.fishItemId) || line.fishItemId}
                    </td>
                    <td className="p-2 border border-slate-300 font-semibold text-slate-700">
                      {line.fishSizeId}
                    </td>
                    <td className="p-2 border border-slate-300 font-bold font-mono text-[#0e3a82]">
                      {line.requestedWeight.toKilograms().toLocaleString("ar-YE")} كجم
                    </td>
                    <td className="p-2 border border-slate-300 text-[11px]">
                      {lineAllocs.length === 0 ? (
                        <span className="text-slate-400">قيد التخصيص الآلي</span>
                      ) : (
                        <div className="space-y-1">
                          {lineAllocs.map((al) => (
                            <div key={al.getId()} className="flex items-center gap-1.5 text-slate-700">
                              <span className="font-bold">
                                {whMap.get(al.getWarehouseId()) || al.getWarehouseId()}:
                              </span>
                              <span className="font-mono font-bold text-[#0e3a82]">
                                {al.getWeight().toKilograms().toLocaleString("ar-YE")} كجم
                              </span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                (دفعة #{al.getLotId().slice(0, 8)})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-100 font-bold border-t-2 border-[#0e3a82]">
                <td colSpan={3} className="p-2 border border-slate-300 text-left font-black text-slate-800">
                  إجمالي الوزن المصروف:
                </td>
                <td
                  colSpan={2}
                  className="p-2 border border-slate-300 font-black text-sm font-mono text-[#dc2626]"
                >
                  {totalWeightKg.toLocaleString("ar-YE")} كجم ({(totalWeightKg / 1000).toFixed(3)} طن)
                </td>
              </tr>
            </tbody>
          </table>

          {/* Storage Rule Notice */}
          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-[10.5px] text-amber-900 leading-relaxed">
            <strong>ملاحظة نظام التخزين:</strong> وفقاً للائحة مستودعات التبريد، يدخل تخفيض رسوم التخزين للكميات المصروفة حيز التنفيذ ابتداءً من اليوم التالي لتاريخ الصرف ({outb.getWithdrawalDate().formatArabic()}).
          </div>

          {/* Notes */}
          {outb.getNotes() && (
            <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block mb-0.5">ملاحظات:</span>
              <p className="text-slate-600">{outb.getNotes()}</p>
            </div>
          )}

          {/* Official Signatures & Seal Block */}
          <div className="pt-4 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-10">
              <span className="font-bold text-slate-800 block">المستلم / السائق</span>
              <span className="block border-b border-slate-400 w-3/4 mx-auto" />
              <span className="text-slate-500 block text-[10px]">الاسم، التوقيع ورقم الهوية</span>
            </div>

            <div className="space-y-10">
              <span className="font-bold text-slate-800 block">أمين مستودع التبريد</span>
              <span className="block border-b border-slate-400 w-3/4 mx-auto" />
              <span className="text-slate-500 block text-[10px]">التوقيع والاسم</span>
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="font-bold text-slate-800 block mb-1">الختم المعتمد</span>
              <OfficialEmbossedSeal dateStr={outb.getWithdrawalDate().toString()} size={88} />
            </div>
          </div>
        </div>
      </OfficialLetterhead>
    </div>
  );
}

