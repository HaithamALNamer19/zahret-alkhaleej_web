import { CompanyRepository } from "../ports/CompanyRepository";
import { Company } from "../../domain/Company";
import { CompanyCode } from "@/core/domain/value-objects/CompanyCode";
import { CounterService } from "@/core/application/ports/CounterService";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import { Result } from "@/core/application/result/Result";
import { UserRole } from "@/core/application/authorization/Role";

export interface CreateCompanyInput {
  name: string;
  contactPerson: string;
  phone: string;
  notes?: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class CreateCompanyUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly counterService: CounterService,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: CreateCompanyInput): Promise<Result<Company, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية إنشاء شركات جديدة."));
      }

      const generatedCodeStr = await this.counterService.getNextCompanyCode();
      const codeVo = CompanyCode.fromString(generatedCodeStr);

      const id = codeVo.getValue().toLowerCase();
      const company = Company.create({
        id,
        code: codeVo,
        name: input.name,
        contactPerson: input.contactPerson,
        phone: input.phone,
        notes: input.notes,
      });

      await this.companyRepository.save(company);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "CREATE_COMPANY",
        entityType: "Company",
        entityId: company.getId(),
        reference: company.getCode().getValue(),
        after: {
          code: company.getCode().getValue(),
          name: company.getName(),
          contactPerson: company.getContactPerson(),
          phone: company.getPhone(),
        },
      });

      return Result.ok(company);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
