import { UserRepository } from "../ports/UserRepository";
import { UserRole } from "@/core/application/authorization/Role";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import { Result } from "@/core/application/result/Result";

export interface DisableUserInput {
  targetUserId: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class DisableUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: DisableUserInput): Promise<Result<void, Error>> {
    try {
      if (input.actor.role !== "GENERAL_MANAGER") {
        return Result.fail(new Error("صلاحية إيقاف المستخدمين مقتصرة على المدير العام فقط."));
      }

      if (input.targetUserId === input.actor.userId) {
        return Result.fail(new Error("لا يمكنك إيقاف حسابك الخاص."));
      }

      const user = await this.userRepository.findById(input.targetUserId);
      if (!user) {
        return Result.fail(new Error("المستخدم غير موجود."));
      }

      user.disable();
      await this.userRepository.save(user);
      await this.userRepository.revokeTokens(user.getAuthUid());

      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "DISABLE_USER",
        entityType: "User",
        entityId: user.getId(),
        reference: user.getUsername().getValue(),
        before: { active: true },
        after: { active: false },
      });

      return Result.ok(undefined);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export interface ResetPasswordInput {
  targetUserId: string;
  newPassword: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: ResetPasswordInput): Promise<Result<void, Error>> {
    try {
      if (input.actor.role !== "GENERAL_MANAGER") {
        return Result.fail(new Error("صلاحية إعادة تعيين كلمة المرور مقتصرة على المدير العام فقط."));
      }

      if (!input.newPassword || input.newPassword.length < 6) {
        return Result.fail(new Error("كلمة المرور يجب أن لا تقل عن 6 أحرف."));
      }

      const user = await this.userRepository.findById(input.targetUserId);
      if (!user) {
        return Result.fail(new Error("المستخدم غير موجود."));
      }

      await this.userRepository.setUserPassword(user.getAuthUid(), input.newPassword);
      await this.userRepository.revokeTokens(user.getAuthUid());

      // Audit password reset without ever logging the actual password!
      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "RESET_PASSWORD",
        entityType: "User",
        entityId: user.getId(),
        reference: user.getUsername().getValue(),
        reason: "إعادة تعيين كلمة المرور بواسطة المدير العام",
      });

      return Result.ok(undefined);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
