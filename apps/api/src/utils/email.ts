// The one email normalization used by registration, login and Google
// Sign-In (KI-008): surrounding whitespace removed, then lowercased with the
// locale-independent String#toLowerCase. Inner characters are not altered.
// users_email_lower_key (UNIQUE lower(email)) remains the database backstop.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
