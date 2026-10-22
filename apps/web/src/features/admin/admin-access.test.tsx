import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, TEST_CSRF_TOKEN } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'
import { safeAdminRedirectPath } from '../auth/safe-redirect.ts'

const admin = { name: 'Admin Satu', email: 'admin@example.test', role: 'ADMIN' }
const member = { name: 'Ana', email: 'ana@example.test', role: 'MEMBER' }

describe('safeAdminRedirectPath', () => {
  it.each([
    ['/admin/orders', '/admin/orders'],
    [
      '/admin/orders/MP-2026-7K92D4QX8M7RA',
      '/admin/orders/MP-2026-7K92D4QX8M7RA',
    ],
    ['/admin', '/admin'],
  ])('keeps %s', (raw, expected) => {
    expect(safeAdminRedirectPath(raw)).toBe(expected)
  })

  it.each([
    null,
    'https://evil.example/admin',
    '//evil.example/admin',
    'javascript:alert(1)',
    '/account',
    '/administrator',
    '/admin/login',
  ])('falls back to /admin for %j', (raw) => {
    expect(safeAdminRedirectPath(raw)).toBe('/admin')
  })
})

describe('Admin guard', () => {
  it('shows nothing of the Admin area while the session is unknown', async () => {
    mockApi({ '/api/v1/auth/me': 'pending' })
    renderRoute('/admin')
    expect(await screen.findByText('Memeriksa sesi…')).toHaveAttribute(
      'role',
      'status',
    )
    expect(
      screen.queryByRole('navigation', { name: 'Navigasi admin' }),
    ).toBeNull()
  })

  it('sends signed-out visitors to the Admin login with a safe redirect', async () => {
    const { router } = renderRoute('/admin/orders')
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/admin/login'),
    )
    expect(router.state.location.search).toBe('?redirect=%2Fadmin%2Forders')
  })

  it('denies MEMBERs', async () => {
    mockApi({ '/api/v1/auth/me': { body: { data: member } } })
    renderRoute('/admin')
    expect(
      await screen.findByRole('heading', { name: 'Khusus Admin' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Navigasi admin' }),
    ).toBeNull()
  })

  it('renders the Admin shell for an ADMIN', async () => {
    mockApi({ '/api/v1/auth/me': { body: { data: admin } } })
    renderRoute('/admin')
    const nav = await screen.findByRole('navigation', {
      name: 'Navigasi admin',
    })
    for (const label of [
      'Dashboard',
      'Pesanan',
      'Produk',
      'Layanan',
      'Lokasi',
      'Pengaturan',
    ]) {
      expect(nav).toHaveTextContent(label)
    }
    expect(screen.getByText('Admin Satu')).toBeInTheDocument()
  })
})

describe('Admin login', () => {
  it('signs an ADMIN in and continues to the requested Admin page', async () => {
    const api = mockApi({
      '/api/v1/auth/me': [{ body: { data: null } }, { body: { data: admin } }],
      'POST /api/v1/auth/login': { body: { data: admin } },
    })
    const { router } = renderRoute('/admin/login?redirect=%2Fadmin%2Fsettings')
    await screen.findByRole('heading', { name: 'Masuk Admin' })
    // Email + password only: no Google option for Admins.
    expect(screen.queryByRole('group', { name: /Google/ })).toBeNull()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'admin@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Kata sandi'), {
      target: { value: 'admin password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/admin/settings'),
    )
    const [login] = api.requestsTo('POST', '/api/v1/auth/login')
    expect(login?.headers.get('X-CSRF-Token')).toBe(TEST_CSRF_TOKEN)
    expect(login?.body).toStrictEqual({
      email: 'admin@example.test',
      password: 'admin password',
    })
  })

  it('tells a MEMBER that the account is not an Admin account', async () => {
    mockApi({
      '/api/v1/auth/me': [{ body: { data: null } }, { body: { data: member } }],
      'POST /api/v1/auth/login': { body: { data: member } },
    })
    const { router } = renderRoute('/admin/login')
    await screen.findByRole('heading', { name: 'Masuk Admin' })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ana@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Kata sandi'), {
      target: { value: 'x' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Akun ini bukan akun Admin.',
    )
    expect(router.state.location.pathname).toBe('/admin/login')
  })

  it('shows the generic failure for wrong credentials', async () => {
    mockApi({
      'POST /api/v1/auth/login': {
        status: 401,
        body: { message: 'Invalid email or password' },
      },
    })
    renderRoute('/admin/login')
    await screen.findByRole('heading', { name: 'Masuk Admin' })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Kata sandi'), {
      target: { value: 'x' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email atau kata sandi tidak sesuai.',
    )
  })

  it('offers the Admin area from the public header to an ADMIN', async () => {
    mockApi({ '/api/v1/auth/me': { body: { data: admin } } })
    renderRoute('/')
    expect(
      (await screen.findAllByRole('link', { name: 'Admin' }))[0],
    ).toHaveAttribute('href', '/admin')
  })
})
