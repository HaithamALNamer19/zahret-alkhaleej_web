import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import Link from "next/link";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Plus, Printer, FileInput } from "lucide-react";

export default async function InboundPage() {
  await requireAuth();

  const [inbounds, companies] = await Promise.all([
    container.inboundRepository.findAll(),
    container.companyRepository.findAll(),
  ]);

  const companyMap = new Map<string, string>();
  for (const c of companies) {
    companyMap.set(c.getId(), c.getName());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">سندات الإدخال (Inbound Receipts)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            سجلات إدخال الصيد وتوزيع الدفعات على مستودعات التبريد
          </p>
        </div>

        <Link
          href="/inbound/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all duration-75 active:scale-95 active:translate-y-0.5 select-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء سند إدخال جديد</span>
        </Link>
      </div>

      <Card>
        {inbounds.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <FileInput className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            لا توجد سندات إدخال مسجلة بعد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                  <th className="p-3.5">رقم السند</th>
                  <th className="p-3.5">الشركة</th>
                  <th className="p-3.5">تاريخ الإدخال</th>
                  <th className="p-3.5">عدد الأصناف</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الطباعة والإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {inbounds.map((inb) => (
                  <tr key={inb.getId()} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-bold text-slate-900">
                      {inb.getReceiptNumber().getValue()}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      {companyMap.get(inb.getCompanyId()) || inb.getCompanyId()}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {inb.getEntryDate().formatArabic()}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {inb.getLines().length} أصناف
                    </td>
                    <td className="p-3.5">
                      <Badge variant={inb.getStatus() === "CANCELLED" ? "danger" : "success"}>
                        {inb.getStatus() === "CANCELLED" ? "ملغي" : "معتمد"}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <Link
                        href={`/print/inbound/${inb.getId()}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة A4</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
