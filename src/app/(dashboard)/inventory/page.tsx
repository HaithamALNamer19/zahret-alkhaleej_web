import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { StorageFeeCalculator } from "@/modules/billing/domain/services/StorageFeeCalculator";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Weight } from "@/core/domain/value-objects/Weight";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import Link from "next/link";
import { Boxes, Search } from "lucide-react";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireAuth();
  const isManager = user.role === "WAREHOUSE_MANAGER" || user.role === "GENERAL_MANAGER";

  const params = await searchParams;
  const query = params.q || "";

  const openLots = await container.lotRepository.findAllOpenLots();
  const companies = await container.companyRepository.findAll();
  const today = BusinessDate.today();

  const companyMap = new Map<string, string>();
  for (const c of companies) {
    companyMap.set(c.getId(), c.getName());
  }

  // Calculate detailed inventory rows with age, stage, and multiplier
  const rows = [];
  for (const lot of openLots) {
    const ageDay = today.getAgeDayFromEntry(lot.getEntryDate());
    const freeDays = lot.getFreeDaysSnapshot();
    const remainingFree = Math.max(0, freeDays - ageDay);

    // Calculate accrued fees and multiplier
    const allocs = await container.outboundRepository.findAllocationsByLotId(lot.getId());
    const withdrawals = allocs.map((a) => ({
      withdrawalDate: a.getWithdrawalDate(),
      withdrawnWeight: a.getWeight(),
    }));

    const feeResult = StorageFeeCalculator.calculate({
      entryDate: lot.getEntryDate(),
      asOfDate: today,
      originalWeight: lot.getOriginalWeight(),
      withdrawals,
      baseRate: lot.getBaseDailyRateSnapshot(),
      freeDays: lot.getFreeDaysSnapshot(),
      stageDays: lot.getStageDaysSnapshot(),
      doublingFactor: lot.getDoublingFactorSnapshot(),
    });

    const withdrawnKg = lot.getOriginalWeight().subtract(lot.getRemainingWeight()).toKilograms();

    // Fetch warehouse locations
    const locs = await container.stockLocationRepository.findByLotId(lot.getId());
    const locSummary = locs
      .filter((l) => l.getRemainingWeight().isPositive())
      .map((l) => `${l.getWarehouseId()} (${l.getRemainingWeight().toKilograms().toLocaleString("ar-YE")} كجم)`)
      .join("، ");

    rows.push({
      id: lot.getId(),
      lotNumber: lot.getLotNumber().getValue(),
      companyName: companyMap.get(lot.getCompanyId()) || lot.getCompanyId(),
      fishName: lot.getFishNameSnapshot(),
      fishSize: lot.getFishSizeSnapshot(),
      locations: locSummary || "—",
      originalKg: lot.getOriginalWeight().toKilograms(),
      withdrawnKg,
      remainingKg: lot.getRemainingWeight().toKilograms(),
      entryDate: lot.getEntryDate().formatArabic(),
      ageDay,
      remainingFree,
      stage: feeResult.currentStage + 1,
      multiplier: feeResult.currentMultiplier,
      baseRateYer: lot.getBaseDailyRateSnapshot().toYer(),
      currentRateYer: feeResult.currentDailyRate.toYer(),
      accruedFeeYer: feeResult.totalFee.toYer(),
    });
  }

  // Filter if query provided
  const filteredRows = query
    ? rows.filter(
        (r) =>
          r.lotNumber.toLowerCase().includes(query.toLowerCase()) ||
          r.companyName.toLowerCase().includes(query.toLowerCase()) ||
          r.fishName.toLowerCase().includes(query.toLowerCase()) ||
          r.fishSize.toLowerCase().includes(query.toLowerCase())
      )
    : rows;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">سجل المخزون والدفعات (Lots)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            كشف تحليلي لحظي لجميع الدفعات المفتوحة وأعمارها ومراحل تضاعف الرسوم
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <form method="GET" className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="بحث برقم الدفعة، اسم الشركة، اسم الصيد، أو الحجم..."
            className="w-full pr-10 pl-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
          />
        </form>
      </Card>

      <Card>
        {filteredRows.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            لا توجد دفعات مخزون مطابقة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                  <th className="p-3">رقم الدفعة</th>
                  <th className="p-3">الشركة</th>
                  <th className="p-3">الصنف / الحجم</th>
                  <th className="p-3">المستودعات</th>
                  <th className="p-3">الأصلي</th>
                  <th className="p-3">المنصرف</th>
                  <th className="p-3">المتبقي</th>
                  <th className="p-3">تاريخ الدخول</th>
                  <th className="p-3">العمر</th>
                  <th className="p-3">المرحلة</th>
                  {isManager && (
                    <>
                      <th className="p-3">السعر الحالي</th>
                      <th className="p-3">الرسوم المستحقة</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{r.lotNumber}</td>
                    <td className="p-3 font-semibold text-slate-700">{r.companyName}</td>
                    <td className="p-3 font-bold text-primary-700">
                      {r.fishName} ({r.fishSize})
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate" title={r.locations}>
                      {r.locations}
                    </td>
                    <td className="p-3 text-slate-500">{r.originalKg.toLocaleString("ar-YE")} كجم</td>
                    <td className="p-3 text-slate-500">{r.withdrawnKg.toLocaleString("ar-YE")} كجم</td>
                    <td className="p-3 font-black text-slate-900">
                      {r.remainingKg.toLocaleString("ar-YE")} كجم
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-500">{r.entryDate}</td>
                    <td className="p-3 font-semibold text-slate-700">{r.ageDay} يوم</td>
                    <td className="p-3">
                      {r.remainingFree > 0 ? (
                        <Badge variant="success">مجاني ({r.remainingFree} يوم متبقي)</Badge>
                      ) : (
                        <Badge variant="warning">
                          مرحلة {r.stage} (×{r.multiplier})
                        </Badge>
                      )}
                    </td>
                    {isManager && (
                      <>
                        <td className="p-3 text-slate-700 font-mono">
                          {r.currentRateYer} ر.ي/كجم
                        </td>
                        <td className="p-3 font-bold text-rose-600 font-mono">
                          {r.accruedFeeYer.toLocaleString("ar-YE")} ر.ي
                        </td>
                      </>
                    )}
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
