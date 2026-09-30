export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { container } from "@/server/container";
import { OfficialLetterhead } from "@/shared/components/OfficialLetterhead";
import { DocumentQrCode, OfficialEmbossedSeal } from "@/shared/components/DocumentSecurity";

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

  const qrPayload = `OF-INB|${inb.getReceiptNumber().getValue()}|${company?.getCode().getValue()}|${inb.getEntryDate().toString()}|${totalWeightKg}KG`;

  return (
    <div className="bg-slate-200/80 min-h-screen p-4 sm:p-8 print:p-0 print:bg-white text-black font-sans">
      {/* Official A4 Letterhead Document with Mode Controller */}
      <OfficialLetterhead
        receiptNumber={inb.getReceiptNumber().getValue()}
        dateArabic={inb.getEntryDate().formatArabic()}
        dateEnglish={inb.getEntryDate().toString()}
        documentTitle="سند استلام وتخزين صيد"
        documentSubtitle="FISH RECEIPT & STORAGE VOUCHER"
        isCancelled={inb.getStatus() === "CANCELLED"}
        cancellationReason={inb.getCancellationReason()}
        qrValue={qrPayload}
      >
        <div className="space-y-4">
          {/* Depositor Company Info Box & QR Code */}
          <div className="flex items-stretch gap-3">
            <div className="flex-1 grid grid-cols-2 gap-2 text-xs bg-slate-50/90 p-3 rounded-lg border border-[#0e3a82]/25">
              <div>
                <span className="text-slate-500 font-semibold">الشركة المودعة:</span>{" "}
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
                <span className="text-slate-700 block mt-0.5">{company?.getContactPerson() || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">رقم التواصل:</span>{" "}
                <span className="font-mono text-slate-700 block mt-0.5">{company?.getPhone() || "—"}</span>
              </div>
            </div>

            {/* Verification QR Code */}
            <div className="shrink-0 flex items-center justify-center">
              <DocumentQrCode value={qrPayload} size={68} label="رمز التحقق" />
            </div>
          </div>

          {/* Table of Fish Lines */}
          <table className="w-full text-right text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-[#0e3a82] text-white font-bold">
                <th className="p-2 border border-slate-400 w-10 text-center">#</th>
                <th className="p-2 border border-slate-400">الصنف السمكي</th>
                <th className="p-2 border border-slate-400">الحجم</th>
                <th className="p-2 border border-slate-400">الوزن الصافي</th>
                <th className="p-2 border border-slate-400">مستودع التخزين والتوزيع</th>
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
                <td colSpan={3} className="p-2 border border-slate-300 text-left font-black text-slate-800">
                  الإجمالي العام للوزن المدخل:
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

          {/* Notes */}
          {inb.getNotes() && (
            <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block mb-0.5">ملاحظات المستودع:</span>
              <p className="text-slate-600">{inb.getNotes()}</p>
            </div>
          )}

          {/* Official Signatures & Seal Block */}
          <div className="pt-4 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-10">
              <span className="font-bold text-slate-800 block">المودع / السائق</span>
              <span className="block border-b border-slate-400 w-3/4 mx-auto" />
              <span className="text-slate-500 block text-[10px]">التوقيع والاسم</span>
            </div>

            <div className="space-y-10">
              <span className="font-bold text-slate-800 block">أمين المستودع</span>
              <span className="block border-b border-slate-400 w-3/4 mx-auto" />
              <span className="text-slate-500 block text-[10px]">التوقيع والاسم</span>
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="font-bold text-slate-800 block mb-1">ختم المستودع</span>
              <OfficialEmbossedSeal dateStr={inb.getEntryDate().toString()} size={88} />
            </div>
          </div>
        </div>
      </OfficialLetterhead>
    </div>
  );
}

