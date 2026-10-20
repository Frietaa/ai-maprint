import { type ComponentProps, useId } from 'react'

interface TextFieldProps extends Omit<
  ComponentProps<'input'>,
  'id' | 'className'
> {
  label: string
  // Always-visible help text (e.g. password requirements).
  hint?: string
  error?: string
  optional?: boolean
}

// Labelled input with accessible hint and error text: the label is tied to
// the input, hint/error are announced through aria-describedby and
// aria-invalid marks the invalid state. No placeholder-only labels.
export function TextField({
  label,
  hint,
  error,
  optional = false,
  ...input
}: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
        {optional ? (
          <span className="font-normal text-slate-500"> (opsional)</span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="mt-1 text-sm text-slate-600">
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-1.5 block min-h-11 w-full rounded-lg border bg-white px-3 text-base text-slate-900 shadow-sm ${
          error
            ? 'border-red-500 focus-visible:outline-red-600'
            : 'border-slate-300'
        }`}
        {...input}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
