import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../test/render-route.tsx'

const pages = [
  ['/', 'MABA PRINTING'],
  ['/printing', 'Printing'],
  ['/atk', 'ATK'],
  ['/laptop-service', 'Service Laptop'],
  ['/software-installation', 'Instalasi Software'],
  ['/locations', 'Lokasi'],
] as const

describe('public routes', () => {
  it.each(pages)('%s renders its heading inside the shell', (path, title) => {
    renderRoute(path)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: title }),
    ).toBeInTheDocument()
  })

  it('renders the NotFound page for unknown routes', () => {
    renderRoute('/tidak-ada')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Halaman tidak ditemukan',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Kembali ke beranda' }),
    ).toHaveAttribute('href', '/')
  })

  it('does not expose routes of later phases', () => {
    for (const path of ['/admin', '/admin/orders']) {
      const { unmount } = renderRoute(path)
      expect(
        screen.getByRole('heading', { name: 'Halaman tidak ditemukan' }),
      ).toBeInTheDocument()
      unmount()
    }
  })
})

describe('primary navigation', () => {
  it('marks only the current page with aria-current', () => {
    renderRoute('/atk')
    const nav = screen.getByRole('navigation', { name: 'Navigasi utama' })

    expect(within(nav).getByRole('link', { name: 'ATK' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      within(nav).getByRole('link', { name: 'Beranda' }),
    ).not.toHaveAttribute('aria-current')
  })

  it('navigates between pages', () => {
    renderRoute('/')
    const nav = screen.getByRole('navigation', { name: 'Navigasi utama' })

    fireEvent.click(within(nav).getByRole('link', { name: 'Lokasi' }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Lokasi' }),
    ).toBeInTheDocument()
  })
})

describe('mobile navigation', () => {
  function getToggle() {
    return screen.getByRole('button', { name: 'Menu' })
  }

  it('opens and closes with its toggle button', () => {
    renderRoute('/')
    const toggle = getToggle()
    const panelId = toggle.getAttribute('aria-controls') ?? ''
    const panel = document.getElementById(panelId)

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(panel).not.toBeVisible()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(panel).toBeVisible()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on Escape and returns focus to the toggle', () => {
    renderRoute('/')
    const toggle = getToggle()
    fireEvent.click(toggle)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })

  it('closes after choosing a destination', () => {
    renderRoute('/')
    fireEvent.click(getToggle())
    const mobileNav = screen.getByRole('navigation', {
      name: 'Navigasi utama (seluler)',
    })

    fireEvent.click(within(mobileNav).getByRole('link', { name: 'Printing' }))

    expect(getToggle()).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Printing' }),
    ).toBeInTheDocument()
  })
})
