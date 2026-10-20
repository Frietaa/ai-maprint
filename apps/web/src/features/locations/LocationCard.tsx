import type { LocationDto } from '@maba-printing/shared'
import { OpeningHours } from './OpeningHours.tsx'

export function LocationCard({ location }: { location: LocationDto }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{location.name}</h2>
      <address className="mt-1 text-sm text-slate-600 not-italic">
        {location.address}
      </address>
      <h3 className="mt-5 text-sm font-semibold text-slate-900">Jam buka</h3>
      <div className="mt-2">
        <OpeningHours value={location.openingHours} />
      </div>
    </article>
  )
}
