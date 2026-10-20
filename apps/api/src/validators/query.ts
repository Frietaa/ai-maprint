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
    throw new ValidationError(toFieldErrors(result.error))
  }
  return result.data
}

function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {}
  const add = (field: string, message: string) => {
    ;(errors[field] ??= []).push(message)
  }

  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) add(key, 'Unknown query parameter')
      continue
    }
    const field = issue.path.length > 0 ? issue.path.join('.') : 'query'
    add(field, issue.message)
  }
  return errors
}
