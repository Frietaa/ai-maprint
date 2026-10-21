import type { ProductDto } from '@maba-printing/shared'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { nowAsWibInput, wibInputToIso } from '../../lib/format-datetime.ts'
import { mockApi, TEST_CSRF_TOKEN } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'

const PUBLIC_ID = 'MP-2026-7K92D4QX8M7RA'
// About a month ahead, as a WIB datetime-local value.
const FUTURE = nowAsWibInput(new Date(Date.now() + 30 * 86_400_000))
const FUTURE_ISO = wibInputToIso(FUTURE)

function receipt(type: string, estimatedTotal: number | null = null) {
  return {
    status: 201,
    body: {
      data: {
        publicId: PUBLIC_ID,
        type,
        status: 'SUBMITTED',
        createdAt: '2026-10-21T01:00:00.000Z',
        requestedCompletionAt: FUTURE_ISO,
        estimatedTotal,
      },
    },
  }
}

const settings = {
  body: {
    data: {
      businessName: 'MABA PRINTING',
      whatsappNumber: '0800-0000-0000',
      logoRef: null,
      socialLinks: [],
      publicInfo: null,
    },
  },
}

function form(id: string): HTMLElement {
  const region = document.getElementById(id)
  if (!region) throw new Error(`no form ${id}`)
  return region
}

function fill(scope: HTMLElement, label: RegExp | string, value: string) {
  fireEvent.change(within(scope).getByLabelText(label), { target: { value } })
}

function fillCustomer(scope: HTMLElement) {
  fill(scope, /^Nama$/, 'Rina')
  fill(scope, /^Nomor WhatsApp/, '0812-3456-7890')
}

