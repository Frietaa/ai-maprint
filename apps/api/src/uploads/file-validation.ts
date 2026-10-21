// Validation of uploaded printing documents (Architecture §35: "do not trust
// extension alone"). A file is accepted only when its extension, the MIME
// type the browser declared (if it declared a meaningful one) and the type
// detected from its content all agree on one allowed type. Detection uses
// file-type: magic bytes for PDF/JPEG/PNG; for DOCX/PPTX/XLSX it parses the
// ZIP container's [Content_Types].xml, so a plain ZIP, a macro-enabled
// document (docm, …) or an HTML/script file renamed to .docx is rejected.
import { fileTypeFromFile } from 'file-type'
import { AppError, ValidationError } from '../errors/app-error.js'
import {
  ALLOWED_FILE_TYPES,
  type AllowedFileType,
  type UploadLimits,
} from './upload-policy.js'

export interface ReceivedFile {
  // Private temporary file written by the multipart reader.
  path: string
  // Client-supplied name (untrusted).
  originalName: string
  // Client-declared MIME type (untrusted).
  declaredMime: string
  size: number
}

export interface CheckedFile {
  tempPath: string
  originalName: string
  mimeType: string
  sizeBytes: number
}

export const UNSUPPORTED_FILE_MESSAGE = 'Unsupported file type'

const UNINFORMATIVE_MIMES = new Set(['', 'application/octet-stream'])
const MAX_NAME_LENGTH = 200

// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g

// Display-only metadata: the last path segment, Unicode-normalized, without
// control characters, at most 200 characters (keeping the extension). It is
// never used to build a storage path.
export function sanitizeOriginalName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? ''
  const clean = base.normalize('NFC').replace(CONTROL_CHARACTERS, '').trim()
  if (clean.length <= MAX_NAME_LENGTH) return clean || 'dokumen'
  const dot = clean.lastIndexOf('.')
  const extension = dot > 0 && clean.length - dot <= 10 ? clean.slice(dot) : ''
  return clean.slice(0, MAX_NAME_LENGTH - extension.length) + extension
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

function typeForExtension(extension: string): AllowedFileType | undefined {
  return ALLOWED_FILE_TYPES.find((type) => type.extensions.includes(extension))
}

export async function checkUploads(
  files: readonly ReceivedFile[],
  limits: UploadLimits,
): Promise<CheckedFile[]> {
  if (files.length > limits.maxFiles) {
    throw new ValidationError({ files: ['Too many files'] })
  }
  const total = files.reduce((sum, file) => sum + file.size, 0)
  if (total > limits.maxTotalBytes) {
    throw new AppError(413, 'Payload too large', {
      files: ['Files are too large in total'],
    })
  }

  const checked: CheckedFile[] = []
  for (const [index, file] of files.entries()) {
    const field = `files.${index}`
    if (file.size <= 0) {
      throw new ValidationError({ [field]: ['File is empty'] })
    }
    const name = sanitizeOriginalName(file.originalName)
    const type = typeForExtension(extensionOf(name))
    const declared = file.declaredMime.trim().toLowerCase()
    const declaredOk =
      UNINFORMATIVE_MIMES.has(declared) ||
      (type?.declaredMimes.includes(declared) ?? false)
    const detected =
      type && declaredOk ? await fileTypeFromFile(file.path) : undefined
    if (!type || !declaredOk || detected?.ext !== type.detected) {
      throw new AppError(415, UNSUPPORTED_FILE_MESSAGE, {
        [field]: [UNSUPPORTED_FILE_MESSAGE],
      })
    }
    checked.push({
      tempPath: file.path,
      originalName: name,
      mimeType: type.mime,
      sizeBytes: file.size,
    })
  }
  return checked
}
