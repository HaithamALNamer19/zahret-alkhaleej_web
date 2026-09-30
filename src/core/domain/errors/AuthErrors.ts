import { DomainError } from "./DomainError";

export class UnauthorizedActionError extends DomainError {
  public readonly code = "UNAUTHORIZED_ACTION";

  constructor(permission: string) {
    super(
      `User lacks required permission: ${permission}`,
      "ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء."
    );
  }
}

export class InvalidCredentialsError extends DomainError {
  public readonly code = "INVALID_CREDENTIALS";

  constructor() {
    super(
      "Invalid username or password",
      "اسم المستخدم أو كلمة المرور غير صحيحة."
    );
  }
}

export class UserDisabledError extends DomainError {
  public readonly code = "USER_DISABLED";

  constructor(username: string) {
    super(
      `User account ${username} is disabled`,
      "تم تعطيل هذا الحساب. يرجى مراجعة المدير العام."
    );
  }
}
