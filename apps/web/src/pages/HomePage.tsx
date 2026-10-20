import { PageMeta } from '../components/layout/PageMeta.tsx'
import { pageMeta } from '../config/seo.ts'
import { Link } from 'react-router'
import { brand } from '../config/brand.ts'
import { BusinessLineCards } from '../features/home/BusinessLineCards.tsx'
import { LocationPreview } from '../features/home/LocationPreview.tsx'
import { useBusinessIdentity } from '../features/settings/use-public-settings.ts'

const steps = [
  {
    title: 'Pilih layanan',
    text: 'Lihat layanan dan produk beserta harganya di website ini.',
  },
  {
    title: 'Datang atau hubungi kami',
    text: 'Sampaikan kebutuhan Anda di lokasi kami atau lewat kontak yang tersedia.',
  },
  {
    title: 'Ambil hasilnya',
    text: 'Kami konfirmasi detail dan harga akhir sebelum pekerjaan dimulai.',
  },
]

const primaryButton =
  'inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700'
const secondaryButton =
  'inline-flex min-h-11 items-center rounded-lg bg-white px-5 font-medium text-slate-800 ring-1 ring-slate-300 hover:bg-slate-100'

export function HomePage() {
  const { name, settings } = useBusinessIdentity()
  const publicInfo = settings?.publicInfo ?? null
  const whatsapp = settings?.whatsappNumber ?? null

  return (
    <>
      <PageMeta {...pageMeta.home} />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold text-brand-700">
            Untuk mahasiswa dan umum
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            {brand.tagline} — dalam satu tempat, dengan informasi harga yang
            mudah dilihat.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#layanan" className={primaryButton}>
              Lihat layanan
            </a>
            <Link to="/locations" className={secondaryButton}>
              Cari lokasi
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6">
        <section aria-labelledby="layanan">
          <h2
            id="layanan"
            className="scroll-mt-24 text-2xl font-bold text-slate-900"
          >
            Layanan kami
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Empat layanan untuk kebutuhan kuliah dan pekerjaan Anda.
          </p>
          <div className="mt-6">
            <BusinessLineCards />
          </div>
        </section>

        <section aria-labelledby="cara-kerja">
          <h2 id="cara-kerja" className="text-2xl font-bold text-slate-900">
            Cara kerjanya
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white"
                >
                  {index + 1}
                </span>
                <h3 className="mt-3 font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="lokasi-kami">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="lokasi-kami" className="text-2xl font-bold text-slate-900">
              Lokasi kami
            </h2>
            <Link
              to="/locations"
              className="py-1 text-sm font-medium text-brand-700 hover:underline"
            >
              Semua lokasi &amp; jam buka
            </Link>
          </div>
          <div className="mt-6">
            <LocationPreview />
          </div>
        </section>

        {publicInfo || whatsapp ? (
          <section
            aria-labelledby="informasi"
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <h2 id="informasi" className="text-xl font-semibold text-slate-900">
              Informasi
            </h2>
            {publicInfo ? (
              <p className="mt-2 whitespace-pre-line text-slate-700">
                {publicInfo}
              </p>
            ) : null}
            {whatsapp ? (
              <p className="mt-3 text-sm text-slate-700">
                <span className="font-medium">WhatsApp:</span> {whatsapp}
              </p>
            ) : null}
          </section>
        ) : null}

        <section
          aria-labelledby="mulai"
          className="rounded-2xl bg-slate-900 px-6 py-10 text-center text-white sm:px-10"
        >
          <h2 id="mulai" className="text-2xl font-bold">
            Siap mengerjakan tugas Anda?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-300">
            Pilih layanan yang Anda butuhkan, lalu kunjungi lokasi terdekat.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/printing"
              className="inline-flex min-h-11 items-center rounded-lg bg-white px-5 font-medium text-slate-900 hover:bg-slate-100"
            >
              Mulai dari Printing
            </Link>
            <Link
              to="/locations"
              className="inline-flex min-h-11 items-center rounded-lg px-5 font-medium text-white ring-1 ring-white/40 hover:bg-white/10"
            >
              Lihat lokasi
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
