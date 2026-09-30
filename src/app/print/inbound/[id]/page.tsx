export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { container } from "@/server/container";
import { PrintButton } from "@/shared/components/PrintButton";
import { OfficialLetterhead } from "@/shared/components/OfficialLetterhead";

export default async function PrintInboundReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inb = await container.inboundRepository.findById(id);
  if (!inb) notFound();

  const company = await container.companyRepository.findById(inb.getCompanyId());

  // Load fish items
  const catalog = await container.catalogRepository.findAllFishItems();
  const fishMap = new Map<string, string>();
  for (const f of catalog) fishMap.set(f.getId(), f.getName());

  let totalWeightKg = 0;
  for (const line of inb.getLines()) {
    totalWeightKg += line.totalWeight.toKilograms();
  }

  return (
    <div className="bg-slate-100 min-h-screen p-4 sm:p-8 print:p-0 print:bg-white text-black font-sans">
      {/* Print Trigger Button (Hidden when printing) */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center print:hidden">
        <a
          href={`/inbound`}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm"
        >
          ← العودة لسندات الإدخال
        </a>
        <PrintButton label="طباعة سند الإدخال الرسمي (A4)" />
      </div>

      {/* Official A4 Letterhead Document */}
      <OfficialLetterhead
        receiptNumber={inb.getReceiptNumber().getValue()}
        dateArabic={inb.getEntryDate().formatArabic()}
        dateEnglish={inb.getEntryDate().toString()}
        documentTitle="سند إدخال صيد (مستودعات التبريد)"
        documentSubtitle="INBOUND FISH STORAGE RECEIPT"
        isCancelled={inb.getStatus() === "CANCELLED"}
        cancellationReason={inb.getCancellationReason()}
      >
        <div className="space-y-5">
          {/* Depositor Company Info Box */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/90 p-3.5 rounded-lg border border-[#0e3a82]/20">
            <div>
              <span className="text-slate-500 font-semibold">الشركة المودعة:</span>{" "}
              <strong className="text-slate-900 text-sm font-black">{company?.getName()}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">كود العميل:</span>{" "}
              <strong className="font-mono font-bold text-[#0e3a82]">
                {company?.getCode().getValue()}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">المسؤول المفوض:</span>{" "}
              <span>{company?.getContactPerson() || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">رقم التواصل:</span>{" "}
              <span className="font-mono">{company?.getPhone() || "—"}</span>
            </div>
          </div>

          {/* Table of Fish Lines */}
          <table className="w-full text-right text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-[#0e3a82] text-white font-bold">
                <th className="p-2 border border-slate-400 w-12 text-center">#</th>
                <th className="p-2 border border-slate-400">الصنف / النوع</th>
                <th className="p-2 border border-slate-400">الحجم</th>
                <th className="p-2 border border-slate-400">الوزن الصافي</th>
                <th className="p-2 border border-slate-400">مستودع التخزين</th>
              </tr>
            </thead>
            <tbody>
              {inb.getLines().map((line, idx) => (
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
                    {line.totalWeight.toKilograms().toLocaleString("ar-YE")} كجم
                  </td>
                  <td className="p-2 border border-slate-300 text-[11px] text-slate-600">
                    {line.distributions
                      .map((d) => `${d.warehouseId} (${d.weight.toKilograms()} كجم)`)
                      .join(" • ")}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold border-t-2 border-[#0e3a82]">
                <td colSpan={3} className="p-2.5 border border-slate-300 text-left font-black text-slate-800">
                  الإجمالي العام للوزن المدخل:
                </td>
                <td
                  colSpan={2}
                  className="p-2.5 border border-slate-300 font-black text-sm font-mono text-[#dc2626]"
                >
                  {totalWeightKg.toLocaleString("ar-YE")} كجم ({(totalWeightKg / 1000).toFixed(3)} طن)
                </td>
              </tr>
            </tbody>
          </table>

          {/* Notes */}
          {inb.getNotes() && (
            <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block mb-0.5">ملاحظات:</span>
              <p className="text-slate-600">{inb.getNotes()}</p>
            </div>
          )}

          {/* Official Signatures & Seal Block */}
          <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">مندوب الشركة المودعة</span>
              <span className="block border-b border-slate-400 w-3/4 mx-auto" />
              <span className="text-slate-500 block text-[10px]">التوقيع والاسم</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">مسؤول مستودعات التبريد</span>
              <span className="block border-b border-slate-400 w-3/4 mx-auto" />
              <span className="text-slate-500 block text-[10px]">التوقيع والاسم</span>
            </div>

            <div className="space-y-3">
              <span className="font-bold text-slate-800 block">الختم المعتمد</span>
              <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-[#0e3a82]/40 flex flex-col items-center justify-center text-[10px] text-[#0e3a82]/60 font-bold">
                <span>ختم الإدارة</span>
                <span className="text-[8px]">SEAL</span>
              </div>
            </div>
          </div>
        </div>
      </OfficialLetterhead>
    </div>
  );
}
