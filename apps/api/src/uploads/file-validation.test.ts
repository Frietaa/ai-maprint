import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { AppError } from '../errors/app-error.js'
import { samples } from '../test/sample-files.js'
import { checkUploads, sanitizeOriginalName } from './file-validation.js'
import { DEFAULT_UPLOAD_LIMITS } from './upload-policy.js'

const dir = mkdtempSync(path.join(tmpdir(), 'maba-test-validation-'))
afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

let counter = 0
function received(content: Buffer, originalName: string, declaredMime = '') {
  counter += 1
  const file = path.join(dir, `f${counter}`)
  writeFileSync(file, content)
  return { path: file, originalName, declaredMime, size: content.length }
}

async function statusOf(promise: Promise<unknown>): Promise<number | 'ok'> {
  try {
    await promise
    return 'ok'
  } catch (error) {
    return error instanceof AppError ? error.status : -1
  }
}

describe('checkUploads', () => {
  it.each([
    ['a.pdf', samples.pdf, 'application/pdf', 'application/pdf'],
    ['b.PNG', samples.png, 'image/png', 'image/png'],
    ['c.jpg', samples.jpeg, 'image/jpeg', 'image/jpeg'],
    ['c.jpeg', samples.jpeg, '', 'image/jpeg'],
    [
      'd.docx',
      samples.docx,
      'application/octet-stream',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    [
      'e.pptx',
      samples.pptx,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    [
      'f.xlsx',
      samples.xlsx,
      '',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  ])('accepts %s by content', async (name, content, declared, stored) => {
    const [checked] = await checkUploads(
      [received(content, name, declared)],
      DEFAULT_UPLOAD_LIMITS,
    )
    expect(checked?.mimeType).toBe(stored)
    expect(checked?.originalName).toBe(name)
  })

  it.each([
    ['HTML renamed to .pdf', samples.html, 'report.pdf', 'application/pdf'],
    ['executable renamed to .docx', samples.exe, 'tugas.docx', ''],
    ['plain ZIP renamed to .docx', samples.plainZip, 'tugas.docx', ''],
    ['macro-enabled document as .docx', samples.docm, 'tugas.docx', ''],
    ['DOCX content named .xlsx', samples.docx, 'data.xlsx', ''],
    ['PNG content named .pdf', samples.png, 'scan.pdf', ''],
    ['an HTML file', samples.html, 'page.html', 'text/html'],
    ['a ZIP archive', samples.plainZip, 'files.zip', 'application/zip'],
    ['a file without extension', samples.pdf, 'document', ''],
    ['a contradicting declared MIME', samples.pdf, 'a.pdf', 'text/html'],
  ])('rejects %s with 415', async (_label, content, name, declared) => {
    expect(
      await statusOf(
        checkUploads(
          [received(content, name, declared)],
          DEFAULT_UPLOAD_LIMITS,
        ),
      ),
    ).toBe(415)
  })

  it('rejects empty files', async () => {
    expect(
      await statusOf(
        checkUploads(
          [received(Buffer.alloc(0), 'a.pdf')],
          DEFAULT_UPLOAD_LIMITS,
        ),
      ),
    ).toBe(400)
  })

  it('enforces the aggregate size', async () => {
    const limits = {
      ...DEFAULT_UPLOAD_LIMITS,
      maxTotalBytes: samples.pdf.length + 1,
    }
    expect(
      await statusOf(
        checkUploads(
          [received(samples.pdf, 'a.pdf'), received(samples.pdf, 'b.pdf')],
          limits,
        ),
      ),
    ).toBe(413)
  })
})

describe('sanitizeOriginalName', () => {
  it.each([
    ['../../etc/passwd.pdf', 'passwd.pdf'],
    ['C:\\Users\\x\\Tugas Akhir.docx', 'Tugas Akhir.docx'],
    ['/abs/path/scan.png', 'scan.png'],
    ['na\u0000me\n.pdf', 'name.pdf'],
    ['   ', 'dokumen'],
    ['', 'dokumen'],
  ])('%j → %j', (raw, expected) => {
    expect(sanitizeOriginalName(raw)).toBe(expected)
  })

  it('bounds the length but keeps the extension', () => {
    const name = sanitizeOriginalName(`${'a'.repeat(300)}.pdf`)
    expect(name).toHaveLength(200)
    expect(name.endsWith('.pdf')).toBe(true)
  })
})
