// Upload policy for printing documents (PRD §9, Architecture §35): the
// allowed types and the limits, in one place. Types are code configuration
// (not a database enum); count and per-file size come from UPLOAD_MAX_FILES
// / UPLOAD_MAX_FILE_SIZE within hard caps.
import { UPLOAD_DEFAULT_LIMITS } from '@maba-printing/shared'

export interface AllowedFileType {
  // Canonical MIME type stored in order_files.mime_type.
  mime: string
  // Lowercase filename extensions mapping to this type.
  extensions: readonly string[]
  // MIME types browsers may declare for it (besides an empty value or
  // application/octet-stream, which say nothing).
  declaredMimes: readonly string[]
  // `ext` reported by file-type for the detected content.
  detected: string
}

export const ALLOWED_FILE_TYPES: readonly AllowedFileType[] = [
  {
    mime: 'application/pdf',
    extensions: ['pdf'],
    declaredMimes: ['application/pdf', 'application/x-pdf'],
    detected: 'pdf',
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['docx'],
    declaredMimes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    detected: 'docx',
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extensions: ['pptx'],
    declaredMimes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    detected: 'pptx',
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['xlsx'],
    declaredMimes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    detected: 'xlsx',
  },
  {
    mime: 'image/jpeg',
    extensions: ['jpg', 'jpeg'],
    declaredMimes: ['image/jpeg', 'image/jpg', 'image/pjpeg'],
    detected: 'jpg',
  },
  {
    mime: 'image/png',
    extensions: ['png'],
    declaredMimes: ['image/png'],
    detected: 'png',
  },
]

export interface UploadLimits {
  maxFiles: number
  maxFileBytes: number
  // Sum of all files of one order.
  maxTotalBytes: number
}

const MIB = 1024 * 1024

// Shared with the web forms (packages/shared).
export const DEFAULT_UPLOAD_LIMITS: UploadLimits = { ...UPLOAD_DEFAULT_LIMITS }

// Hard caps that configuration cannot exceed.
export const UPLOAD_HARD_CAPS = {
  maxFiles: 10,
  maxFileBytes: 25 * MIB,
} as const

// The JSON `payload` field of a multipart order (same bound as JSON orders).
export const MULTIPART_PAYLOAD_MAX_BYTES = 64 * 1024

export function parseUploadLimits(
  maxFilesRaw: string | undefined,
  maxFileBytesRaw: string | undefined,
): UploadLimits {
  const maxFiles = parseBounded(
    'UPLOAD_MAX_FILES',
    maxFilesRaw,
    DEFAULT_UPLOAD_LIMITS.maxFiles,
    UPLOAD_HARD_CAPS.maxFiles,
  )
  const maxFileBytes = parseBounded(
    'UPLOAD_MAX_FILE_SIZE',
    maxFileBytesRaw,
    DEFAULT_UPLOAD_LIMITS.maxFileBytes,
    UPLOAD_HARD_CAPS.maxFileBytes,
  )
  return {
    maxFiles,
    maxFileBytes,
    maxTotalBytes: Math.max(DEFAULT_UPLOAD_LIMITS.maxTotalBytes, maxFileBytes),
  }
}

function parseBounded(
  name: string,
  raw: string | undefined,
  fallback: number,
  cap: number,
): number {
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!/^\d+$/.test(raw) || value < 1 || value > cap) {
    throw new Error(`Invalid ${name}: expected an integer between 1 and ${cap}`)
  }
  return value
}
