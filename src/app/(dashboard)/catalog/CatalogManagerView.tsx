"use client";

import React, { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Badge } from "@/shared/ui/Badge";
import {
  createFishItemAction,
  updateFishPriceAction,
  createFishSizeAction,
} from "@/server/actions/catalogActions";
import { Fish, Plus, Edit2, AlertCircle } from "lucide-react";

interface CatalogItem {
  id: string;
  name: string;
  defaultRateYer: number;
  active: boolean;
  sizes: {
    id: string;
    label: string;
    overrideRateYer: number | null;
  }[];
}

interface CatalogManagerViewProps {
  catalog: CatalogItem[];
  isManager: boolean;
}

export const CatalogManagerView: React.FC<CatalogManagerViewProps> = ({
  catalog,
  isManager,
}) => {
  // New Fish Item Modal
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemRate, setNewItemRate] = useState(5);

  // Edit Rate Modal
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);
  const [updatedRate, setUpdatedRate] = useState(5);

  // New Size Modal
  const [sizeTargetItem, setSizeTargetItem] = useState<CatalogItem | null>(null);
  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [newSizeOverride, setNewSizeOverride] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFishItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await createFishItemAction({
      name: newItemName.trim(),
      defaultDailyRateYer: Number(newItemRate),
    });
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "فشل إضافة الصنف.");
      return;
    }

    setIsNewItemModalOpen(false);
    setNewItemName("");
    setNewItemRate(5);
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setError(null);
    setIsLoading(true);

    const res = await updateFishPriceAction({
      fishItemId: editItem.id,
      newDailyRateYer: Number(updatedRate),
    });
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "فشل تعديل السعر.");
      return;
    }

    setEditItem(null);
  };

  const handleCreateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sizeTargetItem) return;
    setError(null);
    setIsLoading(true);

    const res = await createFishSizeAction({
      fishItemId: sizeTargetItem.id,
      label: newSizeLabel.trim(),
      dailyRateOverrideYer: newSizeOverride ? Number(newSizeOverride) : null,
    });
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "فشل إضافة الحجم.");
      return;
    }

    setSizeTargetItem(null);
    setNewSizeLabel("");
    setNewSizeOverride("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">دليل أصناف الصيد والتسعير</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            التصنيف يعتمد على (اسم الصيد + الحجم). تعديل السعر يسري على الدفعات الجديدة فقط ولا يؤثر على الدفعات السابقة.
          </p>
        </div>

        {isManager && (
          <Button onClick={() => setIsNewItemModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>إضافة صنف صيد جديد</span>
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catalog.map((item) => (
          <Card key={item.id} className="p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <Fish className="w-5 h-5 text-primary-600" />
                    <span>{item.name}</span>
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    السعر الافتراضي:{" "}
                    <span className="font-bold text-slate-800">
                      {item.defaultRateYer} ر.ي / كجم / يوم
                    </span>
                  </div>
                </div>

                {isManager && (
                  <button
                    onClick={() => {
                      setEditItem(item);
                      setUpdatedRate(item.defaultRateYer);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    title="تعديل السعر الافتراضي"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sizes List */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">الأحجام المسجلة:</span>
                  {isManager && (
                    <button
                      onClick={() => setSizeTargetItem(item)}
                      className="text-primary-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة حجم</span>
                    </button>
                  )}
                </div>

                {item.sizes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">لا توجد أحجام مضافة بعد.</p>
                ) : (
                  <div className="space-y-1.5">
                    {item.sizes.map((s) => (
                      <div
                        key={s.id}
                        className="px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800">{s.label}</span>
                        <span className="text-slate-500 font-mono">
                          {s.overrideRateYer != null
                            ? `${s.overrideRateYer} ر.ي (سعر مخصص)`
                            : `${item.defaultRateYer} ر.ي (افتراضي)`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal: New Fish Item */}
      <Modal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        title="إضافة صنف صيد جديد"
        maxWidth="md"
      >
        <form onSubmit={handleCreateFishItem} className="space-y-4">
          <Input
            label="اسم الصيد (مثال: تونة، ثمد، باغة) *"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="سعر التخزين اليومي الافتراضي (ريال يمني / كجم / يوم) *"
            type="number"
            step="0.1"
            min="0"
            value={newItemRate}
            onChange={(e) => setNewItemRate(Number(e.target.value))}
            required
            dir="ltr"
            className="text-right"
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewItemModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              حفظ الصنف
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Update Price */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`تعديل سعر الصنف: ${editItem?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdatePrice} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
            ⚠️ <strong>تنبيه للمدير:</strong> تعديل السعر هنا يسري على عمليات التوريد الجديدة فقط، بينما تستمر البضاعة المخزنة حالياً في المستودع باحتساب رسومها وفق السعر المسجل عند دخولها.
          </div>

          <Input
            label="السعر اليومي الجديد (ريال يمني / كجم / يوم) *"
            type="number"
            step="0.1"
            min="0"
            value={updatedRate}
            onChange={(e) => setUpdatedRate(Number(e.target.value))}
            required
            dir="ltr"
            className="text-right"
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditItem(null)}
            >
              إلغاء
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              تحديث السعر
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Size */}
      <Modal
        isOpen={!!sizeTargetItem}
        onClose={() => setSizeTargetItem(null)}
        title={`إضافة حجم جديد لصنف: ${sizeTargetItem?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateSize} className="space-y-4">
          <Input
            label="تسمية الحجم (مثال: 3/5، 5/7، كبير، وسط) *"
            placeholder="مثال: 3/5"
            value={newSizeLabel}
            onChange={(e) => setNewSizeLabel(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="سعر مخصص لهذا الحجم (اختياري - اتركه فارغاً لاستخدام السعر الافتراضي)"
            type="number"
            step="0.1"
            min="0"
            placeholder={`السعر الافتراضي: ${sizeTargetItem?.defaultRateYer} ر.ي`}
            value={newSizeOverride}
            onChange={(e) => setNewSizeOverride(e.target.value)}
            dir="ltr"
            className="text-right"
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSizeTargetItem(null)}
            >
              إلغاء
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              إضافة الحجم
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
