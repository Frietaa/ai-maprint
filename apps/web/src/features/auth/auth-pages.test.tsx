import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi, TEST_CSRF_TOKEN } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'

const member = { name: 'Ana', email: 'ana@example.test', role: 'MEMBER' }
const profile = {
  name: 'Ana',
  email: 'ana@example.test',
  whatsapp: null,
  signInMethods: { password: true, google: false },
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label, { exact: false }), {
    target: { value },
  })
}

afterEach(() => {
  vi.unstubAllEnvs()
  delete window.google
})

describe('Login page', () => {
  it('renders an accessible form with the right autocomplete hints', async () => {
    renderRoute('/login')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Masuk' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'autocomplete',
      'email',
    )
    expect(screen.getByLabelText('Kata sandi')).toHaveAttribute(
      'autocomplete',
      'current-password',
    )
    expect(screen.getByLabelText('Kata sandi')).toHaveAttribute(
      'type',
      'password',
    )
    expect(screen.getByRole('link', { name: 'Daftar' })).toHaveAttribute(
      'href',
      '/signup',
    )
    // No "forgot password" without a reset feature, no role selection.
    expect(screen.queryByText(/lupa/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument()
  })

  it('validates before calling the API and focuses the first problem', async () => {
    const api = mockApi()
    renderRoute('/login')
    await screen.findByRole('heading', { name: 'Masuk', level: 1 })

    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByText('Email wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Kata sandi wajib diisi.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await waitFor(() => expect(screen.getByLabelText('Email')).toHaveFocus())
    expect(api.requestsTo('POST', '/api/v1/auth/login')).toHaveLength(0)
  })

  it('signs in with the CSRF token and opens the account', async () => {
    const api = mockApi({
      '/api/v1/auth/me': [{ body: { data: null } }, { body: { data: member } }],
      'POST /api/v1/auth/login': { body: { data: member } },
      '/api/v1/account/profile': { body: { data: profile } },
    })
    const { router } = renderRoute('/login')
    await screen.findByRole('heading', { name: 'Masuk', level: 1 })

    type('Email', 'ana@example.test')
    type('Kata sandi', 'secret password')
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Akun Saya' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/account')
    // Password never ends up in the URL.
    expect(router.state.location.search).toBe('')

    const [login] = api.requestsTo('POST', '/api/v1/auth/login')
    expect(login?.headers.get('X-CSRF-Token')).toBe(TEST_CSRF_TOKEN)
    expect(login?.credentials).toBe('include')
    expect(login?.body).toStrictEqual({
      email: 'ana@example.test',
      password: 'secret password',
    })
  })

  it('shows one generic message for rejected credentials', async () => {
    mockApi({
      'POST /api/v1/auth/login': {
        status: 401,
        body: { message: 'Invalid email or password' },
      },
    })
    renderRoute('/login')
    await screen.findByRole('heading', { name: 'Masuk', level: 1 })

    type('Email', 'ana@example.test')
    type('Kata sandi', 'wrong')
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Email atau kata sandi tidak sesuai.')
    await waitFor(() => expect(alert).toHaveFocus())
  })

  it('tells the visitor to slow down when rate limited', async () => {
    mockApi({
      'POST /api/v1/auth/login': {
        status: 429,
        body: { message: 'Too many requests' },
      },
    })
    renderRoute('/login')
    await screen.findByRole('heading', { name: 'Masuk', level: 1 })
    type('Email', 'ana@example.test')
    type('Kata sandi', 'x')
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Terlalu banyak percobaan/,
    )
  })

  it('disables the submit button while signing in', async () => {
    mockApi({ 'POST /api/v1/auth/login': 'pending' })
    renderRoute('/login')
    await screen.findByRole('heading', { name: 'Masuk', level: 1 })
    type('Email', 'ana@example.test')
    type('Kata sandi', 'secret password')
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(
      await screen.findByRole('button', { name: 'Memproses…' }),
    ).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/memproses/i)
  })

  it('follows a safe internal redirect after signing in', async () => {
    mockApi({
      '/api/v1/auth/me': [{ body: { data: null } }, { body: { data: member } }],
      'POST /api/v1/auth/login': { body: { data: member } },
    })
    const { router } = renderRoute('/login?redirect=%2Flocations')
    await screen.findByRole('heading', { name: 'Masuk', level: 1 })
    type('Email', 'ana@example.test')
    type('Kata sandi', 'secret password')
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/locations'),
    )
  })

  it('ignores an external redirect target', async () => {
    mockApi({ '/api/v1/auth/me': { body: { data: member } } })
    const { router } = renderRoute(
      `/login?redirect=${encodeURIComponent('https://evil.example/')}`,
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/account'))
  })

  it('sends a signed-in visitor straight on', async () => {
    mockApi({ '/api/v1/auth/me': { body: { data: member } } })
    const { router } = renderRoute('/login')
    await waitFor(() => expect(router.state.location.pathname).toBe('/account'))
  })
})

