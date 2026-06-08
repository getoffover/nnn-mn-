```typescript
/**
 * Result<T, E> - A monadic type for explicit error handling.
 * Represents a computation that can either succeed with a value of type T
 * or fail with an error of type E.
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

export class Ok<T> {
  readonly value: T;
  readonly isOk: true;
  readonly isErr: false;

  constructor(value: T) {
    this.value = value;
    this.isOk = true;
    this.isErr = false;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok(fn(this.value));
  }

  mapErr<F>(_: (error: E) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  orElse<F>(_: (error: E) => Result<T, F>): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(defaultValue: T): T {
    return this.value;
  }

  unwrapErr(): never {
    throw new Error('Called unwrapErr on Ok');
  }

  match<U>(ok: (value: T) => U, _: (error: E) => U): U {
    return ok(this.value);
  }

  toString(): string {
    return `Ok(${this.value})`;
  }
}

export class Err<E> {
  readonly error: E;
  readonly isOk: false;
  readonly isErr: true;

  constructor(error: E) {
    this.error = error;
    this.isOk = false;
    this.isErr = true;
  }

  map<U>(_: (value: never) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  mapErr<F>(fn: (error: E) => F): Result<never, F> {
    return new Err(fn(this.error));
  }

  andThen<U>(_: (value: never) => Result<U, E>): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  orElse<F>(fn: (error: E) => Result<never, F>): Result<never, F> {
    return fn(this.error);
  }

  unwrap(): never {
    throw new Error(`Called unwrap on Err: ${this.error}`);
  }

  unwrapOr(_: T): never {
    throw new Error(`Called unwrapOr on Err: ${this.error}`);
  }

  unwrapErr(): E {
    return this.error;
  }

  match<U>(_: (value: never) => U, error: (error: E) => U): U {
    return error(this.error);
  }

  toString(): string {
    return `Err(${this.error})`;
  }
}

/**
 * Creates a successful Result with the given value.
 */
export const ok = <T>(value: T): Result<T, Error> => new Ok(value);

/**
 * Creates a failed Result with the given error.
 */
export const err = <E = Error>(error: E): Result<never, E> => new Err(error);

/**
 * Safely executes a function that may throw and returns a Result.
 */
export const tryCatch = <T, E = Error>(
  fn: () => T,
  onError: (error: unknown) => E = (e) => (e instanceof Error ? e : new Error(String(e)))
): Result<T, E> => {
  try {
    return ok(fn());
  } catch (error) {
    return err(onError(error));
  }
};
```