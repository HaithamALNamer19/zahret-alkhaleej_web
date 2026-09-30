import { ApprovalRequestRepository } from "../ports/ApprovalRequestRepository";
import { ApprovalRequest } from "../../domain/ApprovalRequest";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import { Result } from "@/core/application/result/Result";
import { UserRole } from "@/core/application/authorization/Role";
import { adminFirestore } from "@/core/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export interface RequestFifoOverrideInput {
  companyId: string;
  fishItemId: string;
  fishSizeId: string;
  requestedQuantityKg: number;
  normalAllocationDetails: string;
  requestedAlternativeDetails: string;
  reason: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class RequestFifoOverrideUseCase {
  constructor(
    private readonly approvalRepository: ApprovalRequestRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: RequestFifoOverrideInput): Promise<Result<ApprovalRequest, Error>> {
    try {
      const id = "appr-" + Math.random().toString(36).substring(2, 9);
      const request = ApprovalRequest.create({
        id,
        type: "FIFO_OVERRIDE",
        requestedBy: input.actor.userId,
        requestedByName: input.actor.name,
        reason: input.reason,
        payload: {
          companyId: input.companyId,
          fishItemId: input.fishItemId,
          fishSizeId: input.fishSizeId,
          requestedQuantityKg: input.requestedQuantityKg,
          normalAllocationDetails: input.normalAllocationDetails,
          requestedAlternativeDetails: input.requestedAlternativeDetails,
        },
      });

      await this.approvalRepository.save(request);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "REQUEST_FIFO_OVERRIDE",
        entityType: "ApprovalRequest",
        entityId: request.getId(),
        reason: input.reason,
      });

      return Result.ok(request);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export interface ReviewApprovalInput {
  approvalId: string;
  decision: "APPROVE" | "REJECT";
  comment?: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class ReviewApprovalUseCase {
  constructor(
    private readonly approvalRepository: ApprovalRequestRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: ReviewApprovalInput): Promise<Result<ApprovalRequest, Error>> {
    try {
      if (input.actor.role === "EMPLOYEE") {
        return Result.fail(new Error("الموظف لا يملك صلاحية البت في طلبات الموافقة."));
      }

      const request = await this.approvalRepository.findById(input.approvalId);
      if (!request) {
        return Result.fail(new Error("طلب الموافقة غير موجود."));
      }

      if (input.decision === "APPROVE") {
        request.approve(input.actor.userId, input.actor.name, input.comment);
      } else {
        if (!input.comment) {
          return Result.fail(new Error("يجب كتابة تعليق أو سبب الرفض."));
        }
        request.reject(input.actor.userId, input.actor.name, input.comment);
      }

      await this.approvalRepository.save(request);

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: input.decision === "APPROVE" ? "APPROVE_REQUEST" : "REJECT_REQUEST",
        entityType: "ApprovalRequest",
        entityId: request.getId(),
        reason: input.comment,
        after: {
          status: request.getStatus(),
          decision: input.decision,
        },
      });

      return Result.ok(request);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
