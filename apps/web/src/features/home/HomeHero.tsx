import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { brand } from '../../config/brand.ts'

// Homepage "aurora" card (hero and closing call to action) — a deep purple/indigo surface with soft,
// organic blobs in the brand colours (purple, indigo, orange, yellow).
// Kept light for scrolling: plain divs with CSS gradients (no blur
// filters); only `transform` is animated, so the GPU moves the layers
// without repainting. Motion stops for prefers-reduced-motion (index.css).

const blob = 'pointer-events-none absolute will-change-transform'

function AuroraBlobs() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {/* Indigo haze, bottom right */}
      <div
        className={`${blob} -right-[10%] -bottom-1/3 h-3/4 w-2/3 rounded-full bg-[radial-gradient(closest-side,rgb(69_73_160/0.7),transparent)]`}
      />
      {/* Lighter violet blob, left */}
      <div
        className={`${blob} -top-1/4 -left-[12%] h-[130%] w-1/2 rounded-[45%_55%_60%_40%/55%_45%_55%_45%] bg-[radial-gradient(circle_at_40%_40%,rgb(124_58_237/0.55),rgb(91_33_182/0.25)_55%,transparent_75%)] motion-safe:animate-blob-drift`}
      />
      {/* Big orange/yellow blob, top right */}
      <div
        className={`${blob} -top-[22%] -right-[30%] h-2/5 w-3/4 sm:-top-[45%] sm:-right-[8%] sm:h-[105%] sm:w-[52%] rounded-[55%_45%_50%_50%/40%_45%_55%_60%] bg-linear-to-br from-highlight-500 via-[#ff9a1f] to-accent-600 shadow-[0_0_60px_rgb(255_154_31/0.35)] motion-safe:animate-blob-drift-slow`}
      />
      {/* Yellow blob, bottom right */}
      <div
        className={`${blob} -right-[14%] -bottom-[10%] size-24 sm:-right-[3%] sm:-bottom-[18%] rounded-[50%_50%_45%_55%/55%_50%_50%_45%] bg-linear-to-br from-highlight-300 to-[#f8b400] shadow-[0_0_40px_rgb(248_201_0/0.35)] motion-safe:animate-blob-drift sm:size-44 lg:size-48`}
      />
      {/* Small floating bubble */}
      <div
        className={`${blob} right-[16%] bottom-[30%] hidden size-7 rounded-full sm:block bg-[#e4e1f0]/85 motion-safe:animate-blob-bob`}
      />
    </div>
  )
}

// Buttons on the dark aurora card (yellow focus ring for contrast).
export const auroraPrimaryButton =
  'inline-flex min-h-11 items-center rounded-xl bg-highlight-400 px-5 font-bold text-brand-950 shadow-lg shadow-highlight-500/25 transition hover:-translate-y-0.5 hover:bg-highlight-300 motion-reduce:transform-none focus-visible:outline-highlight-400'
export const auroraSecondaryButton =
  'inline-flex min-h-11 items-center rounded-xl px-5 font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/10 focus-visible:outline-highlight-400'

// The dark card with the drifting blobs; a scrim keeps the text readable
// (from the left for left-aligned text, from the centre otherwise).
export function AuroraCard({
  children,
  centered = false,
}: {
  children: ReactNode
  centered?: boolean
}) {
  return (
    <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#1c0b3a] shadow-2xl shadow-brand-950/30 ring-1 ring-white/10">
      <AuroraBlobs />
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${
          centered
            ? 'bg-[radial-gradient(ellipse_at_center,rgb(28_11_58/0.75),rgb(28_11_58/0.3)_60%,transparent)]'
            : 'bg-gradient-to-r from-[#1c0b3a]/70 via-[#1c0b3a]/25 to-transparent'
        }`}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

export function HomeHero({ name }: { name: string }) {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8"
    >
      <AuroraCard>
        <div className="px-6 py-10 sm:px-12 sm:py-14 lg:py-16">
          <h1
            id="hero-title"
            className="inline-flex rounded-full border border-white/25 bg-white/10 px-6 py-2 text-sm font-bold tracking-wide text-highlight-400 uppercase sm:px-8 sm:text-base"
          >
            {name}
          </h1>
          <p className="mt-4 text-5xl leading-[1.02] font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Print tugas?
            <span className="block text-highlight-400">Gak perlu ribet.</span>
          </p>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            {brand.tagline}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#layanan" className={auroraPrimaryButton}>
              Lihat layanan
            </a>
            <Link to="/locations" className={auroraSecondaryButton}>
              Cari lokasi
            </Link>
          </div>
        </div>
      </AuroraCard>
    </section>
  )
}