describe('Printing order form', () => {
  it('submits documents as multipart with the CSRF token and shows the receipt', async () => {
    const api = mockApi({
      '/api/v1/public/settings': settings,
      'POST /api/v1/orders': receipt('PRINTING'),
    })
    renderRoute('/printing')
    const scope = await waitFor(() => form('pesan-printing'))

    fillCustomer(scope)
    fill(scope, /^Tenggat yang diinginkan/, FUTURE)
    const file = new File(['%PDF-1.4'], 'Tugas.pdf', {
      type: 'application/pdf',
    })
    fireEvent.change(within(scope).getByLabelText(/^File dokumen/), {
      target: { files: [file] },
    })
    expect(
      within(scope).getByRole('list', { name: 'File terpilih' }),
    ).toHaveTextContent('Tugas.pdf')
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )

    const heading = await screen.findByRole('heading', {
      name: 'Permintaan berhasil dikirim',
    })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(screen.getByText(PUBLIC_ID)).toBeInTheDocument()
    expect(screen.getByText('Menunggu Konfirmasi')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Salin ID pesanan' }),
    ).toBeEnabled()

    const whatsapp = screen.getByRole('link', {
      name: 'Diskusikan lewat WhatsApp',
    })
    expect(whatsapp).toHaveAttribute(
      'href',
      `https://wa.me/6280000000000?text=${encodeURIComponent(
        `Halo MABA PRINTING, saya ingin membahas pesanan ${PUBLIC_ID}.`,
      )}`,
    )
    expect(screen.getByRole('link', { name: 'Lacak pesanan' })).toHaveAttribute(
      'href',
      '/track-order',
    )

    const [post] = api.requestsTo('POST', '/api/v1/orders')
    expect(post?.headers.get('X-CSRF-Token')).toBe(TEST_CSRF_TOKEN)
    expect(post?.headers.get('Content-Type')).toBeNull()
    expect(post?.credentials).toBe('include')
    expect(post?.form?.files).toStrictEqual(['Tugas.pdf'])
    const payload = JSON.parse(post?.form?.payload?.[0] ?? '{}') as Record<
      string,
      unknown
    >
    expect(payload).toStrictEqual({
      type: 'PRINTING',
      customerName: 'Rina',
      customerWhatsapp: '0812-3456-7890',
      customerEmail: null,
      locationId: null,
      requestedCompletionAt: FUTURE_ISO,
      description: null,
    })
  })

  it('sends JSON when there are no files, and requires a description then', async () => {
    const api = mockApi({ 'POST /api/v1/orders': receipt('PRINTING') })
    renderRoute('/printing')
    const scope = await waitFor(() => form('pesan-printing'))
    fillCustomer(scope)
    fill(scope, /^Tenggat yang diinginkan/, FUTURE)

    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )
    expect(await within(scope).findByRole('alert')).toHaveTextContent(
      'Unggah file atau tuliskan kebutuhan cetak Anda.',
    )
    expect(api.requestsTo('POST', '/api/v1/orders')).toHaveLength(0)

    fill(scope, /^Kebutuhan cetak/, 'A4, 10 halaman')
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )
    await screen.findByRole('heading', { name: 'Permintaan berhasil dikirim' })
    const [post] = api.requestsTo('POST', '/api/v1/orders')
    expect(post?.headers.get('Content-Type')).toBe('application/json')
    expect(post?.body).toMatchObject({ description: 'A4, 10 halaman' })
    // No WhatsApp number configured: no WhatsApp link.
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).toBeNull()
  })

  it('validates contact data, the deadline and files before sending', async () => {
    const api = mockApi()
    renderRoute('/printing')
    const scope = await waitFor(() => form('pesan-printing'))
    fireEvent.change(within(scope).getByLabelText(/^File dokumen/), {
      target: { files: [new File(['x'], 'virus.exe')] },
    })
    expect(within(scope).getByText(/tidak didukung/)).toBeInTheDocument()

    fill(scope, /^Tenggat yang diinginkan/, '2020-01-01T10:00')
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )
    expect(
      await within(scope).findByText('Nama wajib diisi.'),
    ).toBeInTheDocument()
    expect(
      within(scope).getByText('Nomor WhatsApp wajib diisi.'),
    ).toBeInTheDocument()
    expect(
      within(scope).getByText('Pilih waktu yang belum lewat.'),
    ).toBeInTheDocument()
    expect(api.requestsTo('POST', '/api/v1/orders')).toHaveLength(0)
  })

  it.each([
    [415, 'Jenis file tidak didukung'],
    [413, 'Ukuran file terlalu besar'],
    [429, 'Terlalu banyak permintaan'],
  ])('explains a %i response in Indonesian', async (status, message) => {
    mockApi({ 'POST /api/v1/orders': { status, body: { message: 'x' } } })
    renderRoute('/printing')
    const scope = await waitFor(() => form('pesan-printing'))
    fillCustomer(scope)
    fill(scope, /^Tenggat yang diinginkan/, FUTURE)
    fill(scope, /^Kebutuhan cetak/, 'Cetak')
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )
    expect(await within(scope).findByRole('alert')).toHaveTextContent(message)
  })

  it('prevents a second submission while sending', async () => {
    const api = mockApi({ 'POST /api/v1/orders': 'pending' })
    renderRoute('/printing')
    const scope = await waitFor(() => form('pesan-printing'))
    fillCustomer(scope)
    fill(scope, /^Tenggat yang diinginkan/, FUTURE)
    fill(scope, /^Kebutuhan cetak/, 'Cetak')
    const button = within(scope).getByRole('button', {
      name: 'Kirim permintaan',
    })
    fireEvent.click(button)
    const sending = await within(scope).findByRole('button', {
      name: 'Mengirim…',
    })
    expect(sending).toBeDisabled()
    fireEvent.click(sending)
    fireEvent.submit(sending.closest('form') as HTMLFormElement)
    await waitFor(() =>
      expect(api.requestsTo('POST', '/api/v1/orders')).toHaveLength(1),
    )
  })

  it('prefills a member snapshot without changing the profile', async () => {
    const api = mockApi({
      '/api/v1/auth/me': {
        body: {
          data: { name: 'Ana', email: 'ana@example.test', role: 'MEMBER' },
        },
      },
      '/api/v1/account/profile': {
        body: {
          data: {
            name: 'Ana Profil',
            email: 'ana@example.test',
            whatsapp: '0811-1111-1111',
            signInMethods: { password: true, google: false },
          },
        },
      },
      'POST /api/v1/orders': receipt('PRINTING'),
    })
    renderRoute('/printing')
    const scope = await waitFor(() => form('pesan-printing'))
    await waitFor(() =>
      expect(within(scope).getByLabelText(/^Nama$/)).toHaveValue('Ana Profil'),
    )
    expect(within(scope).getByLabelText(/^Nomor WhatsApp/)).toHaveValue(
      '0811-1111-1111',
    )
    expect(within(scope).getByLabelText(/^Email/)).toHaveValue(
      'ana@example.test',
    )

    fill(scope, /^Nama$/, 'Ana Untuk Pesanan')
    fill(scope, /^Tenggat yang diinginkan/, FUTURE)
    fill(scope, /^Kebutuhan cetak/, 'Cetak')
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )
    await screen.findByRole('heading', { name: 'Permintaan berhasil dikirim' })

    expect(api.requestsTo('POST', '/api/v1/orders')[0]?.body).toMatchObject({
      customerName: 'Ana Untuk Pesanan',
    })
    expect(api.requestsTo('PATCH', '/api/v1/account/profile')).toHaveLength(0)
  })
})

