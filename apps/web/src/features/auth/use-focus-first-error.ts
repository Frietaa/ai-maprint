import { type RefObject, useEffect } from 'react'

// After a submit attempt with validation errors, move focus to the first
// invalid field so keyboard and screen-reader users land on the problem.
// `attempt` changes on every submit.
export function useFocusFirstError(
  form: RefObject<HTMLFormElement | null>,
  attempt: number,
  hasFieldErrors: boolean,
): void {
  useEffect(() => {
    if (attempt === 0 || !hasFieldErrors) return
    form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [form, attempt, hasFieldErrors])
}
