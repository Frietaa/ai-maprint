import { PageMeta } from '../components/layout/PageMeta.tsx'
import { pageMeta } from '../config/seo.ts'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { NextStepNotice } from '../features/services/NextStepNotice.tsx'
import { ServiceCatalog } from '../features/services/ServiceCatalog.tsx'

export function LaptopServicePage() {
  return (
    <>
      <PageMeta {...pageMeta.laptopService} />
      <PageHeader eyebrow="Layanan" title="Service Laptop">
        Laptop lambat, tidak menyala, atau perlu dibersihkan? Ceritakan keluhan
        Anda, lalu laptop dapat diantar langsung ke lokasi kami atau dijemput.
        Biaya penjemputan dikonfirmasi sesuai jarak.
      </PageHeader>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        <ServiceCatalog
          line="laptop-service"
          label="Daftar layanan service laptop"
        />
        <NextStepNotice>
          Datang ke lokasi kami atau hubungi kontak di bagian bawah halaman
          untuk menjelaskan keluhan laptop dan mengatur antar atau jemput.
        </NextStepNotice>
      </div>
    </>
  )
}
