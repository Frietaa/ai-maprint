// Primary public navigation (static route configuration).
export interface NavItem {
  to: string
  label: string
}

export const primaryNavigation: readonly NavItem[] = [
  { to: '/', label: 'Beranda' },
  { to: '/printing', label: 'Printing' },
  { to: '/atk', label: 'ATK' },
  { to: '/laptop-service', label: 'Service Laptop' },
  { to: '/software-installation', label: 'Instalasi Software' },
  { to: '/locations', label: 'Lokasi' },
]
