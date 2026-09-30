import { requireAuth } from "@/server/auth/session";
import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { ScrollText, ShieldCheck } from "lucide-react";

export default async function AuditLogPage() {
  await requireAuth(["WAREHOUSE_MANAGER", "GENERAL_MANAGER"]);

  // Fetch audit logs sorted by createdAt DESC (up to 100 most recent)
  const snap = await adminFirestore
    .collection("auditLogs")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const auditEntries = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      actorName: data.actorName || "النظام",
      action: data.action || "",
      entityType: data.entityType || "",
      entityId: data.entityId || "",
      reference: data.reference || "—",
      reason: data.reason || "—",
      createdAt: data.createdAt?.toDate?.()?.toLocaleString("ar-YE") || "—",
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">سجل الرقابة وحركات النظام</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            سجل رسمي يوثق جميع العمليات المخزنية والمالية والإدارية والتجاوزات
          </p>
        </div>

        <Badge variant="info" className="gap-1.5 py-1 px-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>سجل رقابي غير قابل للتعديل</span>
        </Badge>
      </div>

      <Card>
        {auditEntries.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <ScrollText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            لا توجد سجلات تدقيق مسجلة حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                  <th className="p-3.5">الوقت والتاريخ</th>
                  <th className="p-3.5">المستخدم المنفذ</th>
                  <th className="p-3.5">نوع الحركة</th>
                  <th className="p-3.5">السجل / المستند</th>
                  <th className="p-3.5">المرجع</th>
                  <th className="p-3.5">السبب / البيان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60">
                    <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono">
                      {e.createdAt}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{e.actorName}</td>
                    <td className="p-3.5">
                      <span className="font-mono text-primary-700 bg-primary-50 px-2 py-0.5 rounded text-[11px] font-bold">
                        {e.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-semibold">{e.entityType}</td>
                    <td className="p-3.5 font-mono text-slate-700">{e.reference}</td>
                    <td className="p-3.5 text-slate-500 max-w-sm truncate" title={e.reason}>
                      {e.reason}
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
