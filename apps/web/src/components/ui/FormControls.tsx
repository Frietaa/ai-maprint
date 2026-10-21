import { type ComponentProps, type ReactNode, useId } from 'react'

// Accessible form controls in the style of TextField: the label is tied to
// the control, hint/error text is announced through aria-describedby and
// aria-invalid marks the invalid state. No placeholder-only labels.

function describedBy(id: string, hint?: ReactNode, error?: string) {
  return (
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(' ') || undefined
  )
}

function Label({
  htmlFor,
  label,
  optional,
}: {
  htmlFor: string
  label: string
  optional?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-slate-800"
    >
      {label}
      {optional ? (
        <span className="font-normal text-slate-500"> (opsional)</span>
      ) : null}
    </label>
  )
}

function Help({
  id,
  hint,
  error,
}: {
  id: string
  hint?: ReactNode
  error?: string
}) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-slate-600">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </>
  )
}

const controlClass = (error?: string) =>
  `mt-1.5 block w-full rounded-lg border bg-white px-3 text-base text-slate-900 shadow-sm ${
    error ? 'border-red-500 focus-visible:outline-red-600' : 'border-slate-300'
  }`

interface TextAreaFieldProps extends Omit<
  ComponentProps<'textarea'>,
  'id' | 'className'
> {
  label: string
  hint?: ReactNode
  error?: string
  optional?: boolean
}

export function TextAreaField({
  label,
  hint,
  error,
  optional = false,
  rows = 4,
  ...textarea
}: TextAreaFieldProps) {
  const id = useId()
  return (
    <div>
      <Label htmlFor={id} label={label} optional={optional} />
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${controlClass(error)} py-2`}
        {...textarea}
      />
      <Help id={id} hint={hint} error={error} />
    </div>
  )
}

interface SelectFieldProps extends Omit<
  ComponentProps<'select'>,
  'id' | 'className'
> {
  label: string
  hint?: ReactNode
  error?: string
  optional?: boolean
  children: ReactNode
}

export function SelectField({
  label,
  hint,
  error,
  optional = false,
  children,
  ...select
}: SelectFieldProps) {
  const id = useId()
  return (
    <div>
      <Label htmlFor={id} label={label} optional={optional} />
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${controlClass(error)} min-h-11`}
        {...select}
      >
        {children}
      </select>
      <Help id={id} hint={hint} error={error} />
    </div>
  )
}

interface CheckboxFieldProps extends Omit<
  ComponentProps<'input'>,
  'id' | 'className' | 'type'
> {
  label: ReactNode
  error?: string
}

export function CheckboxField({ label, error, ...input }: CheckboxFieldProps) {
  const id = useId()
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-5 shrink-0 rounded border-slate-300 accent-brand-600"
          {...input}
        />
        <label htmlFor={id} className="text-sm text-slate-800">
          {label}
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
