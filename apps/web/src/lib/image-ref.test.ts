import { describe, expect, it } from 'vitest'
import { resolveImageRef } from './image-ref.ts'

describe('resolveImageRef', () => {
  it.each([
    ['https://cdn.example.test/logo.png', 'https://cdn.example.test/logo.png'],
    ['/brand/logo.png', '/brand/logo.png'],
    [' /brand/logo.png ', '/brand/logo.png'],
  ])('accepts %s', (ref, expected) => {
    expect(resolveImageRef(ref)).toBe(expected)
  })

  it.each([
    null,
    undefined,
    '',
    'dev/placeholder-logo.png',
    'http://example.test/logo.png',
    '//evil.example.test/x.png',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
  ])('rejects %s', (ref) => {
    expect(resolveImageRef(ref)).toBeNull()
  })
})
