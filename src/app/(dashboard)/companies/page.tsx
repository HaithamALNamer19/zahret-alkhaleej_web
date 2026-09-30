import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import Link from "next/link";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Plus, Building2, Phone, AlertOctagon, Search } from "lucide-react";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const query = params.q || "";

  const companies = await container.companyRepository.findAll({
    searchQuery: query,
  });

  const isManager = user.role === "WAREHOUSE_MANAGER" || user.role === "GENERAL_MANAGER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">شركات الصيد (العملاء)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة بيانات شركات الصيد وحالة الصرف والأرصدة
          </p>
        </div>

        {isManager && (
          <Link
            href="/companies/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة شركة جديدة</span>
          </Link>
        )}
      </div>

      {/* Search Input */}
      <Card className="p-4">
        <form method="GET" className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="بحث باسم الشركة، الكود، أو رقم الهاتف..."
            className="w-full pr-10 pl-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
          />
        </form>
      </Card>

      {/* Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-300">
            <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            لا توجد شركات مسجلة تطابق البحث.
          </div>
        ) : (
          companies.map((company) => {
            const isBlocked = company.isWithdrawalBlocked();
            return (
              <Card
                key={company.getId()}
                className={`p-5 hover:border-slate-300 transition-all ${
                  isBlocked ? "border-rose-200 bg-rose-50/10" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                      {company.getCode().getValue()}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-2">
                      {company.getName()}
                    </h3>
                  </div>

                  {isBlocked ? (
                    <Badge variant="danger" className="gap-1">
                      <AlertOctagon className="w-3 h-3" />
                      <span>صرف موقوف</span>
                    </Badge>
                  ) : (
                    <Badge variant="success">نشط</Badge>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">المسؤول:</span>
                    <span className="font-semibold">{company.getContactPerson() || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">الهاتف:</span>
                    <span className="font-semibold font-mono" dir="ltr">
                      {company.getPhone() || "—"}
                    </span>
                  </div>
                </div>

                {isBlocked && company.getWithdrawalBlockReason() && (
                  <div className="mt-3 p-2 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700">
                    <span className="font-bold">سبب الإيقاف:</span>{" "}
                    {company.getWithdrawalBlockReason()}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={`/companies/${company.getId()}`}
                    className="block w-full py-2 text-center text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/60"
                  >
                    عرض الملف الكامل والتفاصيل ←
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
