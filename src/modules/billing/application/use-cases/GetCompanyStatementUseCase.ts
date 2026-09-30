import { LotRepository, OutboundReceiptRepository } from "@/modules/inventory/application/ports/InventoryRepositories";
import { PaymentRepository, DiscountRepository } from "@/modules/finance/application/ports/FinanceRepositories";
import { CompanyRepository } from "@/modules/companies/application/ports/CompanyRepository";
import { CompanyStatementService, CompanyStatementSummary } from "../../domain/services/CompanyStatementService";
import { BusinessDate } from "@/core/domain/value-objects/BusinessDate";
import { Result } from "@/core/application/result/Result";
import { UserRole } from "@/core/application/authorization/Role";
import { OutboundAllocation } from "@/modules/inventory/domain/OutboundAllocation";

export interface GetCompanyStatementInput {
  companyId: string;
  asOfDate?: string; // YYYY-MM-DD (defaults to today)
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class GetCompanyStatementUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly lotRepository: LotRepository,
    private readonly outboundRepository: OutboundReceiptRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly discountRepository: DiscountRepository
  ) {}

  public async execute(input: GetCompanyStatementInput): Promise<Result<CompanyStatementSummary, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("غير مصرح للموظف بالاطلاع على البيانات المالية وكشوفات الحساب."));
      }

      const company = await this.companyRepository.findById(input.companyId);
      if (!company) {
        return Result.fail(new Error("الشركة غير موجودة."));
      }

      const asOfDate = input.asOfDate
        ? BusinessDate.fromString(input.asOfDate)
        : BusinessDate.today();

      // 1. Fetch all lots for this company
      const lots = await this.lotRepository.findByCompanyId(input.companyId);

      // 2. Fetch all allocations for each lot
      const allocationsByLotId = new Map<string, OutboundAllocation[]>();
      for (const lot of lots) {
        const allocs = await this.outboundRepository.findAllocationsByLotId(lot.getId());
        allocationsByLotId.set(lot.getId(), allocs);
      }

      // 3. Fetch all payments and discounts
      const payments = await this.paymentRepository.findByCompanyId(input.companyId);
      const discounts = await this.discountRepository.findByCompanyId(input.companyId);

      // 4. Generate financial statement
      const statement = CompanyStatementService.generateStatement({
        companyId: input.companyId,
        asOfDate,
        lots,
        allocationsByLotId,
        payments,
        discounts,
      });

      return Result.ok(statement);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
