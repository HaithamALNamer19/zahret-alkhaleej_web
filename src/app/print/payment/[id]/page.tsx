export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { container } from "@/server/container";
import { getSessionUser } from "@/server/auth/session";
import { OfficialLetterhead } from "@/shared/components/OfficialLetterhead";
import { DocumentQrCode, OfficialEmbossedSeal } from "@/shared/components/DocumentSecurity";

export default async function PrintPaymentVoucherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login");
  }

  // Financial privacy rule: EMPLOYEE role cannot view or print payment vouchers
  if (sessionUser.role === "EMPLOYEE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-md">
          <h2 className="text-lg font-bold text-rose-600 mb-2">غير مصرح بالوصول</h2>
          <p className="text-xs text-slate-600">
            عذراً، لا تملك صلاحية استعراض أو طباعة السندات والبيانات المالية.
          </p>
        </div>
      </div>
    );
  }

  const { id } = await params;
  const payment = await container.paymentRepository.findById(id);
  if (!payment) notFound();

  const company = await container.companyRepository.findById(payment.getCompanyId());

  const methodLabel =
    payment.getPaymentMethod() === "CASH" ? "نقداً (CASH)" : "حوالة بنكية / شيك (TRANSFER)";

  const qrPayload = `OF-PAY|${payment.getPaymentNumber().getValue()}|${company?.getCode().getValue()}|${payment.getPaymentDate().toString()}|${payment.getAmount().toYer()}YER`;

  return (
    <div className="bg-slate-200/80 min-h-screen p-4 sm:p-8 print:p-0 print:bg-white text-black font-sans">
      {/* Official A4 Letterhead Document with Mode Controller */}
      <OfficialLetterhead
        receiptNumber={payment.getPaymentNumber().getValue()}
        dateArabic={payment.getPaymentDate().formatArabic()}
        dateEnglish={payment.getPaymentDate().toString()}
        documentTitle="سند قبض مالي"
        documentSubtitle="OFFICIAL PAYMENT RECEIPT VOUCHER"
        isCancelled={payment.getStatus() === "CANCELLED"}
        cancellationReason={payment.getCancellationReason()}
        qrValue={qrPayload}
      >
        <div className="space-y-5">
          {/* Main Financial Amount Display & QR */}
          <div className="flex items-stretch gap-3">
            <div className="flex-1 border-2 border-[#0e3a82] bg-gradient-to-r from-blue-50/70 via-white to-blue-50/70 p-3.5 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-0.5">
                  المبلغ المقبوض رقماً:
                </span>
                <div className="text-2xl font-black font-mono text-[#0e3a82]">
                  {payment.getAmount().toYer().toLocaleString("ar-YE")}{" "}
                  <span className="text-xs font-bold text-slate-700">ريال يمني (YER)</span>
                </div>
              </div>
              <div className="text-left bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">
                  Payment Method
                </span>
                <strong className="text-xs text-slate-800">{methodLabel}</strong>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center">
              <DocumentQrCode value={qrPayload} size={70} label="تحقق السداد" />
            </div>
          </div>

          {/* Payment & Company Details Box */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/90 p-3.5 rounded-lg border border-[#0e3a82]/25">
            <div>
              <span className="text-slate-500 font-semibold">استلمنا من الإخوة شركة / عميل:</span>{" "}
              <strong className="text-slate-900 text-sm font-black block mt-0.5">
                {company?.getName()}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">كود العميل:</span>{" "}
              <strong className="font-mono font-bold text-[#0e3a82] block mt-0.5">
                {company?.getCode().getValue()}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">طريقة التحصيل:</span>{" "}
              <span className="font-bold text-slate-800 block mt-0.5">{methodLabel}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">المستلم المالي:</span>{" "}
              <span className="font-bold text-slate-800 block mt-0.5 font-mono">
                {payment.getReceivedBy()}
              </span>
            </div>
          </div>

          {/* Description / For What */}
          <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">وذلك مقابل:</span>
            <p className="text-slate-800 font-medium">
              {payment.getNotes() || "سداد رسوم تخزين وتبريد صيد في مستودعات الشركة."}
            </p>
          </div>

          {/* Official Signatures & Seal Block */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">المحاسب المالي</span>
              <span className="block border-b border-slate-400 w-3/4 mx-auto" />
              <span className="text-slate-500 block text-[10px]">التوقيع والاسم</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">المدير العام / المفوض</span>
              <span className="block border-b border-slate-400 w-3/4 mx-auto" />
              <span className="text-slate-500 block text-[10px]">التوقيع والاعتماد</span>
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="font-bold text-slate-800 block mb-1">الختم المالي المعتمد</span>
              <OfficialEmbossedSeal dateStr={payment.getPaymentDate().toString()} size={88} />
            </div>
          </div>
        </div>
      </OfficialLetterhead>
    </div>
  );
}

