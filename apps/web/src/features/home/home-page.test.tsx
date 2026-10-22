import type { LocationDto, PublicSettingsDto } from '@maba-printing/shared'
import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '../../test/api-mock.ts'
import { renderRoute } from '../../test/render-route.tsx'

const location = (id: string, name: string): LocationDto => ({
  id,
  name,
  address: `Alamat ${name}`,
  openingHours: null,
})

const settings: PublicSettingsDto = {
  businessName: 'Cetak Kampus',
  whatsappNumber: '+62 811-1111-1111',
  logoRef: null,
  qrisImageRef: null,
  socialLinks: [],
  publicInfo: 'Buka setiap hari kerja.',
}

const list = (data: LocationDto[]) => ({
  body: { data, meta: { count: data.length } },
})

describe('homepage', () => {
  it('has one h1 and links the four business lines', () => {
    renderRoute('/')

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const services = screen.getByRole('region', { name: 'Layanan kami' })
    const links = within(services).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/printing',
      '/atk',
      '/laptop-service',
      '/software-installation',
    ])
  })

  it('navigates from a business-line card to its page', () => {
    renderRoute('/')
    const services = screen.getByRole('region', { name: 'Layanan kami' })

    fireEvent.click(within(services).getByRole('link', { name: /^ATK/ }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'ATK' }),
    ).toBeInTheDocument()
  })

  it('previews at most three locations from the API', async () => {
    mockApi({
      '/api/v1/locations': list([
        location('1', 'Lokasi A'),
        location('2', 'Lokasi B'),
        location('3', 'Lokasi C'),
        location('4', 'Lokasi D'),
      ]),
    })
    renderRoute('/')

    const section = screen.getByRole('region', { name: 'Lokasi kami' })
    expect(
      await within(section).findByRole('heading', { name: 'Lokasi A' }),
    ).toBeInTheDocument()
    expect(
      within(section).getByRole('heading', { name: 'Lokasi C' }),
    ).toBeInTheDocument()
    expect(
      within(section).queryByRole('heading', { name: 'Lokasi D' }),
    ).not.toBeInTheDocument()
  })

  it('keeps the page usable when locations fail to load', async () => {
    mockApi({ '/api/v1/locations': 'network-error' })
    renderRoute('/')

    const section = screen.getByRole('region', { name: 'Lokasi kami' })
    expect(await within(section).findByRole('alert')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Layanan kami' }),
    ).toBeInTheDocument()
  })

  it('shows configured business information only when present', async () => {
    mockApi({ '/api/v1/public/settings': { body: { data: settings } } })
    renderRoute('/')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cetak Kampus' }),
    ).toBeInTheDocument()
    const info = screen.getByRole('region', { name: 'Informasi' })
    expect(info).toHaveTextContent('Buka setiap hari kerja.')
    expect(info).toHaveTextContent('+62 811-1111-1111')
  })

  it('omits the information section when settings are not configured', () => {
    renderRoute('/')
    expect(
      screen.queryByRole('region', { name: 'Informasi' }),
    ).not.toBeInTheDocument()
  })
})
