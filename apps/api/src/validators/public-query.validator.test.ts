import { describe, expect, it } from 'vitest'
import { ValidationError } from '../errors/app-error.js'
import {
  noQuerySchema,
  productListQuerySchema,
  serviceListQuerySchema,
} from './public-query.validator.js'
import { parseQuery } from './query.js'

const id = '5eed0000-0000-4000-8000-000000000101'

function errorsOf(run: () => unknown) {
  try {
    run()
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationError)
    return (error as ValidationError).errors
  }
  throw new Error('expected a ValidationError')
}

describe('public query validation', () => {
  it('accepts valid filters', () => {
    expect(
      parseQuery(serviceListQuerySchema, { categoryId: id, locationId: id }),
    ).toStrictEqual({ categoryId: id, locationId: id, page: 1, pageSize: 100 })
    expect(
      parseQuery(productListQuerySchema, { availability: 'UNAVAILABLE' }),
    ).toStrictEqual({ availability: 'UNAVAILABLE', page: 1, pageSize: 100 })
  })

  it('bounds catalog pages', () => {
    expect(
      parseQuery(productListQuerySchema, { page: '3', pageSize: '20' }),
    ).toMatchObject({ page: 3, pageSize: 20 })
    for (const query of [
      { page: '0' },
      { page: '1.5' },
      { page: 'x' },
      { pageSize: '0' },
      { pageSize: '101' },
      { page: '10001' },
    ]) {
      expect(() => parseQuery(serviceListQuerySchema, query)).toThrow()
    }
    expect(parseQuery(noQuerySchema, {})).toStrictEqual({})
  })

  it('rejects malformed UUIDs per field', () => {
    expect(
      errorsOf(() => parseQuery(serviceListQuerySchema, { categoryId: 'abc' })),
    ).toStrictEqual({ categoryId: ['Must be a valid UUID'] })
  })

  it('rejects unknown parameters, including an activeOnly escape hatch', () => {
    expect(
      errorsOf(() =>
        parseQuery(productListQuerySchema, { activeOnly: 'false' }),
      ),
    ).toStrictEqual({ activeOnly: ['Unknown query parameter'] })
    expect(errorsOf(() => parseQuery(noQuerySchema, { x: '1' }))).toStrictEqual(
      { x: ['Unknown query parameter'] },
    )
  })

  it('rejects repeated parameters and invalid enum values', () => {
    const errors = errorsOf(() =>
      parseQuery(productListQuerySchema, {
        categoryId: [id, id],
        availability: 'SOLD_OUT',
      }),
    )
    expect(Object.keys(errors ?? {}).sort()).toStrictEqual([
      'availability',
      'categoryId',
    ])
    expect(errors?.availability).toStrictEqual([
      'Must be AVAILABLE or UNAVAILABLE',
    ])
  })
})
