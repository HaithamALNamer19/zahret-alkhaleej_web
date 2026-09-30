/**
 * Generic Result Pattern for Application Use Cases
 * Encapsulates success (with value) or failure (with error)
 */
export class Result<T, E = Error> {
  private constructor(
    private readonly isSuccessStatus: boolean,
    private readonly valueData?: T,
    private readonly errorData?: E
  ) {}

  public static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  public static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  public isSuccess(): boolean {
    return this.isSuccessStatus;
  }

  public isFailure(): boolean {
    return !this.isSuccessStatus;
  }

  public getValue(): T {
    if (!this.isSuccessStatus) {
      throw new Error("Cannot get the value of an error result.");
    }
    return this.valueData as T;
  }

  public getError(): E {
    if (this.isSuccessStatus) {
      throw new Error("Cannot get the error of a successful result.");
    }
    return this.errorData as E;
  }
}
