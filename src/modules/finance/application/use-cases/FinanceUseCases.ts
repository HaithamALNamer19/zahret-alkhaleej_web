import { PaymentRepository, DiscountRepository } from "../ports/FinanceRepositories";
import { CompanyRepository } from "@/modules/companies/application/ports/CompanyRepository";
import { CounterService } from "@/core/application/ports/CounterService";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import { Result } from "@/core/application/result/Result";
import { Payment, PaymentMethod } from "../../domain/Payment";
import { Discount } from "../../domain/Discount";
import { ReceiptNumber } from "@/core/domain/value-objects/ReceiptNumber";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Money } from "@/core/domain/value-objects/Money";
import { UserRole } from "@/core/application/authorization/Role";

export interface RecordPaymentInput {
  companyId: string;
  amountYer: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DD
  notes?: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class RecordPaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly counterService: CounterService,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: RecordPaymentInput): Promise<Result<Payment, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية تسجيل مدفوعات مالية."));
      }

      const company = await this.companyRepository.findById(input.companyId);
      if (!company) {
        return Result.fail(new Error("الشركة غير موجودة."));
      }

      if (input.amountYer <= 0) {
        return Result.fail(new Error("مبلغ الدفعة يجب أن يكون أكبر من صفر."));
      }

      const paymentDate = BusinessDate.fromString(input.paymentDate);
      const year = paymentDate.toDate().getUTCFullYear();
      const numStr = await this.counterService.getNextFormattedNumber("PAY", year);
      const paymentNumber = ReceiptNumber.fromString(numStr);

      const payment = Payment.create({
        id: paymentNumber.getValue().toLowerCase(),
        paymentNumber,
        companyId: company.getId(),
        amount: Money.fromYer(input.amountYer),
        paymentMethod: input.paymentMethod,
        paymentDate,
        notes: input.notes,
        receivedBy: input.actor.userId,
      });

      await this.paymentRepository.save(payment);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "RECORD_PAYMENT",
        entityType: "Payment",
        entityId: payment.getId(),
        reference: payment.getPaymentNumber().getValue(),
        after: {
          companyId: payment.getCompanyId(),
          amountYer: input.amountYer,
          method: input.paymentMethod,
          date: paymentDate.toString(),
        },
      });

      return Result.ok(payment);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export interface RecordDiscountInput {
  companyId: string;
  amountYer: number;
  reason: string;
  date: string; // YYYY-MM-DD
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class RecordDiscountUseCase {
  constructor(
    private readonly discountRepository: DiscountRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly counterService: CounterService,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: RecordDiscountInput): Promise<Result<Discount, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية تسجيل خصومات مالية."));
      }

      const company = await this.companyRepository.findById(input.companyId);
      if (!company) {
        return Result.fail(new Error("الشركة غير موجودة."));
      }

      if (input.amountYer <= 0) {
        return Result.fail(new Error("مبلغ الخصم يجب أن يكون أكبر من صفر."));
      }

      const date = BusinessDate.fromString(input.date);
      const year = date.toDate().getUTCFullYear();
      const numStr = await this.counterService.getNextFormattedNumber("DISC", year);
      const discountNumber = ReceiptNumber.fromString(numStr);

      const discount = Discount.create({
        id: discountNumber.getValue().toLowerCase(),
        discountNumber,
        companyId: company.getId(),
        amount: Money.fromYer(input.amountYer),
        reason: input.reason,
        date,
        createdBy: input.actor.userId,
        approvedBy: input.actor.name,
      });

      await this.discountRepository.save(discount);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "RECORD_DISCOUNT",
        entityType: "Discount",
        entityId: discount.getId(),
        reference: discount.getDiscountNumber().getValue(),
        after: {
          companyId: discount.getCompanyId(),
          amountYer: input.amountYer,
          reason: input.reason,
          date: date.toString(),
        },
      });

      return Result.ok(discount);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
