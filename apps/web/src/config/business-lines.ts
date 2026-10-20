// The four MABA PRINTING business lines (PRD §2). Static navigation concepts
// only: prices, availability and other mutable details come from the API.
export type BusinessLineIcon = 'printer' | 'pencil' | 'laptop' | 'software'

export interface BusinessLine {
  to: string
  title: string
  description: string
  icon: BusinessLineIcon
}

export const businessLines: readonly BusinessLine[] = [
  {
    to: '/printing',
    title: 'Printing',
    description: 'Cetak tugas, makalah, laporan, dan dokumen lainnya.',
    icon: 'printer',
  },
  {
    to: '/atk',
    title: 'ATK',
    description: 'Alat tulis dan perlengkapan kuliah sehari-hari.',
    icon: 'pencil',
  },
  {
    to: '/laptop-service',
    title: 'Service Laptop',
    description: 'Pemeriksaan dan perbaikan laptop, antar atau jemput.',
    icon: 'laptop',
  },
  {
    to: '/software-installation',
    title: 'Instalasi Software',
    description: 'Pemasangan software legal untuk kuliah dan kerja.',
    icon: 'software',
  },
]
