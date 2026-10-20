import { describe, expect, it } from 'vitest'
import { parseOpeningHours } from './opening-hours.js'

const closedRest = { wed: [], thu: [], fri: [], sat: [], sun: [] }

describe('parseOpeningHours', () => {
  it('normalizes the documented shape, keeping split shifts and the note', () => {
    const result = parseOpeningHours({
      weekly: {
        mon: [
          { open: '13:00', close: '16:00' },
          { open: '07:30', close: '12:00' },
        ],
        tue: [{ open: '08:00', close: '24:00' }],
        ...closedRest,
      },
      note: '  Libur nasional tutup  ',
    })

    expect(result).toEqual({
      weekly: {
        mon: [
          { open: '07:30', close: '12:00' },
          { open: '13:00', close: '16:00' },
        ],
        tue: [{ open: '08:00', close: '24:00' }],
        ...closedRest,
      },
      note: 'Libur nasional tutup',
    })
  })

  it('distinguishes a closed day ([]) from a missing day (null)', () => {
    const result = parseOpeningHours({ weekly: { mon: [] } })

    expect(result?.weekly.mon).toEqual([])
    expect(result?.weekly.tue).toBeNull()
    expect(result?.note).toBeNull()
  })

  it('drops invalid ranges and marks a day with only invalid ranges unknown', () => {
    const result = parseOpeningHours({
      weekly: {
        mon: [
          { open: '08:00', close: '17:00' },
          { open: '25:00', close: '26:00' },
        ],
        tue: [{ open: '17:00', close: '08:00' }],
        wed: [{ open: 8, close: 17 }],
        thu: 'closed',
      },
    })

    expect(result?.weekly.mon).toEqual([{ open: '08:00', close: '17:00' }])
    expect(result?.weekly.tue).toBeNull()
    expect(result?.weekly.wed).toBeNull()
    expect(result?.weekly.thu).toBeNull()
  })

  it.each([null, undefined, 'x', 42, [], {}, { weekly: [] }, { weekly: null }])(
    'returns null for malformed input %j',
    (value) => {
      expect(parseOpeningHours(value)).toBeNull()
    },
  )
})
