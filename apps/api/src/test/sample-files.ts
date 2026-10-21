// Minimal, genuine sample documents for upload tests: real signatures for
// PDF/PNG/JPEG and real (stored, uncompressed) ZIP containers with an OOXML
// [Content_Types].xml for DOCX/PPTX/XLSX. Synthetic content only.
import { crc32 } from 'node:zlib'

interface ZipEntry {
  name: string
  data: string
}

// Builds a ZIP archive with STORED entries (no compression).
export function zip(entries: readonly ZipEntry[]): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const data = Buffer.from(entry.data, 'utf8')
    const crc = crc32(data)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0, 6) // flags
    local.writeUInt16LE(0, 8) // method: stored
    local.writeUInt32LE(0, 10) // time/date
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    locals.push(local, name, data)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt32LE(0, 12)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt32LE(offset, 42)
    centrals.push(central, name)

    offset += local.length + name.length + data.length
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, ...centrals, end])
}

function ooxml(mainPart: string, contentType: string, dir: string): Buffer {
  return zip([
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/${mainPart}" ContentType="${contentType}"/></Types>`,
    },
    { name: mainPart, data: `<root>${dir}</root>` },
  ])
}

export const samples = {
  pdf: Buffer.from(
    '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n',
  ),
  png: Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('0000000d49484452000000010000000108060000001f15c489', 'hex'),
  ]),
  jpeg: Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
    Buffer.from('JFIF\0\x01\x01\0\0\x01\0\x01\0\0', 'latin1'),
    Buffer.from([0xff, 0xd9]),
  ]),
  docx: ooxml(
    'word/document.xml',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
    'word',
  ),
  pptx: ooxml(
    'ppt/presentation.xml',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml',
    'ppt',
  ),
  xlsx: ooxml(
    'xl/workbook.xml',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
    'xl',
  ),
  // Macro-enabled Word document: an OOXML container, but not an allowed type.
  docm: ooxml(
    'word/document.xml',
    'application/vnd.ms-word.document.macroEnabled.main+xml',
    'word',
  ),
  plainZip: zip([{ name: 'notes.txt', data: 'hello' }]),
  html: Buffer.from('<!doctype html><html><script>alert(1)</script></html>'),
  exe: Buffer.concat([Buffer.from('MZ'), Buffer.alloc(64)]),
}
