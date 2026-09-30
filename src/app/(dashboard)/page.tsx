import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { StorageFeeCalculator } from "@/modules/billing/domain/services/StorageFeeCalculator";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Weight } from "@/core/domain/value-objects/Weight";
import { Money } from "@/core/domain/value-objects/Money";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import Link from "next/link";
import {
  Boxes,
  Building2,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { OceanFlowerEmblem } from "@/shared/components/BrandLogo";

export default async function DashboardPage() {
  const user = await requireAuth();
  const isManager = user.role === "WAREHOUSE_MANAGER" || user.role === "GENERAL_MANAGER";

  const today = BusinessDate.today();

  // 1. Fetch all required entities concurrently in ONE parallel batch
  const [
    openLots,
    companies,
    warehouses,
    settings,
    allLocations,
    recentInbounds,
    recentOutbounds,
    allPayments,
    allDiscounts,
    allAllocations,
  ] = await Promise.all([
    container.lotRepository.findAllOpenLots(),
    container.companyRepository.findAll(),
    container.warehouseRepository.findAll(),
    container.settingsRepository.getSettings(),
    container.stockLocationRepository.findAll(),
    container.inboundRepository.findAll(),
    container.outboundRepository.findAll(),
    isManager ? container.paymentRepository.findAll() : Promise.resolve([]),
    isManager ? container.discountRepository.findAll() : Promise.resolve([]),
    isManager ? container.outboundRepository.findAllAllocations() : Promise.resolve([]),
  ]);

  const warningDays = settings.getFreePeriodWarningDays();

  // Map locations by warehouse
  const warehouseBalances = new Map<string, number>();
  for (const w of warehouses) {
    warehouseBalances.set(w.getId(), 0);
  }

  for (const loc of allLocations) {
    const current = warehouseBalances.get(loc.getWarehouseId()) || 0;
    warehouseBalances.set(loc.getWarehouseId(), current + loc.getRemainingWeight().getGrams());
  }

  // Map allocations by lotId for in-memory fee calculation
  const allocationsByLotId = new Map<string, import("@/modules/inventory/domain/OutboundAllocation").OutboundAllocation[]>();
  for (const alloc of allAllocations) {
    const list = allocationsByLotId.get(alloc.getLotId()) || [];
    list.push(alloc);
    allocationsByLotId.set(alloc.getLotId(), list);
  }

  const companyMap = new Map<string, string>();
  for (const c of companies) {
    companyMap.set(c.getId(), c.getName());
  }

  let totalGrams = 0;
  const lotsNearFreeEnd: any[] = [];

  for (const lot of openLots) {
    totalGrams += lot.getRemainingWeight().getGrams();

    // Check free days remaining
    const ageDay = today.getAgeDayFromEntry(lot.getEntryDate());
    const freeDays = lot.getFreeDaysSnapshot();
    const remainingFree = Math.max(0, freeDays - ageDay);

    if (remainingFree > 0 && remainingFree <= warningDays) {
      lotsNearFreeEnd.push({
        lotId: lot.getId(),
        lotNumber: lot.getLotNumber().getValue(),
        companyName: companyMap.get(lot.getCompanyId()) || "شركة غير محددة",
        fishName: lot.getFishNameSnapshot(),
        fishSize: lot.getFishSizeSnapshot(),
        remainingKg: lot.getRemainingWeight().toKilograms(),
        daysLeft: remainingFree,
      });
    }
  }

  const totalWeight = Weight.fromGrams(totalGrams);

  // 4. If Manager: Compute Financial KPIs in-memory
  let totalAccruedFees = Money.zero();
  let totalPaymentsReceived = Money.zero();
  let totalDiscountsGiven = Money.zero();

  if (isManager) {
    for (const p of allPayments) {
      if (p.getStatus() !== "CANCELLED") {
        totalPaymentsReceived = totalPaymentsReceived.add(p.getAmount());
      }
    }

    for (const d of allDiscounts) {
      if (d.getStatus() !== "CANCELLED") {
        totalDiscountsGiven = totalDiscountsGiven.add(d.getAmount());
      }
    }

    for (const lot of openLots) {
      const allocs = allocationsByLotId.get(lot.getId()) || [];
      const withdrawals = allocs.map((a) => ({
        withdrawalDate: a.getWithdrawalDate(),
        withdrawnWeight: a.getWeight(),
      }));

      const res = StorageFeeCalculator.calculate({
        entryDate: lot.getEntryDate(),
        asOfDate: today,
        originalWeight: lot.getOriginalWeight(),
        withdrawals,
        baseRate: lot.getBaseDailyRateSnapshot(),
        freeDays: lot.getFreeDaysSnapshot(),
        stageDays: lot.getStageDaysSnapshot(),
        doublingFactor: lot.getDoublingFactorSnapshot(),
      });

      totalAccruedFees = totalAccruedFees.add(res.totalFee);
    }
  }

  const netReceivables = totalAccruedFees.subtract(totalPaymentsReceived).subtract(totalDiscountsGiven);

  return (
    <div className="space-y-6">
      {/* Top Branded Corporate Hero Banner */}
      <div className="bg-gradient-to-r from-[#061838] via-[#0b2e6b] to-[#071a3d] text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-blue-900/60 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Subtle Decorative Wave in SVG */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none" fill="none">
            <path d="M0 100 Q250 20 500 120 T1000 60 L1000 200 L0 200 Z" fill="#60a5fa" />
            <path d="M0 140 Q250 80 500 160 T1000 120 L1000 200 L0 200 Z" fill="#dc2626" />
          </svg>
        </div>

        {/* Brand Details & Greeting */}
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3.5">
            <OceanFlowerEmblem size={52} showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  مرحباً بك، {user.displayName}
                </h1>
                <span className="text-[#f87171] text-xl">👋</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-200/90 font-medium">
                شركة زهرة المحيط لتصدير الأسماك — التاريخ المعتمد: {today.formatArabic()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-blue-100 font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>نظام التبريد: 4 مستودعات جاهزة</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-blue-100 font-mono font-semibold backdrop-blur-xs">
              <span>سعة الإشغال: {((totalWeight.toTons() / 1150) * 100).toFixed(1)}% من 1,150 طن</span>
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/inbound/new"
            className="px-4 py-2.5 text-xs sm:text-sm font-bold text-[#0e3a82] bg-white hover:bg-blue-50 rounded-xl shadow-md transition-all duration-75 active:scale-95 active:shadow-inner flex items-center gap-2"
          >
            <ArrowDownLeft className="w-4 h-4 text-[#dc2626]" />
            <span>سند إدخال صيد</span>
          </Link>
          <Link
            href="/outbound/new"
            className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl backdrop-blur-xs transition-all duration-75 active:scale-95 active:shadow-inner flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4 text-cyan-300" />
            <span>سند صرف FIFO</span>
          </Link>
          {isManager && (
            <Link
              href="/finance"
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-700/60 hover:bg-emerald-700 border border-emerald-500/40 rounded-xl backdrop-blur-xs transition-all duration-75 active:scale-95 active:shadow-inner flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4 text-emerald-300" />
              <span>المالية</span>
            </Link>
          )}
        </div>
      </div>

      {/* Primary KPI Grid (Operational) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي المخزون الحالي</span>
            <div className="p-2 rounded-xl bg-primary-50 text-primary-600">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {totalWeight.toTons() >= 1
                ? `${totalWeight.toTons().toFixed(2)} طن`
                : `${totalWeight.toKilograms().toLocaleString("ar-YE")} كجم`}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              يعادل {totalWeight.toKilograms().toLocaleString("ar-YE")} كجم
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">الشركات النشطة</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{companies.length}</div>
            <p className="text-xs text-slate-400 mt-0.5">شركة صيد مسجلة</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">الدفعات المفتوحة (Lots)</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{openLots.length}</div>
            <p className="text-xs text-slate-400 mt-0.5">دفعة بمخزون متاح</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">أوشكت الفترة المجانية</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{lotsNearFreeEnd.length}</div>
            <p className="text-xs text-slate-400 mt-0.5">
              خلال {warningDays} يوم أو أقل
            </p>
          </div>
        </Card>
      </div>

      {/* Financial KPIs (Visible ONLY to Managers - Section #84) */}
      {isManager && (
        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>المؤشرات المالية والخزينة (خاص بالإدارة)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">صافي المستحقات / المديونيات</span>
                <div className="p-2 rounded-xl bg-emerald-100/60 text-emerald-700">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-emerald-700">
                  {netReceivables.formatArabic()}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">رسوم التخزين - المدفوعات - الخصومات</p>
              </div>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500">إجمالي رسوم التخزين المستحقة</span>
              <div className="mt-3 text-xl font-extrabold text-slate-900">
                {totalAccruedFees.formatArabic()}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">محسوبة لحظياً حتى اليوم</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500">إجمالي المقبوضات النقدية</span>
              <div className="mt-3 text-xl font-extrabold text-emerald-600">
                {totalPaymentsReceived.formatArabic()}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">عبر الخزينة والتحويلات</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-semibold text-slate-500">إجمالي الخصومات المعتمدة</span>
              <div className="mt-3 text-xl font-extrabold text-amber-600">
                {totalDiscountsGiven.formatArabic()}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">خصومات إدارية ممنوحة</p>
            </Card>
          </div>
        </div>
      )}

      {/* Warehouse Distribution & Free Period Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory per Warehouse */}
        <Card title="توزيع المخزون حسب المستودع">
          <div className="space-y-4">
            {warehouses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">لا توجد مستودعات مضافة بعد.</p>
            ) : (
              warehouses.map((wh) => {
                const whGrams = warehouseBalances.get(wh.getId()) || 0;
                const whWeight = Weight.fromGrams(whGrams);
                const percentage =
                  totalGrams > 0 ? ((whGrams / totalGrams) * 100).toFixed(1) : "0";

                return (
                  <div key={wh.getId()} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">
                        {wh.getName()} ({wh.getCode()})
                      </span>
                      <span className="text-slate-500">
                        {whWeight.toKilograms().toLocaleString("ar-YE")} كجم ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Lots Near Free End Warning */}
        <Card
          title="تنبيهات الفترة المجانية (خلال يومين)"
          subtitle="دفعات صيد أوشكت فترتها المجانية على الانتهاء لتبدأ الرسوم اليومية"
        >
          {lotsNearFreeEnd.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              لا توجد دفعات تنتهي فترتها المجانية قريباً
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lotsNearFreeEnd.map((item) => (
                <div key={item.lotId} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-800">
                      {item.fishName} ({item.fishSize}) — {item.lotNumber}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.companyName}</div>
                  </div>
                  <div className="text-left">
                    <Badge variant="warning">
                      باقي {item.daysLeft} {item.daysLeft === 1 ? "يوم" : "أيام"}
                    </Badge>
                    <div className="text-xs font-bold text-slate-700 mt-1">
                      {item.remainingKg.toLocaleString("ar-YE")} كجم
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Inbounds & Outbounds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="أحدث سندات الإدخال"
          action={
            <Link href="/inbound" className="text-xs text-primary-600 font-semibold hover:underline">
              عرض الكل
            </Link>
          }
        >
          <div className="divide-y divide-slate-100">
            {recentInbounds.slice(0, 5).map((inb) => (
              <div key={inb.getId()} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {inb.getReceiptNumber().getValue()}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    تاريخ الإدخال: {inb.getEntryDate().formatArabic()}
                  </div>
                </div>
                <Badge variant={inb.getStatus() === "CANCELLED" ? "danger" : "success"}>
                  {inb.getStatus() === "CANCELLED" ? "ملغي" : "معتمد"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="أحدث سندات الصرف (FIFO)"
          action={
            <Link href="/outbound" className="text-xs text-primary-600 font-semibold hover:underline">
              عرض الكل
            </Link>
          }
        >
          <div className="divide-y divide-slate-100">
            {recentOutbounds.slice(0, 5).map((out) => (
              <div key={out.getId()} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {out.getReceiptNumber().getValue()}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    تاريخ الصرف: {out.getWithdrawalDate().formatArabic()}
                  </div>
                </div>
                <Badge variant={out.getStatus() === "CANCELLED" ? "danger" : "info"}>
                  {out.getStatus() === "CANCELLED" ? "ملغي" : "معتمد"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
