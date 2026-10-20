import type { ProductDto } from '@maba-printing/shared'
import { formatProductPrice } from '../../lib/format-price.ts'
import { resolveImageRef } from '../../lib/image-ref.ts'

const AVAILABILITY = {
  AVAILABLE: {
    label: 'Tersedia',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  UNAVAILABLE: {
    label: 'Stok sedang kosong',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
    dot: 'bg-amber-500',
  },
} as const

export function ProductCard({ product }: { product: ProductDto }) {
  const imageSrc = resolveImageRef(product.imageRef)
  const availability = AVAILABILITY[product.availability]
  const unavailable = product.availability === 'UNAVAILABLE'

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-video bg-slate-100 sm:aspect-[4/3]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            className={`size-full object-cover ${unavailable ? 'opacity-70' : ''}`}
          />
        ) : (
          <ProductPlaceholder />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-slate-900">
          {product.name}
        </h3>
        {product.description ? (
          <p className="mt-1 text-sm text-slate-600">{product.description}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
          <p className="text-lg font-semibold text-slate-900">
            {formatProductPrice(product.price)}
          </p>
          <p
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${availability.className}`}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${availability.dot}`}
            />
            {availability.label}
          </p>
        </div>
      </div>
    </article>
  )
}

// Decorative placeholder used when no safe image reference is configured.
function ProductPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="grid size-full place-items-center text-slate-400"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="M21 16l-5-5-8 8" />
      </svg>
    </div>
  )
}
