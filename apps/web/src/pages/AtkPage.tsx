import { PageMeta } from '../components/layout/PageMeta.tsx'
import { pageMeta } from '../config/seo.ts'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { AtkOrderForm } from '../features/orders/AtkOrderForm.tsx'
import { ProductCatalog } from '../features/products/ProductCatalog.tsx'

export function AtkPage() {
  return (
    <>
      <PageMeta {...pageMeta.atk} />
      <PageHeader eyebrow="Produk" title="ATK">
        Alat tulis dan perlengkapan kuliah. Produk bertanda “Stok sedang kosong”
        tetap kami tampilkan, tetapi sementara belum dapat dibeli.
      </PageHeader>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        <ProductCatalog />
        <AtkOrderForm />
      </div>
    </>
  )
}
