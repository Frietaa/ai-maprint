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

  // Malformed requests rejected by Express itself (e.g. bad URL encoding).
  if (isClientError(error)) {
    res.status(400).json({ message: 'Bad request' } satisfies ApiErrorResponse)
    return
  }

  console.error(`Unhandled error on ${req.method} ${req.path}:`, error)
  res
    .status(500)
    .json({ message: 'Internal server error' } satisfies ApiErrorResponse)
}

function isClientError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const status = (error as { status?: unknown }).status
  return typeof status === 'number' && status >= 400 && status < 500
}
