"use client";

import React, { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Badge } from "@/shared/ui/Badge";
import { recordPaymentAction, recordDiscountAction } from "@/server/actions/financeActions";
import Link from "next/link";
import { DollarSign, Plus, Printer, Tag, CheckCircle2, AlertCircle } from "lucide-react";

interface FinanceManagerViewProps {
  companies: { id: string; name: string; code: string }[];
  payments: any[];
  discounts: any[];
}

export const FinanceManagerView: React.FC<FinanceManagerViewProps> = ({
  companies,
  payments,
  discounts,
}) => {
  const [activeTab, setActiveTab] = useState<"payments" | "discounts">("payments");

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payCompanyId, setPayCompanyId] = useState(companies[0]?.id || "");
  const [payAmount, setPayAmount] = useState(50000);
  const [payMethod, setPayMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [payDate, setPayDate] = useState(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Aden" }).format(new Date())
  );
  const [payNotes, setPayNotes] = useState("");

  // Discount Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discCompanyId, setDiscCompanyId] = useState(companies[0]?.id || "");
  const [discAmount, setDiscAmount] = useState(10000);
  const [discReason, setDiscReason] = useState("");
  const [discDate, setDiscDate] = useState(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Aden" }).format(new Date())
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (payAmount <= 0) {
      setError("قيمة الدفعة يجب أن تكون أكبر من صفر.");
      return;
    }

    setIsLoading(true);
    const res = await recordPaymentAction({
      companyId: payCompanyId,
      amountYer: Number(payAmount),
      paymentMethod: payMethod,
      paymentDate: payDate,
      notes: payNotes,
    });
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "فشل تسجيل الدفعة.");
      return;
    }

    setIsPaymentModalOpen(false);
    setPayNotes("");
  };

  const handleRecordDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (discAmount <= 0) {
      setError("قيمة الخصم يجب أن تكون أكبر من صفر.");
      return;
    }
    if (!discReason.trim()) {
      setError("يجب كتابة سبب الخصم المعتمد.");
      return;
    }

    setIsLoading(true);
    const res = await recordDiscountAction({
      companyId: discCompanyId,
      amountYer: Number(discAmount),
      reason: discReason,
      date: discDate,
    });
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "فشل تسجيل الخصم.");
      return;
    }

    setIsDiscountModalOpen(false);
    setDiscReason("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">المالية والحسابات (الخزينة)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تسجيل المقبوضات النقدية والتحويلات والخصومات الإدارية على الحساب العام للشركات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsPaymentModalOpen(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <DollarSign className="w-4 h-4" />
            <span>تسجيل سند قبض</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsDiscountModalOpen(true)}
            className="gap-2 text-amber-700 border-amber-300 hover:bg-amber-50"
          >
            <Tag className="w-4 h-4" />
            <span>تسجيل خصم معتمد</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200/80 gap-2">
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "payments"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          سندات القبض النقدية والتحويلات ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab("discounts")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "discounts"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          الخصومات المعتمدة ({discounts.length})
        </button>
      </div>

      {/* Tab: Payments */}
      {activeTab === "payments" && (
        <Card>
          {payments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <DollarSign className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              لا توجد سندات قبض مسجلة بعد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                    <th className="p-3.5">رقم السند</th>
                    <th className="p-3.5">الشركة</th>
                    <th className="p-3.5">المبلغ</th>
                    <th className="p-3.5">طريقة الدفع</th>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5">ملاحظات</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">الطباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{p.companyName}</td>
                      <td className="p-3.5 font-black text-emerald-600 font-mono text-sm">
                        {p.amountYer.toLocaleString("ar-YE")} ر.ي
                      </td>
                      <td className="p-3.5 text-slate-600">{p.method}</td>
                      <td className="p-3.5 text-slate-500">{p.date}</td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">{p.notes || "—"}</td>
                      <td className="p-3.5">
                        <Badge variant={p.status === "CANCELLED" ? "danger" : "success"}>
                          {p.status === "CANCELLED" ? "ملغي" : "معتمد"}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-center">
                        <Link
                          href={`/print/payment/${p.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>إيصال A4</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab: Discounts */}
      {activeTab === "discounts" && (
        <Card>
          {discounts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Tag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              لا توجد خصومات مسجلة بعد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                    <th className="p-3.5">رقم الخصم</th>
                    <th className="p-3.5">الشركة</th>
                    <th className="p-3.5">مبلغ الخصم</th>
                    <th className="p-3.5">سبب الخصم</th>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {discounts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-bold text-slate-900">{d.discountNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{d.companyName}</td>
                      <td className="p-3.5 font-black text-amber-600 font-mono text-sm">
                        {d.amountYer.toLocaleString("ar-YE")} ر.ي
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">{d.reason}</td>
                      <td className="p-3.5 text-slate-500">{d.date}</td>
                      <td className="p-3.5">
                        <Badge variant="success">معتمد</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal: Record Payment */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="تسجيل سند قبض مالي جديد"
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">شركة الصيد (العميل) *</label>
            <select
              value={payCompanyId}
              onChange={(e) => setPayCompanyId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="المبلغ المستلم (ريال يمني) *"
              type="number"
              min="1"
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              required
              dir="ltr"
              className="text-right font-mono"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">طريقة الدفع *</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
              >
                <option value="CASH">نقداً (خزينة المستودع)</option>
                <option value="TRANSFER">حوالة بنكية / صرافة</option>
              </select>
            </div>
          </div>

          <Input
            label="تاريخ الدفعة *"
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">ملاحظات / رقم السند الورقي</label>
            <textarea
              rows={2}
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="رقم الحوالة أو المودع..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              حفظ سند القبض
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Discount */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        title="تسجيل خصم مالي معتمد"
        maxWidth="md"
      >
        <form onSubmit={handleRecordDiscount} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">شركة الصيد (العميل) *</label>
            <select
              value={discCompanyId}
              onChange={(e) => setDiscCompanyId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="مبلغ الخصم المعتمد (ريال يمني) *"
              type="number"
              min="1"
              value={discAmount}
              onChange={(e) => setDiscAmount(Number(e.target.value))}
              required
              dir="ltr"
              className="text-right font-mono"
            />

            <Input
              label="تاريخ الخصم *"
              type="date"
              value={discDate}
              onChange={(e) => setDiscDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">سبب الخصم ومبرره الإداري *</label>
            <textarea
              rows={2}
              value={discReason}
              onChange={(e) => setDiscReason(e.target.value)}
              placeholder="مثال: تسوية رسوم تالف، خصم موسمي معتمد من الإدارة العامة..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDiscountModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              تسجيل الخصم
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
