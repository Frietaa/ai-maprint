// Operational Indonesian copy for failed Admin requests (no server
// internals). Field errors are listed so the Admin can correct input.
import { ApiError } from '../../lib/api-client.ts'

export function adminErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return 'Terjadi gangguan. Silakan coba lagi.'
  if (error.kind === 'network') {
    return 'Tidak dapat terhubung ke server. Periksa koneksi, lalu coba lagi.'
  }
  switch (error.status) {
    case 400: {
      const fields = Object.keys(error.fieldErrors ?? {})
      return fields.length > 0
        ? `Periksa kembali isian: ${fields.join(', ')}.`
        : 'Periksa kembali isian.'
    }
    case 401:
      return 'Sesi Anda berakhir. Silakan masuk kembali.'
    case 403:
      return 'Akses ditolak atau sesi berakhir. Muat ulang halaman.'
    case 404:
      return 'Data tidak ditemukan.'
    case 409:
      return error.message === 'Order status has changed'
        ? 'Pesanan sudah diubah oleh Admin lain. Data terbaru telah dimuat.'
        : 'Perubahan status ini tidak diizinkan.'
    case 429:
      return 'Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.'
    default:
      return 'Terjadi gangguan pada server. Silakan coba lagi.'
  }
}
