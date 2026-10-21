import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'

const PUBLIC_ID = 'MP-2026-7K92D4QX8M7RA'
const member = { name: 'Ana', email: 'ana@example.test', role: 'MEMBER' }

const tracked = {
  body: {
    data: {
      publicId: PUBLIC_ID,
      type: 'PRINTING',
      status: 'SUBMITTED',
      createdAt: '2026-10-21T01:00:00.000Z',
      requestedCompletionAt: '2026-10-23T03:00:00.000Z',
      location: { name: 'Lokasi Kampus' },
      timeline: [{ status: 'SUBMITTED', at: '2026-10-21T01:00:00.000Z' }],
    },
  },
}

describe('/track-order', () => {
  it('looks up only after an explicit submit and shows the safe status', async () => {
    const api = mockApi({ [`/api/v1/orders/track/${PUBLIC_ID}`]: tracked })
    renderRoute('/track-order')
    const input = await screen.findByLabelText('ID pesanan')

    fireEvent.change(input, {
      target: { value: `  ${PUBLIC_ID.toLowerCase()} ` },
    })
    expect(
      api.requests.filter((r) => r.url.pathname.startsWith('/api/v1/orders')),
    ).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Lacak' }))
    const result = await screen.findByRole('region', { name: PUBLIC_ID })
    expect(
      within(result).getAllByText('Menunggu Konfirmasi').length,
    ).toBeGreaterThan(0)
    expect(within(result).getByText('Printing')).toBeInTheDocument()
    expect(within(result).getByText('Lokasi Kampus')).toBeInTheDocument()
    expect(
      within(result).getByRole('list', { name: 'Riwayat status' }),
    ).toBeInTheDocument()
    expect(result.textContent).not.toMatch(/SUBMITTED|PRINTING/)
    // No session is needed: no CSRF token was fetched.
    expect(api.requestsTo('GET', '/api/v1/auth/csrf')).toHaveLength(0)
  })

  it('rejects a malformed ID without calling the API', async () => {
    const api = mockApi()
    renderRoute('/track-order')
    fireEvent.change(await screen.findByLabelText('ID pesanan'), {
      target: { value: 'MP-2026-*' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lacak' }))
    expect(
      await screen.findByText(/Masukkan ID pesanan seperti/),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('ID pesanan')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(
      api.requests.filter((r) => r.url.pathname.startsWith('/api/v1/orders')),
    ).toHaveLength(0)
  })

  it.each([
    [404, 'Pesanan tidak ditemukan'],
    [429, 'Terlalu banyak pencarian'],
  ])('explains a %i response', async (status, message) => {
    mockApi({
      [`/api/v1/orders/track/${PUBLIC_ID}`]: { status, body: { message: 'x' } },
    })
    renderRoute('/track-order')
    fireEvent.change(await screen.findByLabelText('ID pesanan'), {
      target: { value: PUBLIC_ID },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lacak' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
  })
})

describe('/account/orders', () => {
  it('redirects signed-out visitors to login', async () => {
    const { router } = renderRoute('/account/orders')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?redirect=%2Faccount%2Forders')
  })

  it('lists the member’s orders with pagination', async () => {
    const summary = (n: number) => ({
      publicId: `MP-2026-7K92D4QX8M7R${String.fromCharCode(64 + n)}`,
      type: 'ATK',
      status: 'SUBMITTED',
      createdAt: '2026-10-21T01:00:00.000Z',
      requestedCompletionAt: null,
      estimatedTotal: 6000,
      finalTotal: null,
    })
    const api = mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      '/api/v1/account/orders': [
        {
          body: {
            data: [summary(1), summary(2)],
            meta: { page: 1, pageSize: 10, total: 12, totalPages: 2 },
          },
        },
        {
          body: {
            data: [summary(3)],
            meta: { page: 2, pageSize: 10, total: 12, totalPages: 2 },
          },
        },
      ],
    })
    renderRoute('/account/orders')

    const first = await screen.findByRole('link', {
      name: /MP-2026-7K92D4QX8M7RA/,
    })
    expect(first).toHaveAttribute(
      'href',
      '/account/orders/MP-2026-7K92D4QX8M7RA',
    )
    expect(first).toHaveTextContent(/ATK · diajukan .* · perkiraan Rp\s6\.000/)
    expect(screen.getByText('Halaman 1 dari 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }))
    expect(await screen.findByText('Halaman 2 dari 2')).toBeInTheDocument()
    expect(
      api
        .requestsTo('GET', '/api/v1/account/orders')
        .map((r) => r.url.searchParams.get('page')),
    ).toStrictEqual(['1', '2'])
  })

  it('shows an empty state', async () => {
    mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      '/api/v1/account/orders': {
        body: {
          data: [],
          meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        },
      },
    })
    renderRoute('/account/orders')
    expect(await screen.findByText('Belum ada pesanan')).toBeInTheDocument()
  })
})

describe('/account/orders/:publicId', () => {
  it('shows the own order as submitted, without download links', async () => {
    mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      [`/api/v1/account/orders/${PUBLIC_ID}`]: {
        body: {
          data: {
            publicId: PUBLIC_ID,
            type: 'LAPTOP_SERVICE',
            status: 'SUBMITTED',
            createdAt: '2026-10-21T01:00:00.000Z',
            requestedCompletionAt: null,
            estimatedTotal: null,
            finalTotal: null,
            customer: { name: 'Ana Pesanan', whatsapp: '0812', email: null },
            description: null,
            location: null,
            items: [],
            laptopService: {
              complaint: 'Mati total',
              handoverMethod: 'PICKUP',
              handoverAt: null,
              pickupAddress: 'Jl. Melati 5',
              distanceKm: null,
              pickupFee: null,
            },
            softwareInstallation: null,
            files: [
              { name: 'foto.png', mimeType: 'image/png', sizeBytes: 2048 },
            ],
            timeline: [{ status: 'SUBMITTED', at: '2026-10-21T01:00:00.000Z' }],
          },
        },
      },
    })
    renderRoute(`/account/orders/${PUBLIC_ID}`)

    expect(
      await screen.findByRole('heading', { level: 1, name: PUBLIC_ID }),
    ).toBeInTheDocument()
    expect(screen.getByText('Ana Pesanan')).toBeInTheDocument()
    expect(screen.getByText('Mati total')).toBeInTheDocument()
    expect(screen.getByText('Dijemput')).toBeInTheDocument()
    expect(screen.getByText('Belum dikonfirmasi')).toBeInTheDocument()
    expect(screen.getByText(/foto\.png/)).toBeInTheDocument()
    expect(screen.queryByText(/Jarak|Biaya penjemputan/)).toBeNull()
    expect(screen.queryByRole('link', { name: /unduh|download/i })).toBeNull()
  })

  it('treats a foreign or missing order as not found', async () => {
    mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      [`/api/v1/account/orders/${PUBLIC_ID}`]: {
        status: 404,
        body: { message: 'Order not found' },
      },
    })
    renderRoute(`/account/orders/${PUBLIC_ID}`)
    expect(
      await screen.findByRole('heading', { name: 'Pesanan tidak ditemukan' }),
    ).toBeInTheDocument()
  })
})
