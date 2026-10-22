import type { AdminCategoryDto } from '@maba-printing/shared'
import { type FormEvent, type ReactNode, useState } from 'react'
import { FormAlert } from '../../components/ui/FormAlert.tsx'
import { adminErrorMessage } from './admin-error-message.ts'
import {
  ActiveBadge,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  Panel,
} from './AdminUi.tsx'
import { useAdminCatalog, useSaveCatalog } from './use-admin.ts'

// Labelled text input for the Admin forms.
export function TextInput({
  label,
  value,
  onChange,
  hint,
  inputMode,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: ReactNode
  inputMode?: 'numeric' | 'decimal' | 'url' | 'tel' | 'text'
  required?: boolean
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required ? null : (
        <span className="font-normal text-slate-500"> (opsional)</span>
      )}
      <input
        className={inputClass}
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? (
        <span className="mt-1 block text-xs font-normal text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export function SaveFeedback({
  error,
  saved,
}: {
  error: unknown
  saved: string | null
}) {
  if (error)
    return <FormAlert tone="error">{adminErrorMessage(error)}</FormAlert>
  if (saved) return <FormAlert tone="success">{saved}</FormAlert>
  return null
}

// Product or service categories: add, rename is via the API, and toggle
// active state (no deletion — orders may reference them).
export function CategoryManager({
  resource,
  title,
  warning,
}: {
  resource: 'productCategories' | 'serviceCategories'
  title: string
  warning?: ReactNode
}) {
  const categories = useAdminCatalog(resource)
  const save = useSaveCatalog(resource)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState<string | null>(null)

  function onCreate(event: FormEvent) {
    event.preventDefault()
    if (name.trim() === '') return
    save.mutate(
      { body: { name } },
      {
        onSuccess: () => {
          setName('')
          setSaved('Kategori ditambahkan.')
        },
      },
    )
  }

  function toggle(category: AdminCategoryDto) {
    save.mutate(
      { id: category.id, body: { isActive: !category.isActive } },
      {
        onSuccess: () =>
          setSaved(
            `Kategori ${category.isActive ? 'dinonaktifkan' : 'diaktifkan'}.`,
          ),
      },
    )
  }

  return (
    <Panel title={title}>
      {warning ? <div className="mb-3">{warning}</div> : null}
      <ul className="mb-4 divide-y divide-slate-100 text-sm">
        {(categories.data ?? []).map((category) => (
          <li
            key={category.id}
            className="flex flex-wrap items-center justify-between gap-2 py-2"
          >
            <span className="flex items-center gap-2">
              {category.name} <ActiveBadge active={category.isActive} />
            </span>
            <button
              type="button"
              className={buttonSecondary}
              disabled={save.isPending}
              onClick={() => toggle(category)}
            >
              {category.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={onCreate}
        noValidate
        className="flex flex-wrap items-end gap-2"
      >
        <div className="min-w-48 flex-1">
          <TextInput
            label="Kategori baru"
            value={name}
            onChange={setName}
            required
          />
        </div>
        <button
          type="submit"
          className={buttonPrimary}
          disabled={save.isPending}
        >
          Tambah
        </button>
      </form>
      <div className="mt-3">
        <SaveFeedback
          error={save.error}
          saved={save.isSuccess ? saved : null}
        />
      </div>
    </Panel>
  )
}
