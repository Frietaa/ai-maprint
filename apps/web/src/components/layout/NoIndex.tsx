import { useEffect } from 'react'

// Private pages (account, Admin) are not meant for search engines (PRD
// §27): adds <meta name="robots" content="noindex, nofollow"> while
// mounted. public/robots.txt asks crawlers to skip the same paths.
export function NoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.append(meta)
    return () => meta.remove()
  }, [])
  return null
}
