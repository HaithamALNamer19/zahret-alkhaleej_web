"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  previewFifoAllocationAction,
  createOutboundReceiptAction,
} from "@/server/actions/inventoryActions";
import { requestFifoOverrideAction } from "@/server/actions/approvalActions";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { Badge } from "@/shared/ui/Badge";
import {
  AlertCircle,
  CheckCircle2,
  Boxes,
  Warehouse,
  ShieldAlert,
  ArrowRight,
  FileCheck2,
} from "lucide-react";

interface OutboundReceiptWizardProps {
  companies: {
    id: string;
    name: string;
    code: string;
    withdrawalBlocked: boolean;
    withdrawalBlockReason?: string;
  }[];
  fishItems: { id: string; name: string }[];
  sizesByFishId: Record<string, { id: string; label: string }[]>;
}

export const OutboundReceiptWizard: React.FC<OutboundReceiptWizardProps> = ({
  companies,
  fishItems,
  sizesByFishId,
}) => {
  const router = useRouter();

  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Aden",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Step 1 State: Input params
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [fishItemId, setFishItemId] = useState(fishItems[0]?.id || "");
  const [fishSizeId, setFishSizeId] = useState(sizesByFishId[fishItems[0]?.id || ""]?.[0]?.id || "");
  const [requestedWeightKg, setRequestedWeightKg] = useState(1000);
  const [withdrawalDate, setWithdrawalDate] = useState(todayStr);
  const [notes, setNotes] = useState("");

  // Step 2 State: Calculated FIFO Plan
  const [isCalculating, setIsCalculating] = useState(false);
  const [planData, setPlanData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User warehouse location choices for each lot in the plan:
  // lotId -> record of { locationId -> weightKg }
  const [locationChoices, setLocationChoices] = useState<
    Record<string, Record<string, number>>
  >({});

  // FIFO Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [alternativeDetails, setAlternativeDetails] = useState("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [overrideSuccessMessage, setOverrideSuccessMessage] = useState<string | null>(null);

  // Dispatch submission state
  const [isDispatching, setIsDispatching] = useState(false);

  const selectedCompany = companies.find((c) => c.id === companyId);
  const isBlocked = selectedCompany?.withdrawalBlocked;

  const handleFishItemChange = (itemId: string) => {
    setFishItemId(itemId);
    const sizes = sizesByFishId[itemId] || [];
    setFishSizeId(sizes[0]?.id || "");
    setPlanData(null);
  };

  const handleCalculatePlan = async () => {
    setError(null);
    setPlanData(null);

    if (isBlocked) {
      setError(
        `لا يمكن صرف الصيد لهذه الشركة: ${selectedCompany?.withdrawalBlockReason || "الصرف موقوف إدارياً"}`
      );
      return;
    }

    if (!companyId || !fishItemId || !fishSizeId || requestedWeightKg <= 0) {
      setError("يرجى ملء جميع حقول الصنف والوزن المطلوب.");
      return;
    }

    setIsCalculating(true);
    const res = await previewFifoAllocationAction({
      companyId,
      fishItemId,
      fishSizeId,
      requestedWeightKg: Number(requestedWeightKg),
    });

    setIsCalculating(false);

    if (!res.success || !res.data) {
      setError(res.error || "فشل احتساب خطة FIFO.");
      return;
    }

    const calculatedPlan = res.data;
    setPlanData(calculatedPlan);

    // Initialize default warehouse location distribution for each planned lot
    // Pre-fills first warehouse location with available weight
    const initialChoices: Record<string, Record<string, number>> = {};
    for (const item of calculatedPlan.plan) {
      initialChoices[item.lotId] = {};
      let remainingToFill = item.allocatedWeightKg;

      for (const loc of item.availableLocations) {
        if (remainingToFill <= 0) {
          initialChoices[item.lotId][loc.stockLocationId] = 0;
        } else {
          const take = Math.min(remainingToFill, loc.remainingWeightKg);
          initialChoices[item.lotId][loc.stockLocationId] = take;
          remainingToFill -= take;
        }
      }
    }
    setLocationChoices(initialChoices);
  };

  const updateLocationChoice = (
    lotId: string,
    locationId: string,
    weightKg: number
  ) => {
    setLocationChoices((prev) => ({
      ...prev,
      [lotId]: {
        ...(prev[lotId] || {}),
        [locationId]: weightKg,
      },
    }));
  };

  const handleConfirmDispatch = async () => {
    if (!planData) return;
    setError(null);

    // Verify each lot's warehouse distribution sum matches planned allocation
    for (const item of planData.plan) {
      const lotChoices = locationChoices[item.lotId] || {};
      let sum = 0;
      for (const w of Object.values(lotChoices)) {
        sum += Number(w) || 0;
      }
      if (sum !== item.allocatedWeightKg) {
        setError(
          `الدفعة (${item.lotNumber}): مجموع الكميات المحددة من المستودعات (${sum.toLocaleString(
            "ar-YE"
          )} كجم) لا يطابق المطلوب من هذه الدفعة (${item.allocatedWeightKg.toLocaleString(
            "ar-YE"
          )} كجم).`
        );
        return;
      }
    }

    setIsDispatching(true);

    const userChoicesByLotId = planData.plan.map((item: any) => {
      const lotChoices = locationChoices[item.lotId] || {};
      return {
        lotId: item.lotId,
        choices: item.availableLocations.map((loc: any) => ({
          stockLocationId: loc.stockLocationId,
          warehouseId: loc.warehouseId,
          weightKg: Number(lotChoices[loc.stockLocationId]) || 0,
        })),
      };
    });

    const res = await createOutboundReceiptAction({
      companyId,
      withdrawalDate,
      lines: [
        {
          fishItemId,
          fishSizeId,
          requestedWeightKg: Number(requestedWeightKg),
          userChoicesByLotId,
        },
      ],
      notes,
    });

    setIsDispatching(false);

    if (!res.success) {
      setError(res.error || "فشل اعتماد الصرف.");
      return;
    }

    router.push("/outbound");
    router.refresh();
  };

  const handleSubmitFifoOverride = async () => {
    if (!overrideReason.trim()) {
      alert("يرجى كتابة سبب طلب تجاوز FIFO.");
      return;
    }

    setIsSubmittingOverride(true);
    const normalDetails = planData
      ? planData.plan
          .map((p: any) => `${p.lotNumber}: ${p.allocatedWeightKg} كجم`)
          .join(" + ")
      : "وفق FIFO التلقائي";

    const res = await requestFifoOverrideAction({
      companyId,
      fishItemId,
      fishSizeId,
      requestedQuantityKg: Number(requestedWeightKg),
      normalAllocationDetails: normalDetails,
      requestedAlternativeDetails: alternativeDetails || "طلب اختيار دفعة بديلة",
      reason: overrideReason,
    });

    setIsSubmittingOverride(false);
    setIsOverrideModalOpen(false);

    if (res.success) {
      setOverrideSuccessMessage(
        "تم تقديم طلب تجاوز FIFO بنجاح! سيتم إشعار مدير المستودعات لمراجعته واعتماده."
      );
    } else {
      setError(res.error || "فشل تقديم طلب تجاوز FIFO.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {overrideSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{overrideSuccessMessage}</span>
        </div>
      )}

      {/* Step 1: Query & Parameters */}
      <Card title="بيانات الصرف والصنف المطلوب">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">شركة الصيد (العميل) *</label>
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setPlanData(null);
                }}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) {c.withdrawalBlocked ? "— [صرف موقوف]" : ""}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="تاريخ الصرف (توقيت عدن) *"
              type="date"
              value={withdrawalDate}
              onChange={(e) => setWithdrawalDate(e.target.value)}
              required
            />
          </div>

          {isBlocked && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>
                تنبيه: عمليات الصرف موقوفة لهذه الشركة ({selectedCompany?.withdrawalBlockReason || "بقرار إداري"}).
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">اسم الصيد *</label>
              <select
                value={fishItemId}
                onChange={(e) => handleFishItemChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                {fishItems.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">الحجم المطلوب *</label>
              <select
                value={fishSizeId}
                onChange={(e) => {
                  setFishSizeId(e.target.value);
                  setPlanData(null);
                }}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                {(sizesByFishId[fishItemId] || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="الوزن المطلوب صرفه (كجم) *"
              type="number"
              min="1"
              value={requestedWeightKg || ""}
              onChange={(e) => {
                setRequestedWeightKg(Number(e.target.value));
                setPlanData(null);
              }}
              dir="ltr"
              className="text-right font-mono"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleCalculatePlan}
              isLoading={isCalculating}
              disabled={isBlocked}
              className="gap-2"
            >
              <Boxes className="w-4 h-4" />
              <span>احتساب خطة التوزيع (FIFO)</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Step 2: FIFO Plan Display & Warehouse Allocation Picker */}
      {planData && (
        <Card
          title="خطة الصرف التلقائية وفق قاعدة FIFO (الوارد أولاً يصرف أولاً)"
          subtitle="حدد المستودع الذي سيخرج منه الصيد لكل دفعة. لا يسمح النظام باختيار دفعة أحدث."
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOverrideModalOpen(true)}
              className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>طلب تجاوز FIFO</span>
            </Button>
          }
        >
          <div className="space-y-6">
            {planData.plan.map((item: any, planIdx: number) => {
              const lotChoices = locationChoices[item.lotId] || {};
              let lotSum = 0;
              for (const w of Object.values(lotChoices)) {
                lotSum += Number(w) || 0;
              }
              const isLotMatch = lotSum === item.allocatedWeightKg;

              return (
                <div
                  key={item.lotId}
                  className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">
                        الدفعة #{planIdx + 1}: {item.lotNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        تاريخ الدخول: {item.entryDate} • إجمالي رصيد الدفعة:{" "}
                        {item.remainingWeightInLotKg.toLocaleString("ar-YE")} كجم
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="text-xs text-slate-400 block">المطلوب من هذه الدفعة:</span>
                      <span className="text-sm font-black text-primary-700">
                        {item.allocatedWeightKg.toLocaleString("ar-YE")} كجم
                      </span>
                    </div>
                  </div>

                  {/* Stock Locations for this Lot */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        اختر موقع الصرف (المستودع):
                      </span>
                      <span
                        className={`font-semibold ${
                          isLotMatch ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        المحدد: {lotSum.toLocaleString("ar-YE")} كجم / المطلوب:{" "}
                        {item.allocatedWeightKg.toLocaleString("ar-YE")} كجم
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {item.availableLocations.map((loc: any) => (
                        <div
                          key={loc.stockLocationId}
                          className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                        >
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">
                              مستودع: {loc.warehouseId}
                            </span>
                            <span className="text-xs text-slate-400">
                              المتوفر: {loc.remainingWeightKg.toLocaleString("ar-YE")} كجم
                            </span>
                          </div>

                          <div className="w-32">
                            <input
                              type="number"
                              min="0"
                              max={loc.remainingWeightKg}
                              value={lotChoices[loc.stockLocationId] ?? ""}
                              onChange={(e) =>
                                updateLocationChoice(
                                  item.lotId,
                                  loc.stockLocationId,
                                  Number(e.target.value)
                                )
                              }
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-right font-mono focus:bg-white focus:outline-none focus:border-primary-500"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">ملاحظات سند الصرف</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="اسم السائق، رقم وسيلة النقل، تعليمات التحميل..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                🔒 تتم عملية الصرف ضمن معاملة ذرية متزامنة (Firestore Transaction) لحماية المخزون من التضارب.
              </p>

              <Button
                type="button"
                onClick={handleConfirmDispatch}
                isLoading={isDispatching}
                className="px-6 py-2.5 font-bold shadow-md"
              >
                اعتماد وصرف السند
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* FIFO Override Request Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="تقديم طلب تجاوز قاعدة FIFO"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOverrideModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmittingOverride}
              onClick={handleSubmitFifoOverride}
            >
              إرسال طلب التجاوز للإدارة
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            تجاوز أقدم دفعة يتطلب اعتماداً صريحاً من مدير المستودعات أو المدير العام مع توضيح السبب التشغيلي.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">سبب طلب التجاوز *</label>
            <textarea
              rows={2}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="مثال: تعذر الوصول للدفعة القديمة مؤقتاً، طلب العميل دفعة بتغليف خاص..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">الدفعة البديلة المقترحة</label>
            <input
              type="text"
              value={alternativeDetails}
              onChange={(e) => setAlternativeDetails(e.target.value)}
              placeholder="رقم الدفعة البديلة المراد الصرف منها..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
