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
  login: {
    title: 'Masuk',
    description: 'Masuk ke akun member Anda.',
  },
  signup: {
    title: 'Daftar',
    description: 'Buat akun member untuk menyimpan data kontak Anda.',
  },
  account: {
    title: 'Akun',
    description: 'Profil akun member Anda.',
  },
  trackOrder: {
    title: 'Lacak Pesanan',
    description: 'Lacak status pesanan Anda dengan ID pesanan.',
  },
  accountOrders: {
    title: 'Riwayat Pesanan',
    description: 'Riwayat pesanan akun member Anda.',
  },
  accountOrderDetail: {
    title: 'Detail Pesanan',
    description: 'Detail pesanan akun member Anda.',
  },
  notFound: {
    title: 'Halaman tidak ditemukan',
    description: 'Halaman yang Anda cari tidak tersedia.',
  },
} as const satisfies Record<string, PageMetadata>
