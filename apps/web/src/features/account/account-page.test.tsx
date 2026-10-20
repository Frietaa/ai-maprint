import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, TEST_CSRF_TOKEN } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'

const member = { name: 'Ana', email: 'ana@example.test', role: 'MEMBER' }
const profile = {
  name: 'Ana',
  email: 'ana@example.test',
  whatsapp: '0812-3456-7890',
  signInMethods: { password: true, google: false },
}

describe('Account page protection', () => {
  it('shows a session check, not account content, while loading', () => {
    mockApi({ '/api/v1/auth/me': 'pending' })
    renderRoute('/account')

    expect(screen.getByRole('status')).toHaveTextContent('Memeriksa sesi…')
    expect(screen.queryByRole('heading', { name: 'Akun Saya' })).toBeNull()
  })

  it('redirects signed-out visitors to login with a safe redirect', async () => {
    const api = mockApi()
    const { router } = renderRoute('/account')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Masuk' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('?redirect=%2Faccount')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Silakan masuk untuk membuka akun.',
    )
    // The protected profile was never requested.
    expect(api.requestsTo('GET', '/api/v1/account/profile')).toHaveLength(0)
  })

  it('offers a retry when the session check fails', async () => {
    mockApi({ '/api/v1/auth/me': 'network-error' })
    renderRoute('/account')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tidak dapat terhubung',
    )
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeEnabled()
  })

  it('does not show the member page to other roles', async () => {
    mockApi({
      '/api/v1/auth/me': { body: { data: { ...member, role: 'ADMIN' } } },
    })
    renderRoute('/account')
    expect(
      await screen.findByRole('heading', { name: 'Halaman khusus member' }),
    ).toBeInTheDocument()
  })
})

describe('Account page', () => {
  it('shows the member profile without internal identifiers', async () => {
    mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      '/api/v1/account/profile': { body: { data: profile } },
    })
    renderRoute('/account')

    const section = await screen.findByRole('region', { name: 'Profil' })
    expect(
      await within(section).findByText('0812-3456-7890'),
    ).toBeInTheDocument()
    expect(within(section).getByText('ana@example.test')).toBeInTheDocument()
    expect(
      within(section).getByText('Email dan kata sandi'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Riwayat pesanan akan tersedia/),
    ).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(
      /(?:^|[^A-Za-z])MEMBER(?:[^A-Za-z]|$)|googleId|[0-9a-f]{8}-[0-9a-f]{4}-/,
    )
  })

  it('updates the profile with the CSRF token', async () => {
    const api = mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      '/api/v1/account/profile': { body: { data: profile } },
      'PATCH /api/v1/account/profile': {
        body: { data: { ...profile, name: 'Ana Baru', whatsapp: null } },
      },
    })
    renderRoute('/account')
    fireEvent.click(await screen.findByRole('button', { name: 'Ubah profil' }))

    fireEvent.change(screen.getByLabelText('Nama'), {
      target: { value: 'Ana Baru' },
    })
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Profil berhasil diperbarui.',
    )
    expect(screen.getByText('Ana Baru')).toBeInTheDocument()
    expect(screen.getByText('Belum diisi')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Ubah profil' })).toHaveFocus(),
    )

    const [patch] = api.requestsTo('PATCH', '/api/v1/account/profile')
    expect(patch?.headers.get('X-CSRF-Token')).toBe(TEST_CSRF_TOKEN)
    // Only member-editable fields are sent.
    expect(patch?.body).toStrictEqual({ name: 'Ana Baru', whatsapp: null })
  })

  it('validates profile input before saving', async () => {
    const api = mockApi({
      '/api/v1/auth/me': { body: { data: member } },
      '/api/v1/account/profile': { body: { data: profile } },
    })
    renderRoute('/account')
    fireEvent.click(await screen.findByRole('button', { name: 'Ubah profil' }))
    fireEvent.change(screen.getByLabelText('Nama'), { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(await screen.findByText('Nama wajib diisi.')).toBeInTheDocument()
    expect(api.requestsTo('PATCH', '/api/v1/account/profile')).toHaveLength(0)
  })

  it('signs out on the server and returns to the public site', async () => {
    const api = mockApi({
      '/api/v1/auth/me': [{ body: { data: member } }, { body: { data: null } }],
      '/api/v1/account/profile': { body: { data: profile } },
      'POST /api/v1/auth/logout': { body: { data: null } },
    })
    const { router } = renderRoute('/account')

    fireEvent.click(await screen.findByRole('button', { name: 'Keluar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(api.requestsTo('POST', '/api/v1/auth/logout')).toHaveLength(1)
    // Straight to the home page, not bounced to the login page.
    expect(router.state.location.search).toBe('')
    const banner = screen.getByRole('banner')
    expect(
      await within(banner).findAllByRole('link', { name: 'Masuk' }),
    ).not.toHaveLength(0)
  })

  it('returns to login when the session ended server-side', async () => {
    mockApi({
      '/api/v1/auth/me': [{ body: { data: member } }, { body: { data: null } }],
      '/api/v1/account/profile': {
        status: 401,
        body: { message: 'Authentication required' },
      },
    })
    const { router } = renderRoute('/account')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})
