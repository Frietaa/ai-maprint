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
