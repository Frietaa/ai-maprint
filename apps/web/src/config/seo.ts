// Route metadata for public pages (document title + meta description).
// Titles are suffixed with the business name at runtime.
export interface PageMetadata {
  // undefined = the business name alone (homepage).
  title?: string
  description: string
}

export const pageMeta = {
  home: {
    description:
      'Cetak dokumen, ATK, service laptop, dan instalasi software untuk mahasiswa dan umum. Lihat layanan, harga, dan lokasi kami.',
  },
  printing: {
    title: 'Printing',
    description:
      'Layanan cetak tugas, makalah, laporan, dan skripsi. Lihat daftar layanan printing dan harganya.',
  },
  atk: {
    title: 'ATK',
    description:
      'Katalog alat tulis dan perlengkapan kuliah beserta harga dan ketersediaannya.',
  },
  laptopService: {
    title: 'Service Laptop',
    description:
      'Pemeriksaan dan perbaikan laptop dengan pilihan antar ke lokasi atau dijemput.',
  },
  softwareInstallation: {
    title: 'Instalasi Software',
    description:
      'Instalasi software legal untuk kebutuhan kuliah dan kerja: berlisensi, gratis, atau open-source.',
  },
  locations: {
    title: 'Lokasi',
    description: 'Alamat dan jam buka lokasi kami.',
  },
  notFound: {
    title: 'Halaman tidak ditemukan',
    description: 'Halaman yang Anda cari tidak tersedia.',
  },
} as const satisfies Record<string, PageMetadata>
