// Early, Indonesian feedback for order forms, mirroring the API rules
// (ORDER_LIMITS, upload policy). The API stays authoritative.
import {
  ORDER_LIMITS,
  UPLOAD_ACCEPTED_EXTENSIONS,
  UPLOAD_DEFAULT_LIMITS,
} from '@maba-printing/shared'
import { wibInputToIso } from '../../lib/format-datetime.ts'
import { validateEmail, validateWhatsapp } from '../auth/validation.ts'

export function validateCustomerName(name: string): string | true {
  const value = name.trim()
  if (value === '') return 'Nama wajib diisi.'
  if (value.length > ORDER_LIMITS.customerNameMaxLength) {
    return `Nama maksimal ${ORDER_LIMITS.customerNameMaxLength} karakter.`
  }
  return true
}

export function validateCustomerWhatsapp(value: string): string | true {
  if (value.trim() === '') return 'Nomor WhatsApp wajib diisi.'
  return validateWhatsapp(value) ?? true
}

export function validateOptionalEmail(value: string): string | true {
  if (value.trim() === '') return true
  return validateEmail(value) ?? true
}

// datetime-local value (WIB): required or optional, in the future, at most a
// year ahead. Preferred time only — never a promise.
export function validateFutureWib(
  value: string,
  { required, now = new Date() }: { required: boolean; now?: Date },
): string | true {
  if (value === '') return required ? 'Waktu wajib diisi.' : true
  const iso = wibInputToIso(value)
  if (!iso) return 'Masukkan tanggal dan jam yang valid.'
  const time = new Date(iso).getTime()
  if (time <= now.getTime()) return 'Pilih waktu yang belum lewat.'
  if (time > now.getTime() + ORDER_LIMITS.maxScheduleAheadDays * 86_400_000) {
    return 'Pilih waktu dalam satu tahun ke depan.'
  }
  return true
}

export function validateLongText(
  value: string,
  { required, label }: { required: boolean; label: string },
): string | true {
  const text = value.trim()
  if (text === '') return required ? `${label} wajib diisi.` : true
  if (text.length > ORDER_LIMITS.descriptionMaxLength) {
    return `${label} maksimal ${ORDER_LIMITS.descriptionMaxLength} karakter.`
  }
  return true
}

export const ACCEPTED_FILE_INPUT = UPLOAD_ACCEPTED_EXTENSIONS.map(
  (ext) => `.${ext}`,
).join(',')

const MIB = 1024 * 1024

export function formatFileSize(bytes: number): string {
  if (bytes >= MIB) return `${(bytes / MIB).toFixed(1).replace('.', ',')} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export const FILE_RULES_HINT = `PDF, DOCX, PPTX, XLSX, JPG, atau PNG. Maksimal ${UPLOAD_DEFAULT_LIMITS.maxFiles} file, ${UPLOAD_DEFAULT_LIMITS.maxFileBytes / MIB} MB per file, ${UPLOAD_DEFAULT_LIMITS.maxTotalBytes / MIB} MB total.`

// Client-side file checks (type by extension, count, sizes).
export function validateFiles(files: readonly File[]): string | null {
  if (files.length > UPLOAD_DEFAULT_LIMITS.maxFiles) {
    return `Maksimal ${UPLOAD_DEFAULT_LIMITS.maxFiles} file.`
  }
  let total = 0
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!(UPLOAD_ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
      return `“${file.name}” tidak didukung. Gunakan PDF, DOCX, PPTX, XLSX, JPG, atau PNG.`
    }
    if (file.size === 0) return `“${file.name}” kosong.`
    if (file.size > UPLOAD_DEFAULT_LIMITS.maxFileBytes) {
      return `“${file.name}” lebih dari ${UPLOAD_DEFAULT_LIMITS.maxFileBytes / MIB} MB.`
    }
    total += file.size
  }
  if (total > UPLOAD_DEFAULT_LIMITS.maxTotalBytes) {
    return `Total ukuran file lebih dari ${UPLOAD_DEFAULT_LIMITS.maxTotalBytes / MIB} MB.`
  }
  return null
}
