"use client";

import React, { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { toggleWithdrawalBlockAction } from "@/server/actions/companyActions";
import Link from "next/link";
import {
  Building2,
  AlertOctagon,
  ArrowRight,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  FileText,
  ShieldAlert,
} from "lucide-react";

interface CompanyDetailsViewProps {
  user: any;
  company: any;
  lots: any[];
  inbounds: any[];
  outbounds: any[];
  isManager: boolean;
  statementSummary: any;
  payments: any[];
  discounts: any[];
}

export const CompanyDetailsView: React.FC<CompanyDetailsViewProps> = ({
  user,
  company,
  lots,
  inbounds,
  outbounds,
  isManager,
  statementSummary,
  payments,
  discounts,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "movements" | "statement" | "payments">("overview");
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  const handleToggleBlock = async (block: boolean) => {
    setIsSubmittingBlock(true);
    await toggleWithdrawalBlockAction({
      companyId: company.id,
      block,
      reason: block ? blockReason : undefined,
    });
    setIsSubmittingBlock(false);
    setIsBlockModalOpen(false);
  };

  const isBlocked = company.withdrawalBlocked;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/companies"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg border border-slate-200"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                {company.code}
              </span>
              <h1 className="text-xl font-extrabold text-slate-900">{company.name}</h1>
              {isBlocked ? (
                <Badge variant="danger" className="gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  <span>الصرف موقوف</span>
                </Badge>
              ) : (
                <Badge variant="success">نشط</Badge>
              )}
            </div>
          </div>
        </div>

        {isManager && (
          <div className="flex items-center gap-2">
            {isBlocked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleBlock(false)}
                isLoading={isSubmittingBlock}
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                إلغاء إيقاف الصرف
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setBlockReason("مديونية مستحقة");
                  setIsBlockModalOpen(true);
                }}
                className="gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>إيقاف الصرف</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Critical Block Warning Banner (Section #177) */}
      {isBlocked && (
        <div className="p-4 bg-rose-50 border-r-4 border-rose-500 rounded-xl text-rose-800 space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <span>تنبيه: عمليات الصرف موقوفة لهذه الشركة</span>
          </div>
          <p className="text-xs text-rose-700">
            {company.withdrawalBlockReason
              ? `السبب الموثق: ${company.withdrawalBlockReason}`
              : "تم إيقاف إنشاء سندات الصرف بقرار إداري."}
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200/80 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "overview"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          نظرة عامة
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "inventory"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>المخزون الحالي ({lots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("movements")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "movements"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          سجل الحركات ({inbounds.length + outbounds.length})
        </button>

        {isManager && (
          <>
            <button
              onClick={() => setActiveTab("statement")}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "statement"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>كشف الحساب المالي</span>
            </button>

            <button
              onClick={() => setActiveTab("payments")}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "payments"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>المدفوعات والخصومات ({payments.length + discounts.length})</span>
            </button>
          </>
        )}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="بيانات الشركة">
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">كود الشركة:</span>
                <span className="font-bold text-slate-800">{company.code}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">اسم الشركة:</span>
                <span className="font-bold text-slate-800">{company.name}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">المسؤول:</span>
                <span className="font-semibold text-slate-800">{company.contactPerson || "—"}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">رقم الهاتف:</span>
                <span className="font-semibold font-mono" dir="ltr">
                  {company.phone || "—"}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">حالة الصرف:</span>
                <span>
                  {isBlocked ? (
                    <Badge variant="danger">موقوف</Badge>
                  ) : (
                    <Badge variant="success">متاح</Badge>
                  )}
                </span>
              </div>
              {company.notes && (
                <div className="py-2.5">
                  <span className="text-slate-400 block mb-1">ملاحظات:</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg">{company.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {isManager && statementSummary && (
            <Card title="الملخص المالي السريع" className="border-emerald-100 bg-emerald-50/10">
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">صافي الرصيد المستحق (المديونية)</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {statementSummary.netBalanceYer.toLocaleString("ar-YE")} ر.ي
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-400 block">رسوم التخزين</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {statementSummary.totalFeesYer.toLocaleString("ar-YE")}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-400 block">المدفوعات</span>
                    <span className="font-bold text-emerald-600 mt-0.5 block">
                      {statementSummary.totalPaymentsYer.toLocaleString("ar-YE")}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-400 block">الخصومات</span>
                    <span className="font-bold text-amber-600 mt-0.5 block">
                      {statementSummary.totalDiscountsYer.toLocaleString("ar-YE")}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Inventory Lots */}
      {activeTab === "inventory" && (
        <Card title="دفعات الصيد التابعة للشركة">
          {lots.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">لا يوجد مخزون حالي لهذه الشركة.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-2.5">رقم الدفعة</th>
                    <th className="pb-2.5">الصنف والحجم</th>
                    <th className="pb-2.5">تاريخ الإدخال</th>
                    <th className="pb-2.5">الوزن الأصلي</th>
                    <th className="pb-2.5">الرصيد المتبقي</th>
                    <th className="pb-2.5">السعر الأساسي</th>
                    <th className="pb-2.5">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-bold text-slate-800">{lot.lotNumber}</td>
                      <td className="py-3 font-semibold text-slate-700">
                        {lot.fishName} ({lot.fishSize})
                      </td>
                      <td className="py-3 text-slate-500">{lot.entryDateArabic}</td>
                      <td className="py-3 text-slate-500">{lot.originalKg.toLocaleString("ar-YE")} كجم</td>
                      <td className="py-3 font-bold text-slate-900">
                        {lot.remainingKg.toLocaleString("ar-YE")} كجم
                      </td>
                      <td className="py-3 text-slate-600">{lot.baseDailyRateYer} ر.ي/كجم/يوم</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            lot.status === "OPEN"
                              ? "success"
                              : lot.status === "EXHAUSTED"
                              ? "neutral"
                              : "danger"
                          }
                        >
                          {lot.status === "OPEN"
                            ? "مفتوحة"
                            : lot.status === "EXHAUSTED"
                            ? "مستنفدة"
                            : "ملغاة"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab: Movements */}
      {activeTab === "movements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="سندات الإدخال">
            {inbounds.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">لا توجد سندات إدخال.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {inbounds.map((inb) => (
                  <div key={inb.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{inb.receiptNumber}</span>
                      <span className="text-slate-400 block mt-0.5">{inb.entryDate}</span>
                    </div>
                    <Badge variant={inb.status === "CANCELLED" ? "danger" : "success"}>
                      {inb.status === "CANCELLED" ? "ملغي" : "معتمد"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="سندات الصرف">
            {outbounds.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">لا توجد سندات صرف.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {outbounds.map((out) => (
                  <div key={out.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{out.receiptNumber}</span>
                      <span className="text-slate-400 block mt-0.5">{out.withdrawalDate}</span>
                    </div>
                    <Badge variant={out.status === "CANCELLED" ? "danger" : "info"}>
                      {out.status === "CANCELLED" ? "ملغي" : "معتمد"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab: Financial Statement (Managers only) */}
      {isManager && activeTab === "statement" && statementSummary && (
        <Card title={`كشف الحساب المالي التفصيلي (حتى ${statementSummary.asOfDate})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">البيان</th>
                  <th className="p-3">المرجع</th>
                  <th className="p-3 text-rose-600">مدين (رسوم تخزين)</th>
                  <th className="p-3 text-emerald-600">دائن (سداد/خصم)</th>
                  <th className="p-3">الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {statementSummary.entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      لا توجد حركات مالية مسجلة بعد.
                    </td>
                  </tr>
                ) : (
                  statementSummary.entries.map((entry: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 whitespace-nowrap text-slate-600">{entry.date}</td>
                      <td className="p-3 text-slate-800 font-semibold">{entry.description}</td>
                      <td className="p-3 font-mono text-slate-500">{entry.reference}</td>
                      <td className="p-3 font-bold text-rose-600">
                        {entry.debitYer > 0 ? `${entry.debitYer.toLocaleString("ar-YE")} ر.ي` : "—"}
                      </td>
                      <td className="p-3 font-bold text-emerald-600">
                        {entry.creditYer > 0 ? `${entry.creditYer.toLocaleString("ar-YE")} ر.ي` : "—"}
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 whitespace-nowrap">
                        {entry.runningBalanceYer.toLocaleString("ar-YE")} ر.ي
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Payments & Discounts */}
      {isManager && activeTab === "payments" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="سندات القبض">
            {payments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">لا توجد سندات قبض.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{p.paymentNumber}</div>
                      <div className="text-slate-400 mt-0.5">
                        {p.date} • {p.method}
                      </div>
                    </div>
                    <div className="text-left font-bold text-emerald-600">
                      {p.amountYer.toLocaleString("ar-YE")} ر.ي
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="الخصومات الممنوحة">
            {discounts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">لا توجد خصومات.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {discounts.map((d) => (
                  <div key={d.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{d.discountNumber}</div>
                      <div className="text-slate-500 mt-0.5">{d.reason}</div>
                    </div>
                    <div className="text-left font-bold text-amber-600">
                      {d.amountYer.toLocaleString("ar-YE")} ر.ي
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Block Withdrawal Confirmation Modal */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title="إيقاف صرف المخزون للشركة"
        maxWidth="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsBlockModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isSubmittingBlock}
              onClick={() => handleToggleBlock(true)}
            >
              تأكيد إيقاف الصرف
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            عند تفعيل إيقاف الصرف، سيمنع النظام إنشاء أي سندات صرف جديدة لهذه الشركة حتى يتم إلغاء الإيقاف من قبل الإدارة.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">سبب الإيقاف الإداري *</label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="مثال: تجاوز سقف المديونية، إجراء قانوني..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
