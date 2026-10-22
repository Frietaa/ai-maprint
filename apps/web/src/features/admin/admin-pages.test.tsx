import type { AdminOrderDetailDto } from '@maba-printing/shared'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, TEST_CSRF_TOKEN } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'

const ID = 'MP-2026-7K92D4QX8M7RA'
const admin = {
  body: {
    data: { name: 'Admin Satu', email: 'a@example.test', role: 'ADMIN' },
  },
}

const summary = {
  publicId: ID,
  type: 'LAPTOP_SERVICE',
  status: 'SUBMITTED',
  customerName: 'Rina',
  location: null,
  requestedCompletionAt: null,
  estimatedTotal: null,
  finalTotal: null,
  paymentStatus: null,
  createdAt: '2026-10-21T01:00:00.000Z',
}

function detail(
  overrides: Partial<AdminOrderDetailDto> = {},
): AdminOrderDetailDto {
  return {
    ...(summary as AdminOrderDetailDto),
    customer: { name: 'Rina', whatsapp: '0812', email: null },
    member: null,
    description: null,
    location: null,
    items: [],
    laptopService: {
      complaint: 'Mati',
      handoverMethod: 'PICKUP',
      handoverAt: null,
      pickupAddress: 'Jl. Jemput 1',
      distanceKm: null,
      pickupFee: null,
    },
    softwareInstallation: null,
    adminNotes: null,
    payment: null,
    files: [
      {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb61',
        name: 'foto.png',
        mimeType: 'image/png',
        sizeBytes: 2048,
        createdAt: '2026-10-21T01:00:00.000Z',
        deletedAt: null,
      },
      {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb62',
        name: 'lama.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
        createdAt: '2026-10-21T01:00:00.000Z',
        deletedAt: '2026-11-21T01:00:00.000Z',
      },
    ],
    timeline: [
      {
        status: 'SUBMITTED',
        fromStatus: null,
        at: '2026-10-21T01:00:00.000Z',
        changedBy: null,
      },
    ],
    completedAt: null,
    updatedAt: '2026-10-21T01:00:00.000Z',
    allowedTransitions: ['CONFIRMED', 'CANCELLED'],
    ...overrides,
  }
}

describe('Admin dashboard', () => {
  it('shows open-status counts linking to the filtered queue', async () => {
    mockApi({
      '/api/v1/auth/me': admin,
      '/api/v1/admin/dashboard': {
        body: {
          data: {
            statusCounts: {
              SUBMITTED: 3,
              CONFIRMED: 1,
              IN_PROGRESS: 0,
              READY: 2,
              COMPLETED: 9,
              CANCELLED: 1,
            },
            pendingPaymentConfirmations: 4,
            recentOrders: [summary],
          },
        },
      },
    })
    renderRoute('/admin')
    const counts = await screen.findByRole('list', {
      name: 'Pesanan per status',
    })
    const submitted = within(counts).getByRole('link', {
      name: /Menunggu Konfirmasi\s*3/,
    })
    expect(submitted).toHaveAttribute('href', '/admin/orders?status=SUBMITTED')
    expect(
      within(counts).getByRole('link', { name: /Pembayaran perlu dicek\s*4/ }),
    ).toHaveAttribute(
      'href',
      '/admin/orders?paymentStatus=PENDING_CONFIRMATION',
    )
    expect(screen.getByRole('link', { name: ID })).toHaveAttribute(
      'href',
      `/admin/orders/${ID}`,
    )
  })
})

describe('Admin order queue', () => {
  it('sends filters and the exact public ID to the API', async () => {
    const api = mockApi({
      '/api/v1/auth/me': admin,
      '/api/v1/admin/orders': {
        body: {
          data: [summary],
          meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        },
      },
      '/api/v1/admin/locations': { body: { data: [], meta: { count: 0 } } },
    })
    const { router } = renderRoute('/admin/orders')
    expect(await screen.findByRole('link', { name: ID })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'READY' },
    })
    await waitFor(() =>
      expect(router.state.location.search).toBe('?status=READY'),
    )

    fireEvent.change(screen.getByLabelText('ID pesanan (persis)'), {
      target: { value: 'MP-2026-*' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }))
    expect(
      await screen.findByText('Format ID pesanan tidak valid.'),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('ID pesanan (persis)'), {
      target: { value: ID.toLowerCase() },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }))
    await waitFor(() => {
      const last = api.requestsTo('GET', '/api/v1/admin/orders').at(-1)
      expect(last?.url.searchParams.get('publicId')).toBe(ID)
      expect(last?.url.searchParams.get('status')).toBe('READY')
    })
  })
})

