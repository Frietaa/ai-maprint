import { Link } from 'react-router'
import {
  type BusinessLineIcon,
  businessLines,
} from '../../config/business-lines.ts'

const ICON_PATHS: Record<BusinessLineIcon, string> = {
  printer:
    'M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v6H7z',
  pencil: 'M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3',
  laptop: 'M5 6h14v9H5zM3 18h18',
  software: 'M8 9l-3 3 3 3M16 9l3 3-3 3M13 7l-2 10',
}

export function BusinessLineCards() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {businessLines.map((line) => (
        <li key={line.to}>
          <Link
            to={line.to}
            className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-600 hover:shadow-md motion-safe:duration-200"
          >
            <span
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-700"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={ICON_PATHS[line.icon]} />
              </svg>
            </span>
            <span className="mt-4 text-lg font-semibold text-slate-900">
              {line.title}
            </span>
            <span className="mt-1 text-sm text-slate-600">
              {line.description}
            </span>
            <span className="mt-4 text-sm font-medium text-brand-700 group-hover:underline">
              Lihat detail
              <span aria-hidden="true"> →</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
