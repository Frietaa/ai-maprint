import type { LocationDto, ServiceDto } from '@maba-printing/shared'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'

const printing = {
  id: 'c-print',
  name: 'Printing',
  description: 'Cetak dokumen',
}
const laptop = { id: 'c-laptop', name: 'Laptop Service', description: null }

const services: ServiceDto[] = [
  {
    id: 's-laptop',
    name: 'Diagnosa Laptop',
    description: null,
    priceType: 'REQUIRES_CONFIRMATION',
    price: null,
    category: laptop,
    availableLocationIds: ['l1'],
  },
  {
    id: 's-bw',
    name: 'Print A4 Hitam Putih',
    description: 'Per halaman',
    priceType: 'FIXED',
    price: 500,
    category: printing,
    availableLocationIds: ['l1', 'l2'],
  },
  {
    id: 's-bind',
    name: 'Jilid',
    description: null,
    priceType: 'REQUIRES_CONFIRMATION',
    price: 5000,
    category: printing,
    availableLocationIds: [],
  },
]

const locations: LocationDto[] = [
  { id: 'l1', name: 'Lokasi Kampus', address: 'A', openingHours: null },
  { id: 'l2', name: 'Lokasi Kota', address: 'B', openingHours: null },
]

const list = <T,>(data: T[]) => ({
  body: { data, meta: { count: data.length } },
})

const text = (element: HTMLElement) =>
  (element.textContent ?? '').replace(/\s/g, ' ')

describe('service line pages', () => {
  it('/printing shows only printing categories with formatted prices', async () => {
    mockApi({
      '/api/v1/services': list(services),
      '/api/v1/locations': list(locations),
    })
    renderRoute('/printing')

    const group = await screen.findByRole('region', { name: 'Printing' })
    const cards = within(group).getAllByRole('article')
    expect(cards).toHaveLength(2)
    expect(text(cards[0])).toContain('Rp 500')
    expect(text(cards[1])).toContain('Mulai Rp 5.000')
    expect(text(cards[1])).toContain('Harga akhir dikonfirmasi')
    expect(screen.queryByText('Diagnosa Laptop')).not.toBeInTheDocument()

    // Location names come from the locations API.
    expect(
      await within(cards[0]).findByText(
        'Tersedia di: Lokasi Kampus, Lokasi Kota',
      ),
    ).toBeInTheDocument()
    expect(
      within(cards[1]).getByText('Saat ini belum tersedia di lokasi kami.'),
    ).toBeInTheDocument()
  })

  it('/laptop-service renders "Konfirmasi harga" for unpriced services', async () => {
    mockApi({ '/api/v1/services': list(services) })
    renderRoute('/laptop-service')

    const card = await screen.findByRole('article')
    expect(card).toHaveTextContent('Diagnosa Laptop')
    expect(card).toHaveTextContent('Konfirmasi harga')
    expect(card).not.toHaveTextContent(/null|NaN|REQUIRES_CONFIRMATION/)
  })

  it('/software-installation states the legal-software policy and falls back to the full catalog', async () => {
    mockApi({ '/api/v1/services': list(services) })
    renderRoute('/software-installation')

    expect(
      screen.getByRole('heading', { name: 'Hanya software legal' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText(
        'Menampilkan seluruh layanan kami yang tersedia.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('filters by location through the API', async () => {
    const { calls } = mockApi({
      '/api/v1/services': [list(services), list([services[1]])],
      '/api/v1/locations': list(locations),
    })
    renderRoute('/printing')

    const select = await screen.findByLabelText('Tampilkan layanan di lokasi')
    fireEvent.change(select, { target: { value: 'l2' } })

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1)
    })
    expect(
      calls.some(
        (url) =>
          url.pathname === '/api/v1/services' &&
          url.searchParams.get('locationId') === 'l2',
      ),
    ).toBe(true)
  })

  it('shows empty and error states', async () => {
    mockApi({ '/api/v1/services': list([]) })
    const view = renderRoute('/printing')
    expect(
      await screen.findByText('Belum ada layanan yang ditampilkan'),
    ).toBeInTheDocument()
    view.unmount()

    mockApi({ '/api/v1/services': { status: 500, body: {} } })
    renderRoute('/printing')
    expect(await screen.findByRole('alert')).toHaveTextContent('Coba lagi')
  })
})
