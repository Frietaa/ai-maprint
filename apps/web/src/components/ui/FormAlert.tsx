import type { ReactNode, Ref } from 'react'

interface FormAlertProps {
  tone: 'error' | 'success'
  children: ReactNode
  ref?: Ref<HTMLDivElement>
}

// Form-level message. Errors use role="alert" and can receive focus (forms
// move focus here after a failed submit); successes are polite status
// messages.
export function FormAlert({ tone, children, ref }: FormAlertProps) {
  const isError = tone === 'error'
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={isError ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm outline-none ${
        isError
          ? 'border-red-200 bg-red-50 text-red-900'
          : 'border-green-200 bg-green-50 text-green-900'
      }`}
    >
      {children}
    </div>
  )
}
