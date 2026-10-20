// Expected API errors. Anything else reaching the error handler is treated
// as an unexpected server error (500) and never exposed to the client.

export type FieldErrors = Record<string, string[]>

export class AppError extends Error {
  readonly status: number
  readonly errors?: FieldErrors

  constructor(status: number, message: string, errors?: FieldErrors) {
    super(message)
    this.name = new.target.name
    this.status = status
    this.errors = errors
  }
}

export class ValidationError extends AppError {
  constructor(errors: FieldErrors) {
    super(400, 'Validation failed', errors)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message)
  }
}

// Not signed in, or credentials rejected.
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message)
  }
}

// Signed in (or not) but not allowed, including CSRF failures.
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message)
  }
}
