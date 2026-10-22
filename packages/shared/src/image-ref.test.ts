import { describe, expect, it } from 'vitest'
import { safeImageRef } from './image-ref.js'

describe('safeImageRef', () => {
  it.each([
    ['https://cdn.example.test/qris.png', 'https://cdn.example.test/qris.png'],
    [
      'https://cdn.example.test/a/b.png?v=2',
      'https://cdn.example.test/a/b.png?v=2',
    ],
    ['/brand/qris.png', '/brand/qris.png'],
    [' /brand/logo.png ', '/brand/logo.png'],
  ])('accepts %s', (ref, expected) => {
    expect(safeImageRef(ref)).toBe(expected)
  })

  it.each([
    null,
    undefined,
    '',
    '   ',
    'dev/placeholder-logo.png',
    'http://example.test/qris.png',
    '//evil.example.test/x.png',
    '/\\evil.example.test/x.png',
    '/brand/../admin.png',
    '/brand/my qris.png',
    'https://user:pass@example.test/x.png',
    'https:///x.png',
    'https://example.test\\x.png',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
  ])('rejects %s', (ref) => {
    expect(safeImageRef(ref)).toBeNull()
  })
})
