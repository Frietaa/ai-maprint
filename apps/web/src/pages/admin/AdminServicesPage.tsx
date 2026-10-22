import {
  type AdminServiceDto,
  PRICE_TYPES,
  type PriceType,
} from '@maba-printing/shared'
import { type FormEvent, useState } from 'react'
import { PageMeta } from '../../components/layout/PageMeta.tsx'
import { FormAlert } from '../../components/ui/FormAlert.tsx'
import {
  ActiveBadge,
  AdminPageTitle,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  Panel,
  tableClass,
  tableWrap,
  td,
  th,
} from '../../features/admin/AdminUi.tsx'
import { parseWholeRupiah } from '../../features/admin/admin-input.ts'
import {
  CategoryManager,
  SaveFeedback,
  TextInput,
} from '../../features/admin/CatalogParts.tsx'
import {
  useAdminCatalog,
  useSaveCatalog,
} from '../../features/admin/use-admin.ts'
import { formatServicePrice } from '../../lib/format-price.ts'

const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  FIXED: 'Harga tetap',
  REQUIRES_CONFIRMATION: 'Perlu konfirmasi',
}

export function AdminServicesPage() {
  const services = useAdminCatalog('services')
  const [editing, setEditing] = useState<AdminServiceDto | 'new' | null>(null)

  return (
    <>
      <PageMeta title="Layanan" description="Kelola layanan." />
      <AdminPageTitle title="Layanan">
        <button
          type="button"
          className={buttonPrimary}
          onClick={() => setEditing('new')}
        >
          Tambah layanan
        </button>
      </AdminPageTitle>
      <div className="space-y-4">
        {editing ? (
          <ServiceForm
            key={editing === 'new' ? 'new' : editing.id}
            service={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
          />
        ) : null}
        <div className={tableWrap}>
          <table className={tableClass}>
            <caption className="sr-only">Daftar layanan</caption>
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th scope="col" className={th}>
                  Nama
                </th>
                <th scope="col" className={th}>
                  Kategori
                </th>
                <th scope="col" className={th}>
                  Harga
                </th>
                <th scope="col" className={th}>
                  Status
                </th>
                <th scope="col" className={th}>
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(services.data ?? []).map((service) => (
                <tr key={service.id}>
                  <td className={td}>{service.name}</td>
                  <td className={td}>{service.category.name}</td>
                  <td className={td}>
                    {formatServicePrice(service.priceType, service.price)}
                  </td>
                  <td className={td}>
                    <ActiveBadge active={service.isActive} />
                  </td>
                  <td className={td}>
                    <button
                      type="button"
                      className={buttonSecondary}
                      onClick={() => setEditing(service)}
                      aria-label={`Ubah ${service.name}`}
                    >
                      Ubah
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CategoryManager
          resource="serviceCategories"
          title="Kategori layanan"
          warning={
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              Perhatian: halaman layanan publik (Printing, Service Laptop,
              Instalasi Software) mengelompokkan kategori berdasarkan namanya.
              Gunakan nama yang memuat kata tersebut agar layanan tampil di
              halaman yang benar (KI-013).
            </p>
          }
        />
      </div>
    </>
  )
}

function ServiceForm({
  service,
  onClose,
}: {
  service: AdminServiceDto | null
  onClose: () => void
}) {
  const categories = useAdminCatalog('serviceCategories')
  const save = useSaveCatalog('services')
  const [categoryId, setCategoryId] = useState(service?.category.id ?? '')
  const [name, setName] = useState(service?.name ?? '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [priceType, setPriceType] = useState<PriceType>(
    service?.priceType ?? 'FIXED',
  )
  const [price, setPrice] = useState(service?.price?.toString() ?? '')
  const [isActive, setIsActive] = useState(service?.isActive ?? true)
  const [problem, setProblem] = useState<string | null>(null)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = parseWholeRupiah(price)
    if (Number.isNaN(value)) {
      setProblem('Harga harus dalam Rupiah bulat, misalnya 500.')
      return
    }
    if (priceType === 'FIXED' && value === null) {
      setProblem('Harga tetap wajib diisi.')
      return
    }
    if (!categoryId || name.trim() === '') {
      setProblem('Pilih kategori dan isi nama layanan.')
      return
    }
    setProblem(null)
    save.mutate(
      {
        id: service?.id,
        body: {
          categoryId,
          name,
          description: description.trim() === '' ? null : description,
          priceType,
          price: value,
          isActive,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Panel title={service ? `Ubah layanan: ${service.name}` : 'Layanan baru'}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="grid gap-3 sm:grid-cols-2"
      >
        <label className="block text-sm font-medium text-slate-700">
          Kategori
          <select
            className={inputClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Pilih kategori</option>
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.isActive ? '' : ' (nonaktif)'}
              </option>
            ))}
          </select>
        </label>
        <TextInput label="Nama" value={name} onChange={setName} required />
        <label className="block text-sm font-medium text-slate-700">
          Jenis harga
          <select
            className={inputClass}
            value={priceType}
            onChange={(e) => setPriceType(e.target.value as PriceType)}
          >
            {PRICE_TYPES.map((value) => (
              <option key={value} value={value}>
                {PRICE_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <TextInput
          label="Harga (Rp)"
          value={price}
          onChange={setPrice}
          inputMode="numeric"
          required={priceType === 'FIXED'}
          hint={
            priceType === 'FIXED'
              ? undefined
              : 'Opsional: harga mulai (indikatif).'
          }
        />
        <TextInput
          label="Deskripsi"
          value={description}
          onChange={setDescription}
        />
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="size-5 accent-slate-900"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Aktif
        </label>
        <div className="space-y-2 sm:col-span-2">
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
        </div>
      </form>
    </Panel>
  )
}
