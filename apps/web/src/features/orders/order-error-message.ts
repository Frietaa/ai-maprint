// Indonesian, non-technical copy for failed order requests. Server messages,
// status codes and internals are never shown.
import { ApiError } from '../../lib/api-client.ts'

const GENERIC = 'Terjadi gangguan pada server kami. Silakan coba lagi.'

export function orderErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC
  if (error.kind === 'network') {
    // Resending the unchanged form reuses its Idempotency-Key (KI-020).
    return 'Tidak dapat terhubung. Periksa koneksi internet Anda, lalu kirim lagi — jika permintaan sempat terkirim, Anda tidak akan membuat pesanan ganda.'
  }
  switch (error.status) {
    case 400:
      return 'Periksa kembali isian yang ditandai.'
    case 403:
      return 'Sesi Anda telah berakhir. Muat ulang halaman, lalu coba lagi.'
    case 409:
      if (error.fieldErrors?.idempotencyKey) {
        return 'Permintaan ini sudah pernah dikirim. Muat ulang halaman untuk membuat permintaan baru, atau lacak pesanan Anda.'
      }
      return error.fieldErrors?.locationId
        ? 'Lokasi yang dipilih sedang tidak tersedia. Pilih lokasi lain.'
        : 'Sebagian produk sudah tidak tersedia. Perbarui pilihan Anda, lalu kirim lagi.'
    case 413:
      return 'Ukuran file terlalu besar. Kirim file yang lebih kecil, atau kirimkan lewat WhatsApp.'
    case 415:
      return 'Jenis file tidak didukung. Gunakan PDF, DOCX, PPTX, XLSX, JPG, atau PNG, atau kirimkan lewat WhatsApp.'
    case 429:
      return 'Terlalu banyak permintaan. Tunggu beberapa saat, lalu coba lagi.'
    case 503:
      return 'Pengajuan pesanan sedang tidak tersedia. Silakan coba lagi nanti.'
    default:
      return GENERIC
  }
}

// Server field errors (`items.1.productId`, `files.0`, ...) → the form
// fields they belong to.
export function serverFieldNames(error: unknown): string[] {
  if (!(error instanceof ApiError) || !error.fieldErrors) return []
  return Object.keys(error.fieldErrors).map((key) => key.split('.')[0] ?? key)
}
