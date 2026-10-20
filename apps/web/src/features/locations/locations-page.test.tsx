import type { LocationDto } from '@maba-printing/shared'
import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'

const locations: LocationDto[] = [
  {
    id: 'l1',
    name: 'Lokasi Kampus',
    address: 'Jl. Contoh No. 1',
    openingHours: {
      weekly: {
        mon: [{ open: '08:00', close: '17:00' }],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: [],
      },
      note: null,
    },
  },
  {
    id: 'l2',
    name: 'Lokasi Kota',
    address: 'Jl. Contoh No. 2',
    openingHours: null,
  },
]

const list = (data: LocationDto[]) => ({
  body: { data, meta: { count: data.length } },
})

describe('/locations', () => {
  it('shows a loading state while locations load', () => {
    mockApi({ '/api/v1/locations': 'pending' })
    renderRoute('/locations')

    expect(screen.getByRole('status')).toHaveTextContent(
      'Memuat daftar lokasi…',
    )
  })

  it('lists locations with address and opening hours', async () => {
    mockApi({ '/api/v1/locations': list(locations) })
    renderRoute('/locations')

    const cards = await screen.findAllByRole('article')
    expect(cards).toHaveLength(2)
    expect(
      within(cards[0]).getByRole('heading', { name: 'Lokasi Kampus' }),
    ).toBeInTheDocument()
    expect(within(cards[0]).getByText('Jl. Contoh No. 1')).toBeInTheDocument()
    expect(within(cards[0]).getByText('08.00–17.00')).toBeInTheDocument()
    expect(
      within(cards[1]).getByText('Jam buka belum tersedia.'),
    ).toBeInTheDocument()
  })

  it('explains an empty list', async () => {
    mockApi({ '/api/v1/locations': list([]) })
    renderRoute('/locations')

    expect(
      await screen.findByText('Belum ada lokasi yang ditampilkan'),
    ).toBeInTheDocument()
  })

  it('shows a recoverable error and retries', async () => {
    mockApi({
      '/api/v1/locations': [
        { status: 500, body: { message: 'Internal server error' } },
        list(locations),
      ],
    })
    renderRoute('/locations')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Data belum dapat dimuat')
    expect(alert).not.toHaveTextContent('Internal server error')

    fireEvent.click(within(alert).getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findAllByRole('article')).toHaveLength(2)
  })

  it('uses connection-specific copy for network failures', async () => {
    mockApi({ '/api/v1/locations': 'network-error' })
    renderRoute('/locations')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tidak dapat terhubung',
    )
  })
})
