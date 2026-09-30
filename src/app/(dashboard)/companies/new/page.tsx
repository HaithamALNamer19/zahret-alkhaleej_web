"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createCompanyAction } from "@/server/actions/companyActions";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NewCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("يرجى إدخال اسم الشركة.");
      return;
    }

    setIsLoading(true);
    const res = await createCompanyAction({
      name,
      contactPerson,
      phone,
      notes,
    });

    if (!res.success) {
      setError(res.error || "فشل تسجيل الشركة.");
      setIsLoading(false);
      return;
    }

    router.push(`/companies/${res.companyId}`);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/companies"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg border border-slate-200"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">تسجيل شركة صيد جديدة</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            سيتم توليد كود الشركة التسلسلي تلقائياً (مثال: COM-000001)
          </p>
        </div>
      </div>

      <Card className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم الشركة / العميل *"
            placeholder="مثال: شركة الخليج للأسماك"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="الشخص المسؤول"
              placeholder="مثال: الكابتن سالم"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              disabled={isLoading}
            />

            <Input
              label="رقم الهاتف"
              placeholder="مثال: 777123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              dir="ltr"
              className="text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">ملاحظات إضافية</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              placeholder="أي تفاصيل خاصة بالعميل أو الاتفاقات..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/companies"
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              إلغاء
            </Link>
            <Button type="submit" isLoading={isLoading}>
              حفظ الشركة وتوليد الكود
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
