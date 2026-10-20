import { describe, expect, it } from 'vitest'
import * as shared from './index.js'

describe('@maba-printing/shared entry point', () => {
  it('loads as an ES module', () => {
    expect(typeof shared).toBe('object')
  })
})
