"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createInboundReceiptAction } from "@/server/actions/inventoryActions";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Plus, Trash2, AlertCircle } from "lucide-react";

interface FishItemOption {
  id: string;
  name: string;
  defaultRateYer: number;
}

interface FishSizeOption {
  id: string;
  label: string;
  overrideYer: number | null;
}

interface FormLine {
  fishItemId: string;
  fishSizeId: string;
  totalWeightKg: number;
  distributions: Record<string, number>; // warehouseId -> weightKg
}

interface InboundReceiptFormProps {
  companies: { id: string; name: string; code: string }[];
  warehouses: { id: string; code: string; name: string }[];
  fishItems: FishItemOption[];
  sizesByFishId: Record<string, FishSizeOption[]>;
}

export const InboundReceiptForm: React.FC<InboundReceiptFormProps> = ({
  companies,
  warehouses,
  fishItems,
  sizesByFishId,
}) => {
  const router = useRouter();

  // Initialize today in Asia/Aden timezone
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Aden",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [entryDate, setEntryDate] = useState(todayStr);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with 1 line
  const [lines, setLines] = useState<FormLine[]>([
    {
      fishItemId: fishItems[0]?.id || "",
      fishSizeId: sizesByFishId[fishItems[0]?.id || ""]?.[0]?.id || "",
      totalWeightKg: 1000,
      distributions: {
        [warehouses[0]?.id || ""]: 1000,
      },
    },
  ]);

  const addLine = () => {
    const firstItem = fishItems[0];
    const firstSize = sizesByFishId[firstItem?.id || ""]?.[0];
    setLines([
      ...lines,
      {
        fishItemId: firstItem?.id || "",
        fishSizeId: firstSize?.id || "",
        totalWeightKg: 1000,
        distributions: {
          [warehouses[0]?.id || ""]: 1000,
        },
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLineFishItem = (index: number, itemId: string) => {
    const sizes = sizesByFishId[itemId] || [];
    const updated = [...lines];
    updated[index].fishItemId = itemId;
    updated[index].fishSizeId = sizes[0]?.id || "";
    setLines(updated);
  };

  const updateLineSize = (index: number, sizeId: string) => {
    const updated = [...lines];
    updated[index].fishSizeId = sizeId;
    setLines(updated);
  };

  const updateLineTotalWeight = (index: number, weightKg: number) => {
    const updated = [...lines];
    updated[index].totalWeightKg = weightKg;
    setLines(updated);
  };

  const updateLineDistribution = (
    lineIndex: number,
    warehouseId: string,
    weightKg: number
  ) => {
    const updated = [...lines];
    updated[lineIndex].distributions = {
      ...updated[lineIndex].distributions,
      [warehouseId]: weightKg,
    };
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyId) {
      setError("يرجى اختيار الشركة.");
      return;
    }

    if (!entryDate) {
      setError("يرجى تحديد تاريخ الإدخال.");
      return;
    }

    // Validate lines and warehouse distributions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.fishItemId || !line.fishSizeId) {
        setError(`السطر رقم ${i + 1}: يرجى اختيار الصنف والحجم.`);
        return;
      }
      if (line.totalWeightKg <= 0) {
        setError(`السطر رقم ${i + 1}: الوزن الإجمالي يجب أن يكون أكبر من صفر.`);
        return;
      }

      // Check sum of distribution
      let distSum = 0;
      for (const wId of Object.keys(line.distributions)) {
        distSum += Number(line.distributions[wId]) || 0;
      }

      if (distSum !== Number(line.totalWeightKg)) {
        setError(
          `السطر رقم ${i + 1}: مجموع توزيع المستودعات (${distSum.toLocaleString(
            "ar-YE"
          )} كجم) لا يطابق إجمالي وزن السطر (${line.totalWeightKg.toLocaleString(
            "ar-YE"
          )} كجم).`
        );
        return;
      }
    }

    setIsLoading(true);

    const payloadLines = lines.map((l) => ({
      fishItemId: l.fishItemId,
      fishSizeId: l.fishSizeId,
      totalWeightKg: Number(l.totalWeightKg),
      distributions: Object.entries(l.distributions)
        .filter(([_, w]) => Number(w) > 0)
        .map(([wId, w]) => ({
          warehouseId: wId,
          weightKg: Number(w),
        })),
    }));

    const res = await createInboundReceiptAction({
      companyId,
      entryDate,
      lines: payloadLines,
      notes,
    });

    if (!res.success) {
      setError(res.error || "فشل إنشاء سند الإدخال.");
      setIsLoading(false);
      return;
    }

    router.push("/inbound");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Metadata */}
      <Card title="بيانات السند الأساسية">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">شركة الصيد (العميل) *</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100"
              required
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="تاريخ الإدخال (توقيت عدن) *"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">ملاحظات عامة</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات حول حالة الشحنة أو وسيلة النقل..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100"
          />
        </div>
      </Card>

      {/* Lines & Warehouses Distribution Table */}
      <Card
        title="أصناف الصيد والدفعات وتوزيع المستودعات"
        subtitle="كل سطر يمثل دفعة مستقلة (Lot) يتم حساب رسومها وفترتها المجانية بشكل منفصل"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLine}
            className="gap-1 text-primary-700 border-primary-200 hover:bg-primary-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة صنف</span>
          </Button>
        }
      >
        <div className="space-y-6">
          {lines.map((line, idx) => {
            const availableSizes = sizesByFishId[line.fishItemId] || [];
            let currentDistSum = 0;
            for (const w of Object.values(line.distributions)) {
              currentDistSum += Number(w) || 0;
            }
            const isMatch = currentDistSum === Number(line.totalWeightKg);

            return (
              <div
                key={idx}
                className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-4 relative"
              >
                {/* Line Header */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary-700 bg-primary-100/60 px-2 py-0.5 rounded-md">
                    دفعة رقم #{idx + 1}
                  </span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Line Details: Fish, Size, Total Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">الصنف *</label>
                    <select
                      value={line.fishItemId}
                      onChange={(e) => updateLineFishItem(idx, e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
                    >
                      {fishItems.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.defaultRateYer} ر.ي/كجم)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">الحجم *</label>
                    <select
                      value={line.fishSizeId}
                      onChange={(e) => updateLineSize(idx, e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
                    >
                      {availableSizes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}{" "}
                          {s.overrideYer != null ? `(سعر مخصص: ${s.overrideYer} ر.ي)` : "(السعر الافتراضي)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="إجمالي وزن الصنف (كجم) *"
                    type="number"
                    min="1"
                    value={line.totalWeightKg || ""}
                    onChange={(e) => updateLineTotalWeight(idx, Number(e.target.value))}
                    dir="ltr"
                    className="text-right"
                  />
                </div>

                {/* Warehouse Distribution Sub-table */}
                <div className="pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">توزيع الكمية على المستودعات:</span>
                    <span
                      className={`text-xs font-semibold ${
                        isMatch ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      الموزع: {currentDistSum.toLocaleString("ar-YE")} كجم / المطلوب:{" "}
                      {Number(line.totalWeightKg || 0).toLocaleString("ar-YE")} كجم
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {warehouses.map((wh) => (
                      <div key={wh.id} className="space-y-1">
                        <label className="block text-xs text-slate-600 font-medium">
                          {wh.name} ({wh.code})
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={line.distributions[wh.id] ?? ""}
                          onChange={(e) =>
                            updateLineDistribution(idx, wh.id, Number(e.target.value))
                          }
                          className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 text-right font-mono"
                          dir="ltr"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/inbound")}
          disabled={isLoading}
        >
          إلغاء
        </Button>
        <Button type="submit" isLoading={isLoading} className="px-6">
          اعتماد وحفظ سند الإدخال
        </Button>
      </div>
    </form>
  );
};
