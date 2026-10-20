import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OpeningHours } from './OpeningHours.tsx'

function hoursFor(day: string): string | null | undefined {
  const term = screen.getByText(day, { selector: 'dt' })
  return term.nextElementSibling?.textContent
}

describe('OpeningHours', () => {
  it('renders Indonesian day labels, split shifts and closed days', () => {
    render(
      <OpeningHours
        value={{
          weekly: {
            mon: [
              { open: '13:00', close: '16:00' },
              { open: '07:30', close: '12:00' },
            ],
            tue: [{ open: '08:00', close: '17:00' }],
            wed: [],
            thu: [],
            fri: [],
            sat: [],
            sun: [],
          },
          note: 'Tutup pada hari libur nasional.',
        }}
      />,
    )

    expect(hoursFor('Senin')).toBe('07.30–12.00, 13.00–16.00')
    expect(hoursFor('Selasa')).toBe('08.00–17.00')
    expect(hoursFor('Minggu')).toBe('Tutup')
    expect(
      screen.getByText('Tutup pada hari libur nasional.'),
    ).toBeInTheDocument()
  })

  it('marks days without information instead of claiming they are closed', () => {
    render(<OpeningHours value={{ weekly: { mon: [] } }} />)

    expect(hoursFor('Senin')).toBe('Tutup')
    expect(hoursFor('Selasa')).toBe('Tidak ada informasi')
  })

  it.each([null, 'Senin-Jumat 08.00-17.00', { weekly: 'x' }, 42])(
    'degrades gracefully for %j',
    (value) => {
      render(<OpeningHours value={value} />)
      expect(screen.getByText('Jam buka belum tersedia.')).toBeInTheDocument()
    },
  )
})
