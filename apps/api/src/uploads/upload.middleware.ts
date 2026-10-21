// multipart/form-data reader for POST /orders (printing documents).
//
// Fields: `payload` (the order JSON, validated exactly like a JSON order)
// and `files` (documents). multer streams each file to a private temporary
// directory under a random name (never the original name), enforcing count,
// per-file size, field size and part limits while reading — nothing is
// buffered in memory. Temporary files are deleted when the response ends,
// whatever the outcome; stored copies are made by the order service.
// Other content types pass through untouched (JSON orders).
import { randomBytes } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { ORDER_MULTIPART_FIELDS } from '@maba-printing/shared'
import type { Request, RequestHandler } from 'express'
import multer from 'multer'
import { AppError, ValidationError } from '../errors/app-error.js'
import { parseBody } from '../validators/body.js'
import { createOrderSchema } from '../validators/order.validator.js'
import { checkUploads, type ReceivedFile } from './file-validation.js'
import {
  MULTIPART_PAYLOAD_MAX_BYTES,
  type UploadLimits,
} from './upload-policy.js'

export interface OrderMultipartOptions {
  // Private temporary directory (created by the caller).
  tempDir: string
  limits: UploadLimits
}

// Allowance for multipart boundaries and part headers.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024

function toReceived(req: Request): ReceivedFile[] {
  const files = req.files
  const list = Array.isArray(files)
    ? files
    : (files?.[ORDER_MULTIPART_FIELDS.files] ?? [])
  return list.map((file) => ({
    path: file.path,
    originalName: file.originalname,
    declaredMime: file.mimetype,
    size: file.size,
  }))
}

function mapMulterError(error: unknown): Error {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return new AppError(413, 'Payload too large', {
          files: ['File is too large'],
        })
      case 'LIMIT_FIELD_VALUE':
        return new AppError(413, 'Payload too large')
      case 'LIMIT_FILE_COUNT':
        return new ValidationError({ files: ['Too many files'] })
      case 'LIMIT_UNEXPECTED_FILE':
        return new ValidationError({ files: ['Unexpected file field'] })
      default:
        return new ValidationError({ body: ['Invalid multipart request'] })
    }
  }
  return new ValidationError({ body: ['Invalid multipart request'] })
}

function parsePayload(body: unknown) {
  const fields =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {}
  const unknown = Object.keys(fields).filter(
    (key) => key !== ORDER_MULTIPART_FIELDS.payload,
  )
  if (unknown.length > 0) {
    throw new ValidationError(
      Object.fromEntries(unknown.map((key) => [key, ['Unknown field']])),
    )
  }
  const raw = fields[ORDER_MULTIPART_FIELDS.payload]
  if (typeof raw !== 'string') {
    throw new ValidationError({ payload: ['Order payload is required'] })
  }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    throw new ValidationError({ payload: ['Order payload must be JSON'] })
  }
  return parseBody(createOrderSchema, json)
}

export function createOrderMultipart({
  tempDir,
  limits,
}: OrderMultipartOptions): RequestHandler {
  const upload = multer({
    storage: multer.diskStorage({
      destination: tempDir,
      filename: (_req, _file, done) => {
        done(null, randomBytes(16).toString('hex'))
      },
    }),
    defParamCharset: 'utf8',
    limits: {
      files: limits.maxFiles,
      fileSize: limits.maxFileBytes,
      fields: 1,
      fieldSize: MULTIPART_PAYLOAD_MAX_BYTES,
      fieldNameSize: 32,
      parts: limits.maxFiles + 1,
      headerPairs: 20,
    },
  }).fields([{ name: ORDER_MULTIPART_FIELDS.files, maxCount: limits.maxFiles }])

  const maxDeclaredBytes =
    limits.maxTotalBytes +
    MULTIPART_PAYLOAD_MAX_BYTES +
    MULTIPART_OVERHEAD_BYTES

  return (req, res, next) => {
    if (!req.is('multipart/form-data')) {
      next()
      return
    }
    // Early refusal of obviously oversized requests. Content-Length is not
    // trusted on its own: the stream limits above still apply.
    const declared = Number(req.get('content-length'))
    if (Number.isFinite(declared) && declared > maxDeclaredBytes) {
      next(new AppError(413, 'Payload too large'))
      return
    }

    upload(req, res, (error: unknown) => {
      const received = toReceived(req)
      res.once('close', () => {
        void Promise.allSettled(
          received.map((file) => rm(file.path, { force: true })),
        )
      })
      if (error) {
        next(mapMulterError(error))
        return
      }
      void (async () => {
        const input = parsePayload(req.body)
        const uploads = await checkUploads(received, limits)
        req.orderSubmission = { input, uploads }
      })().then(() => next(), next)
    })
  }
}
