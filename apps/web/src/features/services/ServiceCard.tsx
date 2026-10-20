import type { ServiceDto } from '@maba-printing/shared'
import { formatServicePrice } from '../../lib/format-price.ts'

interface ServiceCardProps {
  service: ServiceDto
  // id -> name of active locations; undefined while locations load/fail.
  locationNames?: ReadonlyMap<string, string>
}

function availabilityText(
  ids: readonly string[],
  names: ReadonlyMap<string, string> | undefined,
): string {
  if (ids.length === 0) return 'Saat ini belum tersedia di lokasi kami.'
  const known = names
    ? ids.map((id) => names.get(id)).filter((name) => name !== undefined)
    : []
  if (known.length > 0) return `Tersedia di: ${known.join(', ')}`
  return `Tersedia di ${ids.length} lokasi`
}

export function ServiceCard({ service, locationNames }: ServiceCardProps) {
  const needsConfirmation = service.priceType === 'REQUIRES_CONFIRMATION'

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
      {service.description ? (
        <p className="mt-1 text-sm text-slate-600">{service.description}</p>
      ) : null}
      <p className="mt-4 text-lg font-semibold text-slate-900">
        {formatServicePrice(service.priceType, service.price)}
      </p>
      {needsConfirmation ? (
        <p className="text-xs text-slate-500">
          Harga akhir dikonfirmasi setelah kebutuhan Anda diperiksa.
        </p>
      ) : null}
      <p className="mt-auto pt-4 text-sm text-slate-600">
        {availabilityText(service.availableLocationIds, locationNames)}
      </p>
    </article>
  )
}
