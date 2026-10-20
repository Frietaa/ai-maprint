// Indonesian, non-technical copy for failed auth/account requests. Never
// reveals whether an email exists on sign-in, and never shows server
// messages, status codes or security jargon.
import { ApiError } from '../../lib/api-client.ts'

export type AuthAction = 'login' | 'register' | 'google' | 'profile' | 'logout'

export function authErrorMessage(error: unknown, action: AuthAction): string {
  if (!(error instanceof ApiError)) return GENERIC
  if (error.kind === 'network') {
    return 'Tidak dapat terhubung. Periksa koneksi internet Anda, lalu coba lagi.'
  }
  switch (error.status) {
    case 400:
      return 'Periksa kembali isian Anda.'
    case 401:
      if (action === 'login') return 'Email atau kata sandi tidak sesuai.'
      if (action === 'google')
        return 'Masuk dengan Google gagal. Silakan coba lagi.'
      return 'Sesi Anda telah berakhir. Silakan masuk kembali.'
    case 403:
      return 'Sesi Anda telah berakhir. Muat ulang halaman, lalu coba lagi.'
    case 409:
      return action === 'google'
        ? 'Email ini sudah terdaftar dengan cara masuk lain. Silakan masuk dengan email dan kata sandi.'
        : 'Email sudah terdaftar. Silakan masuk.'
    case 429:
      return 'Terlalu banyak percobaan. Tunggu beberapa saat, lalu coba lagi.'
    case 503:
      if (action === 'google')
        return 'Masuk dengan Google sedang tidak tersedia.'
      return GENERIC
    default:
      return GENERIC
  }
}

const GENERIC = 'Terjadi gangguan pada server kami. Silakan coba lagi.'
