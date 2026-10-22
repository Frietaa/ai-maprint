// Whole Rupiah from an Admin input: "" → null, digits → number, anything
// else → NaN (rejected by the form; the API validates again).
export function parseWholeRupiah(value: string): number | null {
  const text = value.trim()
  if (text === '') return null
  return /^\d+$/.test(text) ? Number(text) : Number.NaN
}
