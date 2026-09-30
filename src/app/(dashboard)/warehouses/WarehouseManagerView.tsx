"use client";

import React, { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { createWarehouseAction } from "@/server/actions/warehouseActions";
import { Warehouse as WarehouseIcon, Plus } from "lucide-react";

interface WarehouseManagerViewProps {
  warehouses: {
    id: string;
    code: string;
    name: string;
    notes?: string;
    status: string;
    createdAt: string;
  }[];
  isManager: boolean;
}

export const WarehouseManagerView: React.FC<WarehouseManagerViewProps> = ({
  warehouses,
  isManager,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !name.trim()) {
      setError("كود واسم المستودع مطلوبان.");
      return;
    }

    setIsLoading(true);
    const res = await createWarehouseAction({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      notes,
    });
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || "فشل إضافة المستودع.");
      return;
    }

    setIsModalOpen(false);
    setCode("");
    setName("");
    setNotes("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">مستودعات التبريد</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة هناجر وغرف التبريد التابعة للشركة وتوزيع المخزون عليها
          </p>
        </div>

        {isManager && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>إضافة مستودع تبريد جديد</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((wh) => (
          <Card key={wh.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                  {wh.code}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-2">{wh.name}</h3>
              </div>
              <Badge variant={wh.status === "ACTIVE" ? "success" : "neutral"}>
                {wh.status === "ACTIVE" ? "نشط وتشغيلي" : "معطل"}
              </Badge>
            </div>

            {wh.notes && (
              <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {wh.notes}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Create Warehouse Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة مستودع تبريد جديد"
        maxWidth="md"
      >
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="كود المستودع (مثال: WH-A أو WH-1) *"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
            dir="ltr"
            className="text-right"
          />

          <Input
            label="اسم المستودع / الغرفة *"
            placeholder="مثال: مستودع التبريد رقم 1 - الميناء"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">ملاحظات / السعة التقديرية</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: سعة 200 طن، درجة تبريد -25..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              حفظ المستودع
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
