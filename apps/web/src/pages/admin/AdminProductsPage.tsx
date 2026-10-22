import {
  type AdminProductDto,
  PRODUCT_AVAILABILITIES,
  type ProductAvailability,
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
import { formatRupiah } from '../../lib/format-price.ts'

const AVAILABILITY_LABELS: Record<ProductAvailability, string> = {
  AVAILABLE: 'Tersedia',
  UNAVAILABLE: 'Stok kosong',
}

export function AdminProductsPage() {
  const products = useAdminCatalog('products')
  const [editing, setEditing] = useState<AdminProductDto | 'new' | null>(null)

  return (
    <>
      <PageMeta title="Produk" description="Kelola produk ATK." />
      <AdminPageTitle title="Produk ATK">
        <button
          type="button"
          className={buttonPrimary}
          onClick={() => setEditing('new')}
        >
          Tambah produk
        </button>
      </AdminPageTitle>
      <div className="space-y-4">
        {editing ? (
          <ProductForm
            key={editing === 'new' ? 'new' : editing.id}
            product={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
          />
        ) : null}
        <div className={tableWrap}>
          <table className={tableClass}>
            <caption className="sr-only">Daftar produk</caption>
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
                  Ketersediaan
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
              {(products.data ?? []).map((product) => (
                <tr key={product.id}>
                  <td className={td}>{product.name}</td>
                  <td className={td}>{product.category.name}</td>
                  <td className={td}>{formatRupiah(product.price)}</td>
                  <td className={td}>
                    {AVAILABILITY_LABELS[product.availability]}
                  </td>
                  <td className={td}>
                    <ActiveBadge active={product.isActive} />
                  </td>
                  <td className={td}>
                    <button
                      type="button"
                      className={buttonSecondary}
                      onClick={() => setEditing(product)}
                      aria-label={`Ubah ${product.name}`}
                    >
                      Ubah
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CategoryManager resource="productCategories" title="Kategori produk" />
      </div>
    </>
  )
}

function ProductForm({
  product,
  onClose,
}: {
  product: AdminProductDto | null
  onClose: () => void
}) {
  const categories = useAdminCatalog('productCategories')
  const save = useSaveCatalog('products')
  const [categoryId, setCategoryId] = useState(product?.category.id ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price.toString() ?? '')
  const [availability, setAvailability] = useState<ProductAvailability>(
    product?.availability ?? 'AVAILABLE',
  )
  const [imageRef, setImageRef] = useState(product?.imageRef ?? '')
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [problem, setProblem] = useState<string | null>(null)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = parseWholeRupiah(price)
    if (value === null || Number.isNaN(value)) {
      setProblem('Harga wajib diisi dalam Rupiah bulat, misalnya 3000.')
      return
    }
    if (!categoryId || name.trim() === '') {
      setProblem('Pilih kategori dan isi nama produk.')
      return
    }
    setProblem(null)
    save.mutate(
      {
        id: product?.id,
        body: {
          categoryId,
          name,
          description: description.trim() === '' ? null : description,
          price: value,
          availability,
          imageRef: imageRef.trim() === '' ? null : imageRef,
          isActive,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Panel title={product ? `Ubah produk: ${product.name}` : 'Produk baru'}>
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
        <TextInput
          label="Harga (Rp)"
          value={price}
          onChange={setPrice}
          inputMode="numeric"
          required
        />
        <label className="block text-sm font-medium text-slate-700">
          Ketersediaan stok
          <select
            className={inputClass}
            value={availability}
            onChange={(e) =>
              setAvailability(e.target.value as ProductAvailability)
            }
          >
            {PRODUCT_AVAILABILITIES.map((value) => (
              <option key={value} value={value}>
                {AVAILABILITY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <TextInput
          label="Deskripsi"
          value={description}
          onChange={setDescription}
        />
        <TextInput
          label="Gambar"
          value={imageRef}
          onChange={setImageRef}
          inputMode="url"
          hint="URL https atau path yang diawali /"
        />
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            className="size-5 accent-slate-900"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Aktif (tampil di katalog publik)
        </label>
        <p className="text-xs text-slate-500 sm:col-span-2">
          “Stok kosong” tetap tampil tetapi tidak dapat dipesan; “nonaktif”
          disembunyikan dari publik. Produk tidak dihapus agar riwayat pesanan
          tetap utuh.
        </p>
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
