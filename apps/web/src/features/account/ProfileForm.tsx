import type { ProfileDto } from '@maba-printing/shared'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { FormAlert } from '../../components/ui/FormAlert.tsx'
import { TextField } from '../../components/ui/TextField.tsx'
import { authErrorMessage } from '../auth/auth-error-message.ts'
import { useFocusFirstError } from '../auth/use-focus-first-error.ts'
import {
  type FieldErrors,
  hasErrors,
  validateName,
  validateWhatsapp,
} from '../auth/validation.ts'
import { useUpdateProfile } from './use-profile.ts'

interface ProfileFormProps {
  profile: ProfileDto
  onDone: (saved: boolean) => void
}

type Field = 'name' | 'whatsapp'

// Edits the member-editable fields only: name and WhatsApp. Email, role and
// sign-in methods are not editable here.
export function ProfileForm({ profile, onDone }: ProfileFormProps) {
  const update = useUpdateProfile()
  const [name, setName] = useState(profile.name)
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? '')
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [attempt, setAttempt] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  useFocusFirstError(formRef, attempt, hasErrors(errors))

  useEffect(() => {
    if (update.error) alertRef.current?.focus()
  }, [update.error])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next = {
      name: validateName(name),
      whatsapp: validateWhatsapp(whatsapp),
    }
    setErrors(next)
    setAttempt((n) => n + 1)
    if (hasErrors(next)) return
    update.mutate(
      { name, whatsapp: whatsapp.trim() === '' ? null : whatsapp },
      { onSuccess: () => onDone(true) },
    )
  }

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="space-y-4">
      {update.error ? (
        <FormAlert ref={alertRef} tone="error">
          {authErrorMessage(update.error, 'profile')}
        </FormAlert>
      ) : null}
      <TextField
        label="Nama"
        name="name"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
        required
      />
      <TextField
        label="Nomor WhatsApp"
        type="tel"
        name="whatsapp"
        autoComplete="tel"
        inputMode="tel"
        optional
        hint="Kosongkan untuk menghapus nomor."
        value={whatsapp}
        onChange={(event) => setWhatsapp(event.target.value)}
        error={errors.whatsapp}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={update.isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {update.isPending ? 'Menyimpan…' : 'Simpan'}
        </button>
        <button
          type="button"
          onClick={() => onDone(false)}
          disabled={update.isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100 disabled:opacity-60"
        >
          Batal
        </button>
      </div>
    </form>
  )
}
