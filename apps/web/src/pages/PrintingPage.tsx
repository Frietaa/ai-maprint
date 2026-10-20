import { PageMeta } from '../components/layout/PageMeta.tsx'
import { pageMeta } from '../config/seo.ts'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { NextStepNotice } from '../features/services/NextStepNotice.tsx'
import { ServiceCatalog } from '../features/services/ServiceCatalog.tsx'

export function PrintingPage() {
  return (
    <>
      <PageMeta {...pageMeta.printing} />
      <PageHeader eyebrow="Layanan" title="Printing">
        Cetak tugas, makalah, laporan, hingga skripsi. Detail seperti ukuran
        kertas, warna, jumlah salinan, dan jilid dapat dikonfirmasi bersama
        kami.
      </PageHeader>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        <ServiceCatalog line="printing" label="Daftar layanan printing" />
        <NextStepNotice />
      </div>
    </>
  )
}
