import type { PublicSettingsDto } from '@maba-printing/shared'
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'

const settings: PublicSettingsDto = {
  businessName: 'Toko Cetak Contoh',
  whatsappNumber: '+62 812-0000-0000',
  logoRef: null,
  qrisImageRef: null,
  socialLinks: [{ platform: 'instagram', url: 'https://example.test/ig' }],
  publicInfo: null,
}

describe('public shell with business settings', () => {
  it('shows the business name and contact details from the API', async () => {
    mockApi({ '/api/v1/public/settings': { body: { data: settings } } })
    renderRoute('/locations')

    const footer = screen.getByRole('contentinfo')
    expect(
      await within(footer).findByText('+62 812-0000-0000'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('banner')).getByRole('link', {
        name: 'Toko Cetak Contoh — Beranda',
      }),
    ).toBeInTheDocument()
    expect(
      within(footer).getByRole('link', { name: 'instagram' }),
    ).toHaveAttribute('href', 'https://example.test/ig')
  })

  it('renders a configured safe logo image', async () => {
    mockApi({
      '/api/v1/public/settings': {
        body: { data: { ...settings, logoRef: '/brand/logo.png' } },
      },
    })
    renderRoute('/locations')

    const logo = await screen.findByRole('img', { name: 'Toko Cetak Contoh' })
    expect(logo).toHaveAttribute('src', '/brand/logo.png')
  })

  it('falls back to the static name when settings are not configured', async () => {
    const { fetchMock } = mockApi({
      '/api/v1/public/settings': { body: { data: null } },
    })
    renderRoute('/locations')

    await waitForSettingsRequest(fetchMock)
    expect(
      screen.getByRole('link', { name: 'MABA PRINTING — Beranda' }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('contentinfo')).queryByText('WhatsApp'),
    ).not.toBeInTheDocument()
  })

  it('keeps the shell usable when the settings request fails', async () => {
    const { fetchMock } = mockApi({
      '/api/v1/public/settings': 'network-error',
    })
    renderRoute('/locations')

    await waitForSettingsRequest(fetchMock)
    expect(
      screen.getByRole('link', { name: 'MABA PRINTING — Beranda' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Lokasi' }),
    ).toBeInTheDocument()
  })
})

// Waits until the shell has requested the settings and the request settled.
async function waitForSettingsRequest(fetchMock: {
  mock: { calls: unknown[] }
}) {
  await waitFor(() => {
    expect(fetchMock.mock.calls.length).toBeGreaterThan(0)
  })
  await screen.findByRole('banner')
}
