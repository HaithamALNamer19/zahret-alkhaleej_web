import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { FinanceManagerView } from "./FinanceManagerView";

export default async function FinancePage() {
  const user = await requireAuth(["WAREHOUSE_MANAGER", "GENERAL_MANAGER"]);

  const [companies, payments, discounts] = await Promise.all([
    container.companyRepository.findAll(),
    container.paymentRepository.findAll(),
    container.discountRepository.findAll(),
  ]);

  const companyMap = new Map<string, string>();
  for (const c of companies) {
    companyMap.set(c.getId(), c.getName());
  }

  return (
    <FinanceManagerView
      companies={companies.map((c) => ({ id: c.getId(), name: c.getName(), code: c.getCode().getValue() }))}
      payments={payments.map((p) => ({
        id: p.getId(),
        paymentNumber: p.getPaymentNumber().getValue(),
        companyName: companyMap.get(p.getCompanyId()) || p.getCompanyId(),
        companyId: p.getCompanyId(),
        amountYer: p.getAmount().toYer(),
        method: p.getPaymentMethod() === "CASH" ? "نقداً" : "تحويل بنكي",
        date: p.getPaymentDate().formatArabic(),
        notes: p.getNotes(),
        status: p.getStatus(),
      }))}
      discounts={discounts.map((d) => ({
        id: d.getId(),
        discountNumber: d.getDiscountNumber().getValue(),
        companyName: companyMap.get(d.getCompanyId()) || d.getCompanyId(),
        companyId: d.getCompanyId(),
        amountYer: d.getAmount().toYer(),
        reason: d.getReason(),
        date: d.getDate().formatArabic(),
        status: d.getStatus(),
      }))}
    />
  );
}
