// PRINTING orders with private files (TASK-04.03): multipart POST /orders,
// content validation, private storage and compensation. Test database and
// an isolated temporary storage root only.
import { CSRF_HEADER } from '@maba-printing/shared'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { OrderOptions } from '../app.js'
import type { StorageService } from '../storage/storage-service.js'
import {
  createOrderTestApp,
  csrfTokenOf,
  customer,
  inDays,
  pendingUploads,
  storedFiles,
  testDb,
  testStorage,
} from '../test/order-db.js'
import { samples } from '../test/sample-files.js'

const path = '/api/v1/orders'

afterEach(() => {
  vi.restoreAllMocks()
})

function payload(extra: Record<string, unknown> = {}) {
  return JSON.stringify({
    type: 'PRINTING',
    ...customer,
    requestedCompletionAt: inDays(2),
    ...extra,
  })
}

interface Attachment {
  field?: string
  content: Buffer
  filename: string
  contentType?: string
}

async function submit(
  attachments: Attachment[],
  {
    body = payload(),
    orders,
    extraFields = {},
  }: {
    body?: string | null
    orders?: Partial<OrderOptions>
    extraFields?: Record<string, string>
  } = {},
) {
  const agent = request.agent(createOrderTestApp({ orders }))
  const token = csrfTokenOf(await agent.get('/api/v1/auth/csrf'))
  let req = agent.post(path).set(CSRF_HEADER, token)
  if (body !== null) req = req.field('payload', body)
  for (const [name, value] of Object.entries(extraFields)) {
    req = req.field(name, value)
  }
  for (const file of attachments) {
    req = req.attach(file.field ?? 'files', file.content, {
      filename: file.filename,
      contentType: file.contentType ?? 'application/octet-stream',
    })
  }
  const response = await req
  // Temporary files are removed when the response closes.
  await new Promise((resolve) => setTimeout(resolve, 50))
  return response
}

async function expectNothingLeft() {
  expect(await testDb.order.count()).toBe(0)
  expect(await testDb.orderFile.count()).toBe(0)
  expect(await storedFiles()).toStrictEqual([])
  expect(await pendingUploads()).toStrictEqual([])
}

describe('PRINTING with files', () => {
  it('stores validated files privately and records metadata only', async () => {
    const response = await submit(
      [
        {
          content: samples.pdf,
          filename: 'Tugas Akhir.pdf',
          contentType: 'application/pdf',
        },
        { content: samples.docx, filename: '../../Makalah.docx' },
      ],
      { body: payload({ description: 'Cetak bolak-balik' }) },
    )

    expect(response.status).toBe(201)
    expect(response.text).not.toMatch(/storageKey|orders\/|Makalah|Tugas/)
    const files = await testDb.orderFile.findMany({
      orderBy: { originalName: 'asc' },
    })
    expect(
      files.map((file) => [file.originalName, file.mimeType, file.sizeBytes]),
    ).toStrictEqual([
      [
        'Makalah.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        samples.docx.length,
      ],
      ['Tugas Akhir.pdf', 'application/pdf', samples.pdf.length],
    ])
    for (const file of files) {
      expect(file.storageKey).toMatch(/^orders\/[0-9a-f]{32}$/)
      expect(file.storageKey).not.toContain('Makalah')
      expect(await testStorage.exists(file.storageKey)).toBe(true)
    }
    expect(await storedFiles()).toHaveLength(2)
    expect(await pendingUploads()).toStrictEqual([])
  })

  it('accepts files without a description', async () => {
    const response = await submit([
      { content: samples.png, filename: 'scan.png' },
    ])
    expect(response.status).toBe(201)
  })

  it('accepts a printing request without files when it has a description', async () => {
    const response = await submit([], {
      body: payload({ description: 'Detail via WhatsApp' }),
    })
    expect(response.status).toBe(201)
  })

  it('needs a description or a file', async () => {
    const response = await submit([])
    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      errors: { description: expect.any(Array) as unknown },
    })
    await expectNothingLeft()
  })
})

