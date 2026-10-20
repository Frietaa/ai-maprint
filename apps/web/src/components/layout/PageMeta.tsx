import { useEffect } from 'react'
import type { PageMetadata } from '../../config/seo.ts'
import { useBusinessIdentity } from '../../features/settings/use-public-settings.ts'

// Lightweight route-aware SEO for the SPA: sets document.title and the
// meta description. index.html carries static defaults for non-JS clients.
export function PageMeta({ title, description }: PageMetadata) {
  const { name } = useBusinessIdentity()
  const fullTitle = title ? `${title} | ${name}` : name

  useEffect(() => {
    document.title = fullTitle
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.append(meta)
    }
    meta.content = description
  }, [fullTitle, description])

  return null
}
