// One-time notice passed in router location state, e.g.
// navigate('/account', { state: { notice: 'Akun berhasil dibuat.' } }).
export function noticeFrom(state: unknown): string | null {
  if (typeof state === 'object' && state !== null && 'notice' in state) {
    return typeof state.notice === 'string' ? state.notice : null
  }
  return null
}