describe('Signup page', () => {
  it('shows the fields, password requirements and no role choice', async () => {
    renderRoute('/signup')
    await screen.findByRole('heading', { level: 1, name: 'Daftar' })

    expect(screen.getByLabelText('Nama')).toHaveAttribute(
      'autocomplete',
      'name',
    )
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'autocomplete',
      'email',
    )
    const password = screen.getByLabelText('Kata sandi')
    expect(password).toHaveAttribute('autocomplete', 'new-password')
    // Requirements are tied to the input for screen readers.
    expect(password).toHaveAccessibleDescription(/Minimal 8 karakter/)
    expect(screen.getByLabelText(/Nomor WhatsApp/)).toHaveAttribute(
      'autocomplete',
      'tel',
    )
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByText(/admin|peran|role/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Masuk' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('validates the password policy and WhatsApp format', async () => {
    const api = mockApi()
    renderRoute('/signup')
    await screen.findByRole('heading', { level: 1, name: 'Daftar' })

    type('Nama', 'Ana')
    type('Email', 'ana@example.test')
    type('Kata sandi', 'short')
    type('Nomor WhatsApp', '12ab')
    fireEvent.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(
      await screen.findByText('Kata sandi minimal 8 karakter.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/nomor WhatsApp yang valid/)).toBeInTheDocument()
    expect(api.requestsTo('POST', '/api/v1/auth/register')).toHaveLength(0)
  })

  it('creates the account and confirms it on the account page', async () => {
    const api = mockApi({
      '/api/v1/auth/me': [{ body: { data: null } }, { body: { data: member } }],
      'POST /api/v1/auth/register': { status: 201, body: { data: member } },
      '/api/v1/account/profile': { body: { data: profile } },
    })
    renderRoute('/signup')
    await screen.findByRole('heading', { level: 1, name: 'Daftar' })

    type('Nama', 'Ana')
    type('Email', 'ana@example.test')
    type('Kata sandi', '  spaced password ')
    fireEvent.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Akun Saya' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Akun berhasil dibuat.')).toHaveAttribute(
      'role',
      'status',
    )

    const [register] = api.requestsTo('POST', '/api/v1/auth/register')
    expect(register?.headers.get('X-CSRF-Token')).toBe(TEST_CSRF_TOKEN)
    // Password sent verbatim (not trimmed); no role field.
    expect(register?.body).toStrictEqual({
      name: 'Ana',
      email: 'ana@example.test',
      password: '  spaced password ',
      whatsapp: null,
    })
  })

  it('explains an already registered email', async () => {
    mockApi({
      'POST /api/v1/auth/register': {
        status: 409,
        body: { message: 'Email already registered' },
      },
    })
    renderRoute('/signup')
    await screen.findByRole('heading', { level: 1, name: 'Daftar' })
    type('Nama', 'Ana')
    type('Email', 'ana@example.test')
    type('Kata sandi', 'long enough password')
    fireEvent.click(screen.getByRole('button', { name: 'Buat akun' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email sudah terdaftar. Silakan masuk.',
    )
  })
})

describe('Continue as guest', () => {
  it.each(['/login', '/signup'])(
    'on %s returns to the public site without any auth request',
    async (path) => {
      const api = mockApi()
      const { router } = renderRoute(path)
      await screen.findByRole('heading', { level: 1 })

      fireEvent.click(screen.getByRole('link', { name: 'Lanjut sebagai tamu' }))

      await waitFor(() => expect(router.state.location.pathname).toBe('/'))
      // No account, no session: neither sign-up nor even a CSRF token.
      expect(
        api.requests.filter(
          (r) => r.method !== 'GET' || r.url.pathname === '/api/v1/auth/csrf',
        ),
      ).toHaveLength(0)
    },
  )
})

describe('Header account links', () => {
  it('offers Masuk and Daftar when signed out', async () => {
    renderRoute('/')
    const banner = screen.getByRole('banner')
    expect(
      await within(banner).findAllByRole('link', { name: 'Masuk' }),
    ).not.toHaveLength(0)
    expect(
      within(banner).getAllByRole('link', { name: 'Daftar' }),
    ).not.toHaveLength(0)
    expect(within(banner).queryByRole('link', { name: 'Akun' })).toBeNull()
  })

  it('offers Akun when signed in', async () => {
    mockApi({ '/api/v1/auth/me': { body: { data: member } } })
    renderRoute('/')
    const banner = screen.getByRole('banner')
    expect(
      await within(banner).findAllByRole('link', { name: 'Akun' }),
    ).not.toHaveLength(0)
    expect(within(banner).queryByRole('link', { name: 'Masuk' })).toBeNull()
  })

  it('shows no account links while the session is unknown', () => {
    mockApi({ '/api/v1/auth/me': 'pending' })
    renderRoute('/')
    const banner = screen.getByRole('banner')
    expect(within(banner).queryByRole('link', { name: 'Masuk' })).toBeNull()
    expect(within(banner).queryByRole('link', { name: 'Akun' })).toBeNull()
  })
})

describe('Google Sign-In', () => {
  it('is not offered when VITE_GOOGLE_CLIENT_ID is not configured', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
    renderRoute('/login')
    await screen.findByRole('heading', { level: 1, name: 'Masuk' })
    expect(
      screen.queryByRole('group', { name: 'Masuk dengan Google' }),
    ).not.toBeInTheDocument()
    // Email + password still works.
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeEnabled()
  })

  it('renders the GIS button and sends the credential to the API only', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client.apps.example')
    let callback: ((response: { credential?: string }) => void) | undefined
    const initialize = vi.fn((config: { callback: typeof callback }) => {
      callback = config.callback
    })
    const renderButton = vi.fn((parent: HTMLElement) => {
      const button = document.createElement('button')
      button.textContent = 'Lanjutkan dengan Google'
      parent.append(button)
    })
    window.google = { accounts: { id: { initialize, renderButton } } }

    const api = mockApi({
      '/api/v1/auth/me': [{ body: { data: null } }, { body: { data: member } }],
      'POST /api/v1/auth/google': { body: { data: member } },
      '/api/v1/account/profile': { body: { data: profile } },
    })
    const { router } = renderRoute('/login')

    const group = await screen.findByRole('group', {
      name: 'Masuk dengan Google',
    })
    expect(
      await within(group).findByRole('button', {
        name: 'Lanjutkan dengan Google',
      }),
    ).toBeInTheDocument()
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'test-client.apps.example' }),
    )

    act(() => callback?.({ credential: 'gis-id-token' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/account'))
    const [google] = api.requestsTo('POST', '/api/v1/auth/google')
    expect(google?.body).toStrictEqual({ credential: 'gis-id-token' })
    expect(google?.headers.get('X-CSRF-Token')).toBe(TEST_CSRF_TOKEN)
    // The credential is never put in the URL or web storage.
    expect(router.state.location.search).not.toContain('gis-id-token')
    expect(
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ).not.toContain('gis-id-token')
  })

  it('shows the conflict message for an email registered otherwise', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client.apps.example')
    let callback: ((response: { credential?: string }) => void) | undefined
    window.google = {
      accounts: {
        id: {
          initialize: (config: { callback: typeof callback }) => {
            callback = config.callback
          },
          renderButton: () => {},
        },
      },
    }
    mockApi({
      'POST /api/v1/auth/google': {
        status: 409,
        body: {
          message: 'Email already registered with another sign-in method',
        },
      },
    })
    renderRoute('/login')
    await screen.findByRole('group', { name: 'Masuk dengan Google' })
    await waitFor(() => expect(callback).toBeDefined())

    act(() => callback?.({ credential: 'gis-id-token' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /sudah terdaftar dengan cara masuk lain/,
    )
  })
})
