import type { AdminLocationDto } from '@maba-printing/shared'
import { type FormEvent, useState } from 'react'
import { PageMeta } from '../../components/layout/PageMeta.tsx'
import { FormAlert } from '../../components/ui/FormAlert.tsx'
import {
  ActiveBadge,
  AdminPageTitle,
  buttonPrimary,
  buttonSecondary,
  Panel,
} from '../../features/admin/AdminUi.tsx'
import { SaveFeedback, TextInput } from '../../features/admin/CatalogParts.tsx'
import { OpeningHoursEditor } from '../../features/admin/OpeningHoursEditor.tsx'
import {
  type EditableHours,
  editableHours,
} from '../../features/admin/opening-hours-input.ts'
import {
  useAdminCatalog,
  useLocationServiceToggle,
  useSaveCatalog,
} from '../../features/admin/use-admin.ts'

export function AdminLocationsPage() {
  const locations = useAdminCatalog('locations')
  const [editing, setEditing] = useState<AdminLocationDto | 'new' | null>(null)

  return (
    <>
      <PageMeta title="Lokasi" description="Kelola lokasi." />
      <AdminPageTitle title="Lokasi">
        <button
          type="button"
          className={buttonPrimary}
          onClick={() => setEditing('new')}
        >
          Tambah lokasi
        </button>
      </AdminPageTitle>
      <div className="space-y-4">
        {editing ? (
          <LocationForm
            key={editing === 'new' ? 'new' : editing.id}
            location={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
          />
        ) : null}
        {(locations.data ?? []).map((location) => (
          <Panel
            key={location.id}
            title={location.name}
            actions={
              <span className="flex items-center gap-2">
                <ActiveBadge active={location.isActive} />
                <button
                  type="button"
                  className={buttonSecondary}
                  onClick={() => setEditing(location)}
                  aria-label={`Ubah ${location.name}`}
                >
                  Ubah
                </button>
              </span>
            }
          >
            <p className="text-sm text-slate-700">{location.address}</p>
            <ServiceAvailability location={location} />
          </Panel>
        ))}
      </div>
    </>
  )
}

function ServiceAvailability({ location }: { location: AdminLocationDto }) {
  const services = useAdminCatalog('services')
  const toggle = useLocationServiceToggle()
  const names = new Map((services.data ?? []).map((s) => [s.id, s]))
  // Optimistic state: the checkbox follows the click at once and falls back
  // to the server value if the request fails.
  const [pending, setPending] = useState<Record<string, boolean>>({})

  return (
    <fieldset className="mt-3">
      <legend className="text-sm font-medium text-slate-700">
        Layanan tersedia di lokasi ini
      </legend>
      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {location.services.map((entry) => {
          const service = names.get(entry.serviceId)
          if (!service) return null
          return (
            <li key={entry.serviceId}>
              <label className="flex min-h-10 items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  className="size-5 accent-slate-900"
                  checked={pending[entry.serviceId] ?? entry.isAvailable}
                  disabled={toggle.isPending}
                  onChange={(event) => {
                    const isAvailable = event.target.checked
                    setPending((current) => ({
                      ...current,
                      [entry.serviceId]: isAvailable,
                    }))
                    toggle.mutate(
                      {
                        locationId: location.id,
                        serviceId: entry.serviceId,
                        isAvailable,
                      },
                      {
                        onError: () =>
                          setPending((current) => {
                            const next = { ...current }
                            delete next[entry.serviceId]
                            return next
                          }),
                      },
                    )
                  }}
                />
                {service.name}
                {service.isActive ? '' : ' (layanan nonaktif)'}
              </label>
            </li>
          )
        })}
      </ul>
      {toggle.error ? (
        <div className="mt-2">
          <SaveFeedback error={toggle.error} saved={null} />
        </div>
      ) : null}
    </fieldset>
  )
}

function LocationForm({
  location,
  onClose,
}: {
  location: AdminLocationDto | null
  onClose: () => void
}) {
  const save = useSaveCatalog('locations')
  const [name, setName] = useState(location?.name ?? '')
  const [address, setAddress] = useState(location?.address ?? '')
  const [hoursKnown, setHoursKnown] = useState(
    location ? location.openingHours !== null : true,
  )
  const [hours, setHours] = useState<EditableHours>(
    editableHours(location?.openingHours ?? null),
  )
  const [note, setNote] = useState(location?.openingHours?.note ?? '')
  const [isActive, setIsActive] = useState(location?.isActive ?? true)
  const [problem, setProblem] = useState<string | null>(null)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (name.trim() === '' || address.trim() === '') {
      setProblem('Nama dan alamat wajib diisi.')
      return
    }
    const invalid = Object.values(hours).some((ranges) =>
      ranges.some(
        (range) => !range.open || !range.close || range.open >= range.close,
      ),
    )
    if (hoursKnown && invalid) {
      setProblem('Periksa jam buka: jam buka harus lebih awal dari jam tutup.')
      return
    }
    setProblem(null)
    save.mutate(
      {
        id: location?.id,
        body: {
          name,
          address,
          openingHours: hoursKnown
            ? { weekly: hours, note: note.trim() === '' ? null : note }
            : null,
          isActive,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Panel title={location ? `Ubah lokasi: ${location.name}` : 'Lokasi baru'}>
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Nama" value={name} onChange={setName} required />
          <TextInput
            label="Alamat"
            value={address}
            onChange={setAddress}
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="size-5 accent-slate-900"
            checked={hoursKnown}
            onChange={(e) => setHoursKnown(e.target.checked)}
          />
          Jam buka sudah ditentukan
        </label>
        {hoursKnown ? (
          <>
            <OpeningHoursEditor value={hours} onChange={setHours} />
            <TextInput
              label="Catatan jam buka"
              value={note}
              onChange={setNote}
              hint="Misalnya: tutup pada hari libur nasional."
            />
          </>
        ) : null}
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="size-5 accent-slate-900"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Aktif (tampil di situs dan dapat dipilih pada pesanan)
        </label>
        {problem ? <FormAlert tone="error">{problem}</FormAlert> : null}
        <SaveFeedback error={save.error} saved={null} />
        <div className="flex gap-2">
          <button
            type="submit"
            className={buttonPrimary}
            disabled={save.isPending}
          >
            {save.isPending ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button type="button" className={buttonSecondary} onClick={onClose}>
            Batal
          </button>
        </div>
      </form>
    </Panel>
  )
}
