import type { PublicSettingsDto } from '@maba-printing/shared'
import { Link } from 'react-router'
import { primaryNavigation } from '../../config/navigation.ts'

interface FooterProps {
  businessName: string
  settings: PublicSettingsDto | null
}

export function Footer({ businessName, settings }: FooterProps) {
  const whatsapp = settings?.whatsappNumber ?? null
  const socialLinks = settings?.socialLinks ?? []

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-base font-semibold text-slate-900">
            {businessName}
          </p>
          <p className="mt-2 max-w-sm text-sm text-slate-600">
            Layanan cetak dokumen, ATK, service laptop, dan instalasi software
            untuk mahasiswa dan umum.
          </p>
        </div>

        <nav aria-label="Navigasi footer">
          <h2 className="text-sm font-semibold text-slate-900">Halaman</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {primaryNavigation.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="inline-block rounded py-1 text-slate-600 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {whatsapp || socialLinks.length > 0 ? (
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Kontak</h2>
            <dl className="mt-3 space-y-2 text-sm text-slate-600">
              {whatsapp ? (
                <div>
                  <dt className="font-medium text-slate-700">WhatsApp</dt>
                  <dd>{whatsapp}</dd>
                </div>
              ) : null}
              {socialLinks.length > 0 ? (
                <div>
                  <dt className="font-medium text-slate-700">Media sosial</dt>
                  <dd>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {socialLinks.map((link) => (
                        <li key={link.platform}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block py-1 capitalize hover:text-brand-700"
                          >
                            {link.platform}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {businessName}
      </div>
    </footer>
  )
}