describe('Admin order detail', () => {
  it('offers only the allowed transitions and sends the expected current status', async () => {
    const api = mockApi({
      '/api/v1/auth/me': admin,
      [`/api/v1/admin/orders/${ID}`]: { body: { data: detail() } },
      [`PATCH /api/v1/admin/orders/${ID}/status`]: {
        body: {
          data: detail({
            status: 'CONFIRMED',
            allowedTransitions: ['IN_PROGRESS', 'CANCELLED'],
            updatedAt: '2026-10-21T02:00:00.000Z',
          }),
        },
      },
    })
    renderRoute(`/admin/orders/${ID}`)
    const status = await screen.findByRole('region', { name: 'Status' })
    expect(
      within(status)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toStrictEqual(['Ubah ke: Pesanan Diterima', 'Ubah ke: Dibatalkan'])

    fireEvent.click(
      within(status).getByRole('button', { name: 'Ubah ke: Pesanan Diterima' }),
    )
    expect(
      await screen.findByText('Status diubah ke Pesanan Diterima.'),
    ).toBeInTheDocument()
    const [patch] = api.requestsTo('PATCH', `/api/v1/admin/orders/${ID}/status`)
    expect(patch?.headers.get('X-CSRF-Token')).toBe(TEST_CSRF_TOKEN)
    expect(patch?.body).toStrictEqual({
      fromStatus: 'SUBMITTED',
      toStatus: 'CONFIRMED',
    })
    expect(
      within(screen.getByRole('region', { name: 'Status' })).getByRole(
        'button',
        {
          name: 'Ubah ke: Sedang Dikerjakan',
        },
      ),
    ).toBeInTheDocument()
  })

  it('explains a conflict with another Admin and reloads the order', async () => {
    const api = mockApi({
      '/api/v1/auth/me': admin,
      [`/api/v1/admin/orders/${ID}`]: [
        { body: { data: detail() } },
        {
          body: {
            data: detail({
              status: 'CANCELLED',
              allowedTransitions: [],
              updatedAt: '2026-10-21T03:00:00.000Z',
            }),
          },
        },
      ],
      [`PATCH /api/v1/admin/orders/${ID}/status`]: {
        status: 409,
        body: { message: 'Order status has changed' },
      },
    })
    renderRoute(`/admin/orders/${ID}`)
    const status = await screen.findByRole('region', { name: 'Status' })
    fireEvent.click(
      within(status).getByRole('button', { name: 'Ubah ke: Pesanan Diterima' }),
    )

    expect(
      await screen.findByText(
        'Pesanan sudah diubah oleh Admin lain. Data terbaru telah dimuat.',
      ),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Status akhir — tidak dapat diubah lagi.'),
    ).toBeInTheDocument()
    expect(api.requestsTo('GET', `/api/v1/admin/orders/${ID}`)).toHaveLength(2)
  })

  it('saves pricing with the computed pickup fee preview, payment and notes', async () => {
    const api = mockApi({
      '/api/v1/auth/me': admin,
      [`/api/v1/admin/orders/${ID}`]: { body: { data: detail() } },
      [`PATCH /api/v1/admin/orders/${ID}/pricing`]: {
        body: { data: detail() },
      },
      [`PATCH /api/v1/admin/orders/${ID}/payment`]: {
        body: { data: detail() },
      },
      [`PATCH /api/v1/admin/orders/${ID}/notes`]: { body: { data: detail() } },
    })
    renderRoute(`/admin/orders/${ID}`)

    const pricing = await screen.findByRole('region', { name: 'Harga' })
    fireEvent.change(within(pricing).getByLabelText('Total akhir (Rp)'), {
      target: { value: '75000' },
    })
    fireEvent.change(within(pricing).getByLabelText(/Jarak penjemputan/), {
      target: { value: '7,5' },
    })
    expect(within(pricing).getByText(/Biaya:/)).toHaveTextContent(/6\.000/)
    fireEvent.click(
      within(pricing).getByRole('button', { name: 'Simpan harga' }),
    )
    await waitFor(() =>
      expect(
        api.requestsTo('PATCH', `/api/v1/admin/orders/${ID}/pricing`)[0]?.body,
      ).toStrictEqual({
        estimatedTotal: null,
        finalTotal: 75000,
        distanceKm: 7.5,
      }),
    )

    const payment = screen.getByRole('region', { name: 'Pembayaran' })
    fireEvent.change(within(payment).getByLabelText('Metode'), {
      target: { value: 'QRIS_STATIC' },
    })
    fireEvent.change(within(payment).getByLabelText('Status'), {
      target: { value: 'PAID' },
    })
    fireEvent.change(within(payment).getByLabelText('Jumlah (Rp)'), {
      target: { value: '75000' },
    })
    fireEvent.click(
      within(payment).getByRole('button', { name: 'Simpan pembayaran' }),
    )
    await waitFor(() =>
      expect(
        api.requestsTo('PATCH', `/api/v1/admin/orders/${ID}/payment`)[0]?.body,
      ).toStrictEqual({
        method: 'QRIS_STATIC',
        status: 'PAID',
        amount: 75000,
      }),
    )

    const notes = screen.getByRole('region', {
      name: 'Catatan admin (internal)',
    })
    fireEvent.change(within(notes).getByLabelText('Catatan'), {
      target: { value: 'Hubungi sore' },
    })
    fireEvent.click(
      within(notes).getByRole('button', { name: 'Simpan catatan' }),
    )
    await waitFor(() =>
      expect(
        api.requestsTo('PATCH', `/api/v1/admin/orders/${ID}/notes`)[0]?.body,
      ).toStrictEqual({
        adminNotes: 'Hubungi sore',
      }),
    )
  })

  it('rejects malformed prices in the browser', async () => {
    const api = mockApi({
      '/api/v1/auth/me': admin,
      [`/api/v1/admin/orders/${ID}`]: { body: { data: detail() } },
    })
    renderRoute(`/admin/orders/${ID}`)
    const pricing = await screen.findByRole('region', { name: 'Harga' })
    fireEvent.change(within(pricing).getByLabelText('Total akhir (Rp)'), {
      target: { value: '75.000' },
    })
    fireEvent.click(
      within(pricing).getByRole('button', { name: 'Simpan harga' }),
    )
    expect(await within(pricing).findByRole('alert')).toHaveTextContent(
      /Rupiah bulat/,
    )
    expect(
      api.requestsTo('PATCH', `/api/v1/admin/orders/${ID}/pricing`),
    ).toHaveLength(0)
  })

  it('links downloads through the API and marks retained files as deleted', async () => {
    mockApi({
      '/api/v1/auth/me': admin,
      [`/api/v1/admin/orders/${ID}`]: { body: { data: detail() } },
    })
    renderRoute(`/admin/orders/${ID}`)
    const files = await screen.findByRole('region', {
      name: 'Dokumen pelanggan',
    })
    expect(
      within(files).getByRole('link', { name: 'Unduh foto.png' }),
    ).toHaveAttribute(
      'href',
      `/api/v1/admin/orders/${ID}/files/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb61/download`,
    )
    expect(
      within(files).queryByRole('link', { name: 'Unduh lama.pdf' }),
    ).toBeNull()
    expect(within(files).getByText(/Dihapus \(retensi\)/)).toBeInTheDocument()
  })
})

describe('Admin catalog pages', () => {
  const category = {
    id: 'c1',
    name: 'Alat Tulis',
    description: null,
    isActive: true,
  }

  it('edits a product with availability separate from active state', async () => {
    const product = {
      id: 'p1',
      name: 'Pulpen',
      description: null,
      price: 3000,
      availability: 'AVAILABLE',
      imageRef: null,
      isActive: true,
      category,
    }
    const api = mockApi({
      '/api/v1/auth/me': admin,
      '/api/v1/admin/products': {
        body: { data: [product], meta: { count: 1 } },
      },
      '/api/v1/admin/product-categories': {
        body: { data: [category], meta: { count: 1 } },
      },
      'PATCH /api/v1/admin/products/p1': { body: { data: product } },
    })
    renderRoute('/admin/products')
    fireEvent.click(await screen.findByRole('button', { name: 'Ubah Pulpen' }))
    const form = screen.getByRole('region', { name: 'Ubah produk: Pulpen' })
    await waitFor(() =>
      expect(within(form).getByLabelText('Kategori')).toHaveValue('c1'),
    )
    fireEvent.change(within(form).getByLabelText('Ketersediaan stok'), {
      target: { value: 'UNAVAILABLE' },
    })
    fireEvent.click(within(form).getByRole('button', { name: 'Simpan' }))
    await waitFor(() =>
      expect(
        api.requestsTo('PATCH', '/api/v1/admin/products/p1')[0]?.body,
      ).toStrictEqual({
        categoryId: 'c1',
        name: 'Pulpen',
        description: null,
        price: 3000,
        availability: 'UNAVAILABLE',
        imageRef: null,
        isActive: true,
      }),
    )
  })

  it('warns about name-based service grouping and requires a fixed price', async () => {
    const api = mockApi({
      '/api/v1/auth/me': admin,
      '/api/v1/admin/services': { body: { data: [], meta: { count: 0 } } },
      '/api/v1/admin/service-categories': {
        body: { data: [category], meta: { count: 1 } },
      },
    })
    renderRoute('/admin/services')
    expect(
      await screen.findByText(/mengelompokkan kategori berdasarkan namanya/),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tambah layanan' }))
    const form = screen.getByRole('region', { name: 'Layanan baru' })
    fireEvent.change(within(form).getByLabelText(/^Nama/), {
      target: { value: 'Cetak' },
    })
    fireEvent.click(within(form).getByRole('button', { name: 'Simpan' }))
    expect(await within(form).findByRole('alert')).toHaveTextContent(
      'Harga tetap wajib diisi.',
    )
    expect(api.requestsTo('POST', '/api/v1/admin/services')).toHaveLength(0)
  })

  it('creates a location with structured opening hours and toggles service availability', async () => {
    const location = {
      id: 'l1',
      name: 'Kampus',
      address: 'Jl. 1',
      openingHours: null,
      isActive: true,
      services: [{ serviceId: 's1', isAvailable: false }],
    }
    const service = {
      id: 's1',
      name: 'Jilid',
      description: null,
      priceType: 'FIXED',
      price: 5000,
      isActive: true,
      category,
    }
    const api = mockApi({
      '/api/v1/auth/me': admin,
      '/api/v1/admin/locations': {
        body: { data: [location], meta: { count: 1 } },
      },
      '/api/v1/admin/services': {
        body: { data: [service], meta: { count: 1 } },
      },
      'POST /api/v1/admin/locations': { status: 201, body: { data: location } },
      'PUT /api/v1/admin/locations/l1/services/s1': {
        body: { data: location },
      },
    })
    renderRoute('/admin/locations')

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Jilid' }))
    await waitFor(() =>
      expect(
        api.requestsTo('PUT', '/api/v1/admin/locations/l1/services/s1')[0]
          ?.body,
      ).toStrictEqual({
        isAvailable: true,
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Tambah lokasi' }))
    const form = screen.getByRole('region', { name: 'Lokasi baru' })
    fireEvent.change(within(form).getByLabelText(/^Nama/), {
      target: { value: 'Kota' },
    })
    fireEvent.change(within(form).getByLabelText(/^Alamat/), {
      target: { value: 'Jl. 2' },
    })
    fireEvent.click(
      within(form).getByRole('button', { name: 'Tambah jam Senin' }),
    )
    fireEvent.change(within(form).getByLabelText('Senin tutup 1'), {
      target: { value: '12:00' },
    })
    fireEvent.click(within(form).getByRole('button', { name: 'Simpan' }))
    await waitFor(() => {
      const body = api.requestsTo('POST', '/api/v1/admin/locations')[0]
        ?.body as {
        openingHours: { weekly: Record<string, unknown> }
      }
      expect(body.openingHours.weekly.mon).toStrictEqual([
        { open: '08:00', close: '12:00' },
      ])
      expect(body.openingHours.weekly.sun).toStrictEqual([])
    })
  })

  it('saves business settings and refreshes the public settings', async () => {
    const settings = {
      businessName: 'MABA',
      whatsappNumber: null,
      logoRef: null,
      // A legacy bare storage key: untouched, so it must not be re-sent.
      qrisImageRef: 'private/legacy-qris.png',
      socialLinks: { instagram: 'https://instagram.example/maba' },
      publicInfo: null,
      updatedAt: '2026-10-21T01:00:00.000Z',
    }
    const api = mockApi({
      '/api/v1/auth/me': admin,
      '/api/v1/admin/settings': { body: { data: settings } },
      'PATCH /api/v1/admin/settings': {
        body: {
          data: {
            ...settings,
            whatsappNumber: '0812-0000-0000',
            updatedAt: '2026-10-21T02:00:00.000Z',
          },
        },
      },
    })
    renderRoute('/admin/settings')
    fireEvent.change(await screen.findByLabelText(/^Nomor WhatsApp/), {
      target: { value: '0812-0000-0000' },
    })
    const publicCallsBefore = api.requestsTo(
      'GET',
      '/api/v1/public/settings',
    ).length
    fireEvent.click(screen.getByRole('button', { name: 'Simpan pengaturan' }))

    expect(
      await screen.findByText(
        'Pengaturan disimpan dan langsung tampil di situs.',
      ),
    ).toBeInTheDocument()
    expect(
      api.requestsTo('PATCH', '/api/v1/admin/settings')[0]?.body,
    ).toStrictEqual({ whatsappNumber: '0812-0000-0000' })
    await waitFor(() =>
      expect(
        api.requestsTo('GET', '/api/v1/public/settings').length,
      ).toBeGreaterThan(publicCallsBefore),
    )
  })
})
