import type { LocationDto, ProductDto, ServiceDto } from '@maba-printing/shared'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { pageMeta } from '../config/seo.ts'
import { mockApi } from '../test/api-mock.ts'
import { renderRoute } from '../test/render-route.tsx'

const category = { id: 'c1', name: 'Printing', description: null }
const service: ServiceDto = {
  id: 's1',
  name: 'Print A4',
  description: null,
  priceType: 'FIXED',
  price: 500,
  category,
  availableLocationIds: ['l1'],
}
const product: ProductDto = {
  id: 'p1',
  name: 'Pulpen',
  description: null,
  price: 3000,
  availability: 'UNAVAILABLE',
  imageRef: null,
  category: { id: 'c2', name: 'Alat Tulis', description: null },
}
const location: LocationDto = {
  id: 'l1',
  name: 'Lokasi A',
  address: 'Jl. A',
  openingHours: null,
}
const list = <T,>(data: T[]) => ({ body: { data, meta: { count: 1 } } })

function withCatalogData() {
  mockApi({
    '/api/v1/services': list([service]),
    '/api/v1/products': list([product]),
    '/api/v1/locations': list([location]),
  })
}

function metaDescription(): string | null {
  return (
    document
      .querySelector('meta[name="description"]')
      ?.getAttribute('content') ?? null
  )
}

const routes = [
  ['/', pageMeta.home, 'MABA PRINTING'],
  ['/printing', pageMeta.printing, 'Printing | MABA PRINTING'],
  ['/atk', pageMeta.atk, 'ATK | MABA PRINTING'],
  ['/laptop-service', pageMeta.laptopService, 'Service Laptop | MABA PRINTING'],
  [
    '/software-installation',
    pageMeta.softwareInstallation,
    'Instalasi Software | MABA PRINTING',
  ],
  ['/locations', pageMeta.locations, 'Lokasi | MABA PRINTING'],
  [
    '/halaman-lain',
    pageMeta.notFound,
    'Halaman tidak ditemukan | MABA PRINTING',
  ],
] as const

describe('route metadata', () => {
  it.each(routes)(
    '%s sets its title and description',
    async (path, meta, title) => {
      renderRoute(path)

      await waitFor(() => {
        expect(document.title).toBe(title)
      })
      expect(metaDescription()).toBe(meta.description)
    },
  )

  it('uses the configured business name in titles', async () => {
    mockApi({
      '/api/v1/public/settings': {
        body: {
          data: {
            businessName: 'Cetak Kampus',
            whatsappNumber: null,
            logoRef: null,
            qrisImageRef: null,
            socialLinks: [],
            publicInfo: null,
          },
        },
      },
    })
    renderRoute('/atk')

    await waitFor(() => {
      expect(document.title).toBe('ATK | Cetak Kampus')
    })
  })
})

describe('page structure', () => {
  it.each(routes.map(([path]) => path))(
    '%s has one h1 and no skipped heading levels',
    async (path) => {
      withCatalogData()
      renderRoute(path)
      // Let data-backed sections render their headings.
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      const main = screen.getByRole('main')
      const levels = within(main)
        .getAllByRole('heading')
        .map((heading) => Number(heading.tagName.slice(1)))

      expect(levels.filter((level) => level === 1)).toHaveLength(1)
      expect(levels[0]).toBe(1)
      levels.slice(1).forEach((level, index) => {
        expect(level - (levels[index] ?? 1)).toBeLessThanOrEqual(1)
      })
    },
  )

  it('moves focus to the main content after navigation', () => {
    renderRoute('/')
    const nav = screen.getByRole('navigation', { name: 'Navigasi utama' })

    fireEvent.click(within(nav).getByRole('button', { name: 'Layanan' }))
    fireEvent.click(within(nav).getByRole('link', { name: /^Printing/ }))

    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('offers a skip link to the main content', () => {
    renderRoute('/')
    expect(
      screen.getByRole('link', { name: 'Langsung ke konten utama' }),
    ).toHaveAttribute('href', '#konten-utama')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'konten-utama')
  })
})

describe('indexing of private pages (PRD §27)', () => {
  const robots = () =>
    document.head.querySelector('meta[name="robots"]')?.getAttribute('content')

  it('marks Admin and member pages noindex, public pages not', async () => {
    mockApi({
      '/api/v1/auth/me': {
        body: { data: { name: 'Ana', email: 'a@x.test', role: 'MEMBER' } },
      },
    })
    const account = renderRoute('/account')
    await waitFor(() => expect(robots()).toBe('noindex, nofollow'))
    account.unmount()
    expect(robots()).toBeUndefined()

    const admin = renderRoute('/admin/login')
    await waitFor(() => expect(robots()).toBe('noindex, nofollow'))
    admin.unmount()

    renderRoute('/')
    await screen.findByRole('main')
    expect(robots()).toBeUndefined()
  })
})
