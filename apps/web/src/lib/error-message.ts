import { ApiError } from './api-client.ts'

export interface ErrorCopy {
  title: string
  description: string
}

// User-facing Indonesian copy for a failed data request. Technical details
// (status codes, server messages, stack traces) are never shown.
export function describeLoadError(error: unknown): ErrorCopy {
  if (error instanceof ApiError) {
    if (error.kind === 'network') {
      return {
        title: 'Tidak dapat terhubung',
        description:
          'Periksa koneksi internet Anda, lalu coba lagi beberapa saat lagi.',
      }
    }
    if (error.kind === 'http' && error.status !== null && error.status < 500) {
      return {
        title: 'Permintaan tidak dapat diproses',
        description:
          'Data yang diminta tidak valid atau tidak tersedia. Muat ulang halaman ini.',
      }
    }
  }
  return {
    title: 'Data belum dapat dimuat',
    description: 'Terjadi gangguan pada server kami. Silakan coba lagi.',
  }
}