describe('ATK order form', () => {
  const products: ProductDto[] = [
    {
      id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb61',
      name: 'Pulpen',
      description: null,
      price: 3000,
      availability: 'AVAILABLE',
      imageRef: null,
      category: { id: 'c1', name: 'Alat Tulis', description: null },
    },
    {
      id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb62',
      name: 'Kertas A4',
      description: null,
      price: 55000,
      availability: 'UNAVAILABLE',
      imageRef: null,
      category: { id: 'c1', name: 'Alat Tulis', description: null },
    },
  ]

  it('orders available products with quantities and an estimate', async () => {
    const api = mockApi({
      '/api/v1/products': { body: { data: products, meta: { count: 2 } } },
      'POST /api/v1/orders': receipt('ATK', 6000),
    })
    renderRoute('/atk')
    const scope = await waitFor(() => form('pesan-atk'))

    const quantity = await within(scope).findByLabelText(/Pulpen/)
    // Unavailable products are listed but cannot be chosen.
    expect(within(scope).queryByLabelText(/Kertas A4/)).toBeNull()
    expect(
      within(scope).getByText(/stok kosong\): Kertas A4/),
    ).toBeInTheDocument()

    fireEvent.change(quantity, { target: { value: '2' } })
    expect(within(scope).getByText(/Perkiraan total:/)).toHaveTextContent(
      /6\.000/,
    )
    fillCustomer(scope)
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )

    await screen.findByRole('heading', { name: 'Permintaan berhasil dikirim' })
    expect(
      screen.getByText(/Perkiraan total/).nextElementSibling,
    ).toHaveTextContent(/6\.000/)
    expect(api.requestsTo('POST', '/api/v1/orders')[0]?.body).toMatchObject({
      type: 'ATK',
      requestedCompletionAt: null,
      items: [{ productId: products[0]?.id, quantity: 2 }],
    })
  })

  it('needs at least one product and explains a 409', async () => {
    mockApi({
      '/api/v1/products': { body: { data: products, meta: { count: 2 } } },
      'POST /api/v1/orders': {
        status: 409,
        body: {
          message: 'Some products are unavailable',
          errors: { 'items.0.productId': ['x'] },
        },
      },
    })
    renderRoute('/atk')
    const scope = await waitFor(() => form('pesan-atk'))
    fillCustomer(scope)
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )
    expect(await within(scope).findByRole('alert')).toHaveTextContent(
      'Pilih minimal satu produk',
    )

    fireEvent.change(await within(scope).findByLabelText(/Pulpen/), {
      target: { value: '1' },
    })
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )
    expect(await within(scope).findByRole('alert')).toHaveTextContent(
      'Sebagian produk sudah tidak tersedia',
    )
  })
})

describe('Laptop service form', () => {
  it('asks for the pickup address only for pickup and never for distance or fee', async () => {
    const api = mockApi({ 'POST /api/v1/orders': receipt('LAPTOP_SERVICE') })
    renderRoute('/laptop-service')
    const scope = await waitFor(() => form('pesan-laptop'))

    expect(within(scope).queryByLabelText(/Alamat penjemputan/)).toBeNull()
    fireEvent.click(within(scope).getByLabelText('Dijemput'))
    const address = await within(scope).findByLabelText(/Alamat penjemputan/)
    expect(address).toHaveAccessibleDescription(/gratis hingga 5 km/)
    expect(within(scope).queryByLabelText(/jarak|biaya/i)).toBeNull()

    fill(scope, /^Keluhan/, 'Tidak menyala')
    fillCustomer(scope)
    fill(scope, /^Waktu selesai yang diinginkan/, FUTURE)
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )
    expect(
      await within(scope).findByText('Alamat penjemputan wajib diisi.'),
    ).toBeInTheDocument()

    fireEvent.change(address, { target: { value: 'Jl. Melati 5' } })
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )
    await screen.findByRole('heading', { name: 'Permintaan berhasil dikirim' })
    expect(api.requestsTo('POST', '/api/v1/orders')[0]?.body).toStrictEqual({
      type: 'LAPTOP_SERVICE',
      customerName: 'Rina',
      customerWhatsapp: '0812-3456-7890',
      customerEmail: null,
      locationId: null,
      requestedCompletionAt: FUTURE_ISO,
      complaint: 'Tidak menyala',
      handoverMethod: 'PICKUP',
      handoverAt: null,
      pickupAddress: 'Jl. Melati 5',
    })
  })
})

describe('Software installation form', () => {
  it('requires the legal-license acknowledgement', async () => {
    const api = mockApi({
      'POST /api/v1/orders': receipt('SOFTWARE_INSTALLATION'),
    })
    renderRoute('/software-installation')
    const scope = await waitFor(() => form('pesan-software'))
    expect(scope).toHaveTextContent(
      /berlisensi sah, gratis \(freeware\), atau open-source/,
    )

    fill(scope, /^Nama software/, 'LibreOffice')
    fillCustomer(scope)
    fill(scope, /^Waktu selesai yang diinginkan/, FUTURE)
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )
    expect(
      await within(scope).findByText(
        'Centang pernyataan lisensi untuk melanjutkan.',
      ),
    ).toBeInTheDocument()
    expect(api.requestsTo('POST', '/api/v1/orders')).toHaveLength(0)

    fireEvent.click(within(scope).getByRole('checkbox'))
    fireEvent.click(
      within(scope).getByRole('button', { name: 'Kirim permintaan' }),
    )
    await screen.findByRole('heading', { name: 'Permintaan berhasil dikirim' })
    expect(api.requestsTo('POST', '/api/v1/orders')[0]?.body).toMatchObject({
      type: 'SOFTWARE_INSTALLATION',
      softwareName: 'LibreOffice',
      licenseAcknowledged: true,
    })
  })
})
