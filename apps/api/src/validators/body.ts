import type { z } from 'zod'
import { ValidationError } from '../errors/app-error.js'
import { toFieldErrors } from './query.js'

// Parses a JSON request body with a strict Zod schema: unknown fields (e.g.
// an injected `role`) are rejected, never silently ignored.
export function parseBody<S extends z.ZodType>(
  schema: S,
  body: unknown,
): z.infer<S> {
  const result = schema.safeParse(body)
  if (!result.success) {
    throw new ValidationError(
      toFieldErrors(result.error, 'Unknown field', 'body'),
    )
  }
  return result.data
}
