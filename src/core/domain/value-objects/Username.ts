/**
 * Username Value Object
 * Representation: Internal lowercased identifier [a-z0-9._-], 3 to 30 chars.
 * Used for synthetic Firebase authentication without exposing emails to users.
 */
export class Username {
  private readonly value: string;

  private constructor(value: string) {
    const normalized = value.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(normalized)) {
      throw new Error(
        `اسم مستخدم غير صالح: "${value}". يجب أن يتكون من 3 إلى 30 حرفاً إنجليزياً وأرقاماً ونقاط أو شرطات فقط [a-z0-9._-]`
      );
    }
    this.value = normalized;
  }

  public static fromString(value: string): Username {
    return new Username(value);
  }

  public getValue(): string {
    return this.value;
  }

  /**
   * Generates internal synthetic email for Firebase Auth
   */
  public toSyntheticEmail(domain: string = "auth.zahratalkhaleej.local"): string {
    return `${this.value}@${domain}`;
  }

  public equals(other: Username): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
