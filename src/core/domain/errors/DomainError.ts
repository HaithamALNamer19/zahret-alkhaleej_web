/**
 * Base Domain Error class
 * Pure TypeScript, independent of frameworks or HTTP status codes.
 */
export abstract class DomainError extends Error {
  public abstract readonly code: string;
  public readonly arabicMessage: string;

  constructor(message: string, arabicMessage?: string) {
    super(message);
    this.name = this.constructor.name;
    this.arabicMessage = arabicMessage || message;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
