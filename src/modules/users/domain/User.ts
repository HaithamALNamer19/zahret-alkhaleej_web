import { UserRole } from "@/core/application/authorization/Role";
import { Username } from "@/core/domain/value-objects/Username";

export interface UserProps {
  id: string;
  authUid: string;
  username: Username;
  displayName: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  public static create(props: Omit<UserProps, "createdAt" | "updatedAt">): User {
    const now = new Date();
    return new User({
      ...props,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getAuthUid(): string {
    return this.props.authUid;
  }

  public getUsername(): Username {
    return this.props.username;
  }

  public getDisplayName(): string {
    return this.props.displayName;
  }

  public getRole(): UserRole {
    return this.props.role;
  }

  public isActive(): boolean {
    return this.props.active;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public disable(): void {
    if (this.props.role === "GENERAL_MANAGER") {
      throw new Error("لا يمكن إيقاف حساب المدير العام.");
    }
    this.props.active = false;
    this.props.updatedAt = new Date();
  }

  public enable(): void {
    this.props.active = true;
    this.props.updatedAt = new Date();
  }

  public changeRole(newRole: UserRole): void {
    this.props.role = newRole;
    this.props.updatedAt = new Date();
  }
}
