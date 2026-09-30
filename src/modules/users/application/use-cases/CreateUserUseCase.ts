import { UserRepository } from "../ports/UserRepository";
import { User } from "../../domain/User";
import { Username } from "@/core/domain/value-objects/Username";
import { UserRole } from "@/core/application/authorization/Role";
import { AuditLogger } from "@/core/application/ports/AuditLogger";
import { Result } from "@/core/application/result/Result";

export interface CreateUserInput {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditLogger: AuditLogger
  ) {}

  public async execute(input: CreateUserInput): Promise<Result<User, Error>> {
    try {
      if (input.actor.role !== "GENERAL_MANAGER") {
        return Result.fail(new Error("صلاحية إنشاء المستخدمين مقتصرة على المدير العام فقط."));
      }

      const usernameVo = Username.fromString(input.username);
      const existing = await this.userRepository.findByUsername(usernameVo.getValue());
      if (existing) {
        return Result.fail(new Error(`اسم المستخدم "${input.username}" مسجل مسبقاً في النظام.`));
      }

      if (!input.password || input.password.length < 6) {
        return Result.fail(new Error("كلمة المرور يجب أن لا تقل عن 6 أحرف."));
      }

      // 1. Create auth user in Firebase Auth
      const authUid = await this.userRepository.createAuthUser(
        usernameVo.getValue(),
        input.password,
        input.displayName
      );

      // 2. Create domain user
      const user = User.create({
        id: authUid,
        authUid,
        username: usernameVo,
        displayName: input.displayName.trim(),
        role: input.role,
        active: true,
      });

      // 3. Save profile in Firestore
      await this.userRepository.save(user);

      // 4. Log in Audit (NEVER log password!)
      await this.auditLogger.log({
        actorUserId: input.actor.userId,
        actorName: input.actor.name,
        action: "CREATE_USER",
        entityType: "User",
        entityId: user.getId(),
        reference: user.getUsername().getValue(),
        after: {
          username: user.getUsername().getValue(),
          displayName: user.getDisplayName(),
          role: user.getRole(),
          active: user.isActive(),
        },
      });

      return Result.ok(user);
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
