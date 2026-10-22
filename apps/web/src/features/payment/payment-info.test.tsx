import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'

const PUBLIC_ID = 'MP-2026-7K92D4QX8M7RA'
const member = { name: 'Ana', email: 'ana@example.test', role: 'MEMBER' }

function settings(qrisImageRef: string | null) {
  return {
    body: {
      data: {
        businessName: 'MABA PRINTING',
        whatsappNumber: '0800-0000-0000',
        logoRef: null,
        qrisImageRef,
        socialLinks: [],
        publicInfo: null,
      },
    },
  }
}

function memberOrder(
  status: string,
  payment: { method: string; status: string; amount: number | null } | null,
) {
  return {
    body: {
      data: {
        publicId: PUBLIC_ID,
        type: 'PRINTING',
        status,
        createdAt: '2026-10-21T01:00:00.000Z',
        requestedCompletionAt: null,
        estimatedTotal: null,
        finalTotal: 15000,
        customer: { name: 'Ana', whatsapp: '0812', email: null },
        description: 'A4',
        location: null,
        items: [],
        laptopService: null,
        softwareInstallation: null,
        files: [],
        payment,
        timeline: [{ status: 'SUBMITTED', at: '2026-10-21T01:00:00.000Z' }],
      },
    },
  }
}

async function paymentRegion() {
  return screen.findByRole('region', { name: 'Pembayaran' })
}

describe('member order payment', () => {
  it('shows an unpaid order with the static QRIS and manual-confirmation notice', async () => {
    mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      '/api/v1/public/settings': settings('/brand/qris.png'),
      [`/api/v1/account/orders/${PUBLIC_ID}`]: memberOrder('CONFIRMED', null),
    })
    renderRoute(`/account/orders/${PUBLIC_ID}`)
    const region = await paymentRegion()

    expect(within(region).getByText('Status pembayaran')).toBeInTheDocument()
    expect(within(region).getByText('Belum dibayar')).toBeInTheDocument()
    const qris = await within(region).findByRole('img', {
      name: 'Kode QRIS MABA PRINTING untuk pembayaran',
    })
    expect(qris).toHaveAttribute('src', '/brand/qris.png')
    expect(region).toHaveTextContent(
      'Pembayaran dikonfirmasi secara manual oleh admin',
    )
    expect(region).toHaveTextContent('tidak berubah otomatis')
    expect(
      within(region).getByRole('link', {
        name: 'Kirim bukti pembayaran lewat WhatsApp',
      }),
    ).toHaveAttribute('href', expect.stringContaining(PUBLIC_ID))
  })

  it('shows the confirmed state without payment instructions', async () => {
    mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      '/api/v1/public/settings': settings('/brand/qris.png'),
      [`/api/v1/account/orders/${PUBLIC_ID}`]: memberOrder('COMPLETED', {
        method: 'QRIS_STATIC',
        status: 'PAID',
        amount: 15000,
      }),
    })
    renderRoute(`/account/orders/${PUBLIC_ID}`)
    const region = await paymentRegion()

    expect(within(region).getByText('Lunas')).toBeInTheDocument()
    expect(
      within(region).getByText('QRIS', { selector: 'dd' }),
    ).toBeInTheDocument()
    expect(within(region).getByText(/^Rp\s?15\.000$/)).toBeInTheDocument()
    expect(region).toHaveTextContent('sudah dikonfirmasi oleh admin')
    expect(within(region).queryByRole('img')).toBeNull()
  })

  it('labels a pending confirmation in text, not colour', async () => {
    mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      [`/api/v1/account/orders/${PUBLIC_ID}`]: memberOrder('READY', {
        method: 'CASH',
        status: 'PENDING_CONFIRMATION',
        amount: null,
      }),
    })
    renderRoute(`/account/orders/${PUBLIC_ID}`)
    const region = await paymentRegion()
    expect(within(region).getByText('Menunggu konfirmasi')).toBeInTheDocument()
    expect(
      within(region).getByText('Tunai', { selector: 'dd' }),
    ).toBeInTheDocument()
    expect(within(region).queryByText('Jumlah')).toBeNull()
    // No QRIS configured: guidance instead of an image.
    expect(region).toHaveTextContent('kode QRIS tersedia di lokasi')
  })

  it('shows no payment instructions for a cancelled order', async () => {
    mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      '/api/v1/public/settings': settings('/brand/qris.png'),
      [`/api/v1/account/orders/${PUBLIC_ID}`]: memberOrder('CANCELLED', null),
    })
    renderRoute(`/account/orders/${PUBLIC_ID}`)
    const region = await paymentRegion()
    expect(region).toHaveTextContent('tidak perlu melakukan pembayaran')
    expect(within(region).queryByRole('img')).toBeNull()
  })

  it('never renders an unsafe QRIS reference', async () => {
    mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      '/api/v1/public/settings': settings('javascript:alert(1)'),
      [`/api/v1/account/orders/${PUBLIC_ID}`]: memberOrder('SUBMITTED', null),
    })
    renderRoute(`/account/orders/${PUBLIC_ID}`)
    const region = await paymentRegion()
    expect(within(region).queryByRole('img')).toBeNull()
    expect(region).toHaveTextContent('kode QRIS tersedia di lokasi')
  })
})

describe('guest tracking payment information', () => {
  function tracked(status: string) {
    return {
      body: {
        data: {
          publicId: PUBLIC_ID,
          type: 'PRINTING',
          status,
          createdAt: '2026-10-21T01:00:00.000Z',
          requestedCompletionAt: null,
          location: null,
          timeline: [{ status, at: '2026-10-21T01:00:00.000Z' }],
        },
      },
    }
  }

  async function track() {
    fireEvent.change(await screen.findByLabelText('ID pesanan'), {
      target: { value: PUBLIC_ID },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lacak' }))
  }

  it('shows how to pay, never a payment state', async () => {
    mockApi({
      '/api/v1/public/settings': settings('https://cdn.example.test/qris.png'),
      [`/api/v1/orders/track/${PUBLIC_ID}`]: tracked('CONFIRMED'),
    })
    renderRoute('/track-order')
    await track()
    const region = await paymentRegion()
    expect(
      await within(region).findByRole('img', { name: /Kode QRIS/ }),
    ).toHaveAttribute('src', 'https://cdn.example.test/qris.png')
    expect(within(region).queryByText('Status pembayaran')).toBeNull()
    expect(region.textContent).not.toMatch(/Belum dibayar|Lunas/)
  })

  it('omits payment information for a cancelled order', async () => {
    mockApi({
      '/api/v1/public/settings': settings('/brand/qris.png'),
      [`/api/v1/orders/track/${PUBLIC_ID}`]: tracked('CANCELLED'),
    })
    renderRoute('/track-order')
    await track()
    await screen.findByRole('region', { name: PUBLIC_ID })
    expect(screen.queryByRole('region', { name: 'Pembayaran' })).toBeNull()
  })
})