describe('upload rejections', () => {
  it.each([
    ['HTML disguised as PDF', samples.html, 'tugas.pdf', 'application/pdf'],
    ['an executable disguised as DOCX', samples.exe, 'tugas.docx', ''],
    ['a ZIP archive', samples.plainZip, 'semua.zip', 'application/zip'],
    ['a macro-enabled document', samples.docm, 'tugas.docx', ''],
  ])(
    'refuses %s with 415 and keeps nothing',
    async (_label, content, filename, contentType) => {
      const response = await submit([
        { content: samples.pdf, filename: 'ok.pdf' },
        { content, filename, contentType },
      ])
      expect(response.status).toBe(415)
      expect(response.body).toStrictEqual({
        message: 'Unsupported file type',
        errors: { 'files.1': ['Unsupported file type'] },
      })
      await expectNothingLeft()
    },
  )

  it('refuses a file over the per-file limit with 413', async () => {
    const response = await submit(
      [
        {
          content: Buffer.concat([samples.pdf, Buffer.alloc(500)]),
          filename: 'big.pdf',
        },
      ],
      {
        orders: {
          uploadLimits: { maxFiles: 5, maxFileBytes: 200, maxTotalBytes: 1000 },
        },
      },
    )
    expect(response.status).toBe(413)
    expect(response.body).toMatchObject({ message: 'Payload too large' })
    await expectNothingLeft()
  })

  it('refuses more files than allowed', async () => {
    const response = await submit(
      [1, 2, 3].map((n) => ({ content: samples.pdf, filename: `${n}.pdf` })),
      {
        orders: {
          uploadLimits: {
            maxFiles: 2,
            maxFileBytes: 1000,
            maxTotalBytes: 5000,
          },
        },
      },
    )
    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      errors: { files: ['Too many files'] },
    })
    await expectNothingLeft()
  })

  it('refuses files for non-printing orders', async () => {
    const response = await submit(
      [{ content: samples.pdf, filename: 'a.pdf' }],
      {
        body: payload({
          type: 'SOFTWARE_INSTALLATION',
          softwareName: 'LibreOffice',
          licenseAcknowledged: true,
        }),
      },
    )
    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      errors: { files: ['Files are only accepted for printing orders'] },
    })
    await expectNothingLeft()
  })

  it.each([
    [
      'an unexpected file field',
      {
        attachments: [
          { field: 'attachment', content: samples.pdf, filename: 'a.pdf' },
        ],
      },
    ],
    ['a missing payload', { body: null }],
    ['a payload that is not JSON', { body: '{"type":' }],
    ['an extra text field', { extraFields: { userId: 'x' } }],
    [
      'a privileged payload field',
      { body: payload({ status: 'COMPLETED', description: 'x' }) },
    ],
  ])('refuses %s with 400', async (_label, variant) => {
    const { attachments = [], ...options } = variant as {
      attachments?: Attachment[]
      body?: string | null
      extraFields?: Record<string, string>
    }
    const response = await submit(attachments, options)
    expect(response.status).toBe(400)
    await expectNothingLeft()
  })
})

describe('storage compensation', () => {
  it('deletes stored files when the database write fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await submit(
      [
        { content: samples.pdf, filename: 'a.pdf' },
        { content: samples.png, filename: 'b.png' },
      ],
      { orders: { generatePublicId: () => `MP-2026-${'X'.repeat(40)}` } },
    )
    expect(response.status).toBe(500)
    await expectNothingLeft()
  })

  it('deletes the files already stored when storage fails midway', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    let puts = 0
    const flaky: StorageService = {
      ...testStorage,
      put: (key, source) => {
        puts += 1
        return puts === 2
          ? Promise.reject(new Error('disk full'))
          : testStorage.put(key, source)
      },
    }
    const response = await submit(
      [
        { content: samples.pdf, filename: 'a.pdf' },
        { content: samples.png, filename: 'b.png' },
      ],
      { orders: { storage: flaky } },
    )
    expect(response.status).toBe(500)
    expect(response.text).not.toMatch(/disk full/)
    await expectNothingLeft()
  })

  it('logs keys only when compensation itself fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const undeletable: StorageService = {
      ...testStorage,
      delete: () => Promise.reject(new Error('permission denied')),
    }
    const response = await submit(
      [{ content: samples.pdf, filename: 'Rahasia Pribadi.pdf' }],
      {
        orders: {
          storage: undeletable,
          generatePublicId: () => `MP-2026-${'X'.repeat(40)}`,
        },
      },
    )
    expect(response.status).toBe(500)
    const lines = log.mock.calls.map((call) => call.join(' '))
    const compensation = lines.find((line) =>
      line.includes('compensation failed'),
    )
    expect(compensation).toMatch(/1 stored file\(s\): orders\/[0-9a-f]{32}$/)
    expect(lines.join('\n')).not.toMatch(
      /Rahasia|\.local-storage|maba-test-storage/,
    )
    // Clean up the file the failing adapter could not delete.
    for (const name of await storedFiles()) {
      await testStorage.delete(`orders/${name}`)
    }
  })
})
