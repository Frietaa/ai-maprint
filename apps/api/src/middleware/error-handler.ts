import type { ApiErrorResponse } from '@maba-printing/shared'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { AppError, NotFoundError } from '../errors/app-error.js'

// Unknown routes become a JSON 404 in the standard error shape.
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError())
}

// Centralized error handler (Architecture §45). Expected errors keep their
// status/message; everything else is logged server-side and answered with a
// generic 500 — no stack traces, Prisma/SQL details or configuration values.
export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  if (error instanceof AppError) {
    const body: ApiErrorResponse = { message: error.message }
    if (error.errors) body.errors = error.errors
    res.status(error.status).json(body)
    return
  }

  // Requests rejected by Express/body-parser itself: oversized JSON bodies,
  // malformed JSON, bad URL encoding.
  const status = clientErrorStatus(error)
  if (status === 413) {
    res
      .status(413)
      .json({ message: 'Payload too large' } satisfies ApiErrorResponse)
    return
  }
  if (status !== null) {
    res.status(400).json({ message: 'Bad request' } satisfies ApiErrorResponse)
    return
  }

  // Server-side diagnostics only: request ID, route and the error category.
  // Never the error object itself (it may carry SQL, query arguments or
  // other request data), request bodies, cookies or session contents.
  console.error(
    `Unhandled error [${req.requestId}] ${req.method} ${req.path}: ${errorCategory(error)}`,
  )
  res
    .status(500)
    .json({ message: 'Internal server error' } satisfies ApiErrorResponse)
}

function clientErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null
  const status = (error as { status?: unknown }).status
  return typeof status === 'number' && status >= 400 && status < 500
    ? status
    : null
}

// e.g. "PrismaClientKnownRequestError P2024" or "TypeError".
function errorCategory(error: unknown): string {
  if (!(error instanceof Error)) return typeof error
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? `${error.name} ${code}` : error.name
}
