import type { z } from 'zod'
import { type FieldErrors, ValidationError } from '../errors/app-error.js'

// Parses request query parameters with a Zod schema. Schemas are strict, so
// unknown parameters (e.g. an attempted `activeOnly=false`) are rejected.
export function parseQuery<S extends z.ZodType>(
  schema: S,
  query: unknown,
): z.infer<S> {
  const result = schema.safeParse(query)
  if (!result.success) {
    throw new ValidationError(
      toFieldErrors(result.error, 'Unknown query parameter', 'query'),
    )
  }
  return result.data
}

// Zod issues → `{ field: [messages] }`. Unknown keys (strict schemas) are
// reported per key; issues on the whole input use `rootField`.
export function toFieldErrors(
  error: z.ZodError,
  unknownKeyMessage: string,
  rootField: string,
): FieldErrors {
  const errors: FieldErrors = {}
  const add = (field: string, message: string) => {
    ;(errors[field] ??= []).push(message)
  }

  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) add(key, unknownKeyMessage)
      continue
    }
    const field = issue.path.length > 0 ? issue.path.join('.') : rootField
    add(field, issue.message)
  }
  return errors
}

// Parses route parameters (e.g. :publicId) with a Zod schema.
export function parseParams<S extends z.ZodType>(
  schema: S,
  params: unknown,
): z.infer<S> {
  const result = schema.safeParse(params)
  if (!result.success) {
    throw new ValidationError(
      toFieldErrors(result.error, 'Unknown parameter', 'params'),
    )
  }
  return result.data
}
