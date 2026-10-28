import { PageMeta } from '../components/layout/PageMeta.tsx'
import { pageMeta } from '../config/seo.ts'
import { Link } from 'react-router'
import {
  AuroraCard,
  HomeHero,
  auroraPrimaryButton,
  auroraSecondaryButton,
} from '../features/home/HomeHero.tsx'
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

export function HomePage() {
  const { name, settings } = useBusinessIdentity()
  const publicInfo = settings?.publicInfo ?? null
  const whatsapp = settings?.whatsappNumber ?? null

  return (
    <>
      <PageMeta {...pageMeta.home} />
      <HomeHero name={name} />

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

        <section aria-labelledby="mulai">
          <AuroraCard centered>
            <div className="px-6 py-12 text-center sm:px-10 sm:py-16">
              <h2
                id="mulai"
                className="text-3xl leading-tight font-black tracking-tight text-white sm:text-5xl"
              >
                Siap mengerjakan{' '}
                <span className="text-highlight-400">tugas Anda?</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-white/85 sm:text-lg">
                Pilih layanan yang Anda butuhkan, lalu kunjungi lokasi terdekat.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/printing" className={auroraPrimaryButton}>
                  Mulai dari Printing
                </Link>
                <Link to="/locations" className={auroraSecondaryButton}>
                  Lihat lokasi
                </Link>
              </div>
            </div>
          </AuroraCard>
        </section>
      </div>
    </>
  )
}
