import type { ProductDto } from '@maba-printing/shared'
import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'

const writing = { id: 'c-write', name: 'Alat Tulis', description: null }
const paper = { id: 'c-paper', name: 'Kertas', description: 'Kertas HVS' }

const products: ProductDto[] = [
  {
    id: 'p-pen',
    name: 'Pulpen Hitam',
    description: null,
    price: 3000,
    availability: 'AVAILABLE',
    imageRef: 'https://cdn.example.test/pen.jpg',
    category: writing,
  },
  {
    id: 'p-pencil',
    name: 'Pensil 2B',
    description: null,
    price: 2500,
    availability: 'AVAILABLE',
    imageRef: 'dev/placeholder-pencil.png',
    category: writing,
  },
  {
    id: 'p-ream',
    name: 'Kertas A4 1 Rim',
    description: '70 gsm',
    price: 55000,
    availability: 'UNAVAILABLE',
    imageRef: null,
    category: paper,
  },
]

const list = (data: ProductDto[]) => ({
  body: { data, meta: { count: data.length } },
})

const text = (element: HTMLElement) =>
  (element.textContent ?? '').replace(/\s/g, ' ')

function card(name: string): HTMLElement {
  const article = screen.getByRole('heading', { name }).closest('article')
  if (!article) throw new Error(`no card for ${name}`)
  return article
}

describe('/atk', () => {
  it('lists products by category with Rupiah prices', async () => {
    mockApi({ '/api/v1/products': list(products) })
    renderRoute('/atk')

    expect(
      await screen.findByRole('region', { name: 'Alat Tulis' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Kertas' })).toBeInTheDocument()
    expect(text(card('Pulpen Hitam'))).toContain('Rp 3.000')
    expect(text(card('Kertas A4 1 Rim'))).toContain('Rp 55.000')
  })

  it('keeps unavailable products visible with a text label', async () => {
    mockApi({ '/api/v1/products': list(products) })
    renderRoute('/atk')

    await screen.findByRole('region', { name: 'Kertas' })
    expect(card('Kertas A4 1 Rim')).toHaveTextContent('Stok sedang kosong')
    expect(card('Pulpen Hitam')).toHaveTextContent('Tersedia')
  })

  it('shows only safe images and a placeholder otherwise', async () => {
    mockApi({ '/api/v1/products': list(products) })
    renderRoute('/atk')

    await screen.findByRole('region', { name: 'Alat Tulis' })
    expect(
      within(card('Pulpen Hitam')).getByRole('img', { name: 'Pulpen Hitam' }),
    ).toHaveAttribute('src', 'https://cdn.example.test/pen.jpg')
    // Bare storage key and null: decorative placeholder, no <img>.
    expect(within(card('Pensil 2B')).queryByRole('img')).not.toBeInTheDocument()
    expect(
      within(card('Kertas A4 1 Rim')).queryByRole('img'),
    ).not.toBeInTheDocument()
  })

  it('filters by category with a toggle group', async () => {
    mockApi({ '/api/v1/products': list(products) })
    renderRoute('/atk')

    const group = await screen.findByRole('group', { name: 'Filter kategori' })
    const paperButton = within(group).getByRole('button', { name: 'Kertas' })
    fireEvent.click(paperButton)

    expect(paperButton).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.queryByRole('region', { name: 'Alat Tulis' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Kertas' })).toBeInTheDocument()

    fireEvent.click(
      within(group).getByRole('button', { name: 'Semua kategori' }),
    )
    expect(
      screen.getByRole('region', { name: 'Alat Tulis' }),
    ).toBeInTheDocument()
  })

  it('handles loading, empty and error states', async () => {
    mockApi({ '/api/v1/products': 'pending' })
    let view = renderRoute('/atk')
    expect(
      screen
        .getAllByRole('status')
        .some((status) => status.textContent?.includes('Memuat katalog ATK…')),
    ).toBe(true)
    view.unmount()

    mockApi({ '/api/v1/products': list([]) })
    view = renderRoute('/atk')
    expect(
      await screen.findByText('Belum ada produk ATK yang ditampilkan'),
    ).toBeInTheDocument()
    view.unmount()

    mockApi({ '/api/v1/products': 'network-error' })
    renderRoute('/atk')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tidak dapat terhubung',
    )
  })
})
