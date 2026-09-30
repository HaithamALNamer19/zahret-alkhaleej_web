import { CompanyRepository } from "../ports/CompanyRepository";
import { Company, CompanyStatus } from "../../domain/Company";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import { Result } from "@/core/application/result/Result";
import { UserRole } from "@/core/application/authorization/Role";

export interface ToggleWithdrawalBlockInput {
  companyId: string;
  block: boolean;
  reason?: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class ToggleCompanyWithdrawalBlockUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: ToggleWithdrawalBlockInput): Promise<Result<Company, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية تعديل حالة إيقاف الصرف."));
      }

      const company = await this.companyRepository.findById(input.companyId);
      if (!company) {
        return Result.fail(new Error("الشركة غير موجودة."));
      }

      const beforeBlocked = company.isWithdrawalBlocked();

      if (input.block) {
        if (!input.reason || input.reason.trim().length === 0) {
          return Result.fail(new Error("يجب تحديد سبب إيقاف الصرف."));
        }
        company.blockWithdrawal(input.reason);
      } else {
        company.unblockWithdrawal();
      }

      await this.companyRepository.save(company);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: input.block ? "BLOCK_WITHDRAWAL" : "UNBLOCK_WITHDRAWAL",
        entityType: "Company",
        entityId: company.getId(),
        reference: company.getCode().getValue(),
        before: { withdrawalBlocked: beforeBlocked },
        after: {
          withdrawalBlocked: company.isWithdrawalBlocked(),
          reason: company.getWithdrawalBlockReason() || null,
        },
        reason: input.reason,
      });

      return Result.ok(company);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export interface UpdateCompanyInput {
  companyId: string;
  name: string;
  contactPerson: string;
  phone: string;
  notes?: string;
  status: CompanyStatus;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class UpdateCompanyUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: UpdateCompanyInput): Promise<Result<Company, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("لا يملك الموظف صلاحية تعديل بيانات الشركات."));
      }

      const company = await this.companyRepository.findById(input.companyId);
      if (!company) {
        return Result.fail(new Error("الشركة غير موجودة."));
      }

      const before = {
        name: company.getName(),
        contactPerson: company.getContactPerson(),
        phone: company.getPhone(),
        status: company.getStatus(),
      };

      company.updateDetails({
        name: input.name,
        contactPerson: input.contactPerson,
        phone: input.phone,
        notes: input.notes,
        status: input.status,
      });

      await this.companyRepository.save(company);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "UPDATE_COMPANY",
        entityType: "Company",
        entityId: company.getId(),
        reference: company.getCode().getValue(),
        before,
        after: {
          name: company.getName(),
          contactPerson: company.getContactPerson(),
          phone: company.getPhone(),
          status: company.getStatus(),
        },
      });

      return Result.ok(company);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
