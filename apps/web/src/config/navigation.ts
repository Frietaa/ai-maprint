// Public navigation (static route configuration).
export interface NavItem {
  to: string
  label: string
}

// Every public page, flat (footer).
export const primaryNavigation: readonly NavItem[] = [
  { to: '/', label: 'Beranda' },
  { to: '/printing', label: 'Printing' },
  { to: '/atk', label: 'ATK' },
  { to: '/laptop-service', label: 'Service Laptop' },
  { to: '/software-installation', label: 'Instalasi Software' },
  { to: '/locations', label: 'Lokasi' },
  { to: '/track-order', label: 'Lacak Pesanan' },
]

export interface NavGroupItem extends NavItem {
  description: string
}

// A header entry that opens a dropdown (desktop) or accordion (mobile).
export interface NavGroup {
  id: string
  label: string
  items: readonly NavGroupItem[]
}

export type HeaderNavEntry = NavItem | NavGroup

export function isNavGroup(entry: HeaderNavEntry): entry is NavGroup {
  return 'items' in entry
}

// Header: Beranda, Layanan (dropdown) and Track (dropdown).
export const headerNavigation: readonly HeaderNavEntry[] = [
  { to: '/', label: 'Beranda' },
  {
    id: 'layanan',
    label: 'Layanan',
    items: [
      {
        to: '/printing',
        label: 'Printing',
        description: 'Cetak tugas, makalah, dan dokumen',
      },
      {
        to: '/laptop-service',
        label: 'Service Laptop',
        description: 'Perbaikan laptop, antar atau jemput',
      },
      {
        to: '/software-installation',
        label: 'Instalasi Software',
        description: 'Pemasangan software legal',
      },
    ],
  },
  {
    id: 'track',
    label: 'Track',
    items: [
      {
        to: '/locations',
        label: 'Lokasi',
        description: 'Alamat dan jam buka kami',
      },
      {
        to: '/track-order',
        label: 'Lacak Pesanan',
        description: 'Cek status dengan ID pesanan',
      },
    ],
  },
]
