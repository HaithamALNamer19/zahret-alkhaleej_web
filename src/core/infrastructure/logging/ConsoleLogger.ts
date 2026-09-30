import { Logger } from "@/core/application/logging/Logger";

export class ConsoleLogger implements Logger {
  private readonly SENSITIVE_KEYS = new Set([
    "password",
    "token",
    "idtoken",
    "refreshtoken",
    "secret",
    "sessioncookie",
    "privatekey",
    "credential",
  ]);

  private sanitize(obj: unknown): unknown {
    if (!obj || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (this.SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  public info(message: string, context?: Record<string, unknown>): void {
    if (context) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, this.sanitize(context));
    } else {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    if (context) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, this.sanitize(context));
    } else {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    }
  }

  public error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      this.sanitize({ error: errorDetails, ...context })
    );
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      if (context) {
        console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, this.sanitize(context));
      } else {
        console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
      }
    }
  }
}
