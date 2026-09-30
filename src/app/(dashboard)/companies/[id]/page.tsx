import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { container } from "@/server/container";
import { CompanyDetailsView } from "./CompanyDetailsView";

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const company = await container.companyRepository.findById(id);
  if (!company) {
    notFound();
  }

  // Fetch company inventory lots
  const lots = await container.lotRepository.findByCompanyId(id);

  // Fetch inbounds & outbounds for movements tab
  const inbounds = await container.inboundRepository.findAll(id);
  const outbounds = await container.outboundRepository.findAll(id);

  // Financial data (restricted to Managers)
  const isManager = user.role === "WAREHOUSE_MANAGER" || user.role === "GENERAL_MANAGER";
  let statementSummary: any = null;
  let payments: any[] = [];
  let discounts: any[] = [];

  if (isManager) {
    const res = await container.getCompanyStatementUseCase.execute({
      companyId: id,
      actor: {
        userId: user.id,
        name: user.displayName,
        role: user.role,
      },
    });
    if (res.isSuccess()) {
      statementSummary = res.getValue();
    }

    payments = await container.paymentRepository.findByCompanyId(id);
    discounts = await container.discountRepository.findByCompanyId(id);
  }

  return (
    <CompanyDetailsView
      user={user}
      company={{
        id: company.getId(),
        code: company.getCode().getValue(),
        name: company.getName(),
        contactPerson: company.getContactPerson(),
        phone: company.getPhone(),
        notes: company.getNotes(),
        status: company.getStatus(),
        withdrawalBlocked: company.isWithdrawalBlocked(),
        withdrawalBlockReason: company.getWithdrawalBlockReason(),
        createdAt: company.getCreatedAt().toISOString(),
      }}
      lots={lots.map((l) => ({
        id: l.getId(),
        lotNumber: l.getLotNumber().getValue(),
        fishName: l.getFishNameSnapshot(),
        fishSize: l.getFishSizeSnapshot(),
        originalKg: l.getOriginalWeight().toKilograms(),
        remainingKg: l.getRemainingWeight().toKilograms(),
        entryDate: l.getEntryDate().toString(),
        entryDateArabic: l.getEntryDate().formatArabic(),
        status: l.getStatus(),
        baseDailyRateYer: l.getBaseDailyRateSnapshot().toYer(),
      }))}
      inbounds={inbounds.map((inb) => ({
        id: inb.getId(),
        receiptNumber: inb.getReceiptNumber().getValue(),
        entryDate: inb.getEntryDate().formatArabic(),
        status: inb.getStatus(),
      }))}
      outbounds={outbounds.map((out) => ({
        id: out.getId(),
        receiptNumber: out.getReceiptNumber().getValue(),
        withdrawalDate: out.getWithdrawalDate().formatArabic(),
        status: out.getStatus(),
      }))}
      isManager={isManager}
      statementSummary={
        statementSummary
          ? {
              asOfDate: statementSummary.asOfDate.formatArabic(),
              totalFeesYer: statementSummary.totalAccruedStorageFees.toYer(),
              totalPaymentsYer: statementSummary.totalPayments.toYer(),
              totalDiscountsYer: statementSummary.totalDiscounts.toYer(),
              netBalanceYer: statementSummary.netOutstandingBalance.toYer(),
              entries: statementSummary.entries.map((e: any) => ({
                date: e.date.formatArabic(),
                description: e.description,
                reference: e.reference,
                type: e.type,
                debitYer: e.debit.toYer(),
                creditYer: e.credit.toYer(),
                runningBalanceYer: e.runningBalance.toYer(),
              })),
            }
          : null
      }
      payments={payments.map((p) => ({
        id: p.getId(),
        paymentNumber: p.getPaymentNumber().getValue(),
        amountYer: p.getAmount().toYer(),
        method: p.getPaymentMethod() === "CASH" ? "نقداً" : "تحويل",
        date: p.getPaymentDate().formatArabic(),
        status: p.getStatus(),
      }))}
      discounts={discounts.map((d) => ({
        id: d.getId(),
        discountNumber: d.getDiscountNumber().getValue(),
        amountYer: d.getAmount().toYer(),
        reason: d.getReason(),
        date: d.getDate().formatArabic(),
      }))}
    />
  );
}
