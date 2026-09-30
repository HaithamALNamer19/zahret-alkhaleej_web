export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { container } from "@/server/container";
import { getSessionUser } from "@/server/auth/session";
import { PrintButton } from "@/shared/components/PrintButton";

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

  const [company, settings] = await Promise.all([
    container.companyRepository.findById(payment.getCompanyId()),
    container.settingsRepository.getSettings(),
  ]);

  const methodLabel =
    payment.getPaymentMethod() === "CASH" ? "نقداً (CASH)" : "حوالة بنكية / شيك (TRANSFER)";

  return (
    <div className="bg-white min-h-screen p-8 text-black font-sans print:p-0">
      {/* Print Trigger Button (Hidden when printing) */}
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton label="طباعة سند القبض (A4)" />
      </div>

      <div className="border border-slate-300 p-8 rounded-xl max-w-4xl mx-auto space-y-6 print:border-none print:p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
          <div className="text-right space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {settings.getCompanyDisplayName()}
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              الشؤون المالية والحسابات - مستودعات التبريد
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
              <strong className="text-sm font-black">{payment.getPaymentNumber().getValue()}</strong>
            </div>
            <div>
              <span className="text-slate-500">تاريخ القبض:</span>{" "}
              <strong>{payment.getPaymentDate().formatArabic()}</strong>
            </div>
          </div>
        </div>

        {/* Voucher Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black bg-emerald-50 text-emerald-950 py-1.5 px-8 rounded-lg inline-block border border-emerald-300">
            سند قبض مالي (RECEIPT VOUCHER)
          </h2>
          {payment.getStatus() === "CANCELLED" && (
            <div className="text-rose-600 font-black text-sm border border-rose-300 bg-rose-50 py-1 px-4 rounded">
              ⚠️ هذا السند ملغي (CANCELLED)
              {payment.getCancellationReason() && ` - السبب: ${payment.getCancellationReason()}`}
            </div>
          )}
        </div>

        {/* Amount Box */}
        <div className="bg-slate-50 border-2 border-slate-300 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold block mb-1">المبلغ المقبوض:</span>
            <span className="text-2xl font-black font-mono text-emerald-700 tracking-tight">
              {payment.getAmount().formatArabic()}
            </span>
          </div>
          <div className="text-left font-semibold text-xs text-slate-600 space-y-1">
            <div>
              <span className="text-slate-400">طريقة الدفع:</span>{" "}
              <strong className="text-slate-800">{methodLabel}</strong>
            </div>
            <div>
              <span className="text-slate-400">العملة:</span>{" "}
              <strong className="text-slate-800">ريال يمني (YER)</strong>
            </div>
          </div>
        </div>

        {/* Company & Payer Information */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-500 font-semibold">استلمنا من الإخوة / شركة:</span>{" "}
            <strong className="text-slate-900 text-sm font-bold block mt-0.5">
              {company?.getName()}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">كود الحساب:</span>{" "}
            <strong className="font-mono text-slate-800 block mt-0.5">
              {company?.getCode().getValue()}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">المسؤول المفوض:</span>{" "}
            <span className="text-slate-800 block mt-0.5">{company?.getContactPerson() || "—"}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">رقم الهاتف:</span>{" "}
            <span className="font-mono text-slate-800 block mt-0.5">{company?.getPhone() || "—"}</span>
          </div>
        </div>

        {/* Statement / Description */}
        <div className="border border-slate-200 rounded-lg p-4 text-xs space-y-2">
          <div className="text-slate-500 font-semibold">وذلك سداداً عن:</div>
          <p className="text-sm font-medium text-slate-800 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
            {payment.getNotes() || "دفعة تحت حساب رسوم التخزين والتبريد لمخزون الصيد السمكي."}
          </p>
        </div>

        {/* Receipt Verification Meta */}
        <div className="text-[11px] text-slate-500 grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
          <div>
            <span>المستلم في النظام:</span>{" "}
            <strong className="text-slate-700">{payment.getReceivedBy()}</strong>
          </div>
          <div className="text-left font-mono">
            <span>تاريخ الإصدار الرقمي:</span>{" "}
            <span>{payment.getCreatedAt().toLocaleString("ar-YE")}</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-12">
            <span className="font-bold text-slate-700 block">المسلّم / المودع</span>
            <span className="block border-b border-slate-400 w-3/4 mx-auto" />
            <span className="text-slate-400 block text-[10px]">الاسم والتوقيع</span>
          </div>

          <div className="space-y-12">
            <span className="font-bold text-slate-700 block">المحاسب / المستلم</span>
            <span className="block border-b border-slate-400 w-3/4 mx-auto" />
            <span className="text-slate-400 block text-[10px]">الاسم والتوقيع</span>
          </div>

          <div className="space-y-12">
            <span className="font-bold text-slate-700 block">الختم المالي المعتمد</span>
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-300">
              ختم الحسابات
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
