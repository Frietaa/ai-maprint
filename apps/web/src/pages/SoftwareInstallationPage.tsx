import { PageMeta } from '../components/layout/PageMeta.tsx'
import { pageMeta } from '../config/seo.ts'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { SoftwareOrderForm } from '../features/orders/SoftwareOrderForm.tsx'
import { ServiceCatalog } from '../features/services/ServiceCatalog.tsx'

export function SoftwareInstallationPage() {
  return (
    <>
      <PageMeta {...pageMeta.softwareInstallation} />
      <PageHeader eyebrow="Layanan" title="Instalasi Software">
        Bantuan memasang software untuk kebutuhan kuliah dan kerja, mulai dari
        aplikasi perkantoran hingga software pendukung tugas.
      </PageHeader>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        <section
          aria-labelledby="software-legal"
          className="rounded-xl border border-slate-200 bg-white p-6"
        >
          <h2
            id="software-legal"
            className="text-lg font-semibold text-slate-900"
          >
            Hanya software legal
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Kami hanya memasang software yang legal: software berlisensi, gratis
            (freeware), open-source, atau software dengan lisensi sah milik
            Anda. Siapkan kunci lisensi Anda bila diperlukan.
          </p>
        </section>
        <ServiceCatalog
          line="software-installation"
          label="Daftar layanan instalasi software"
        />
        <SoftwareOrderForm />
      </div>
    </>
  )
}
