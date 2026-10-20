// MABA PRINTING static brand configuration (Architecture §44).
//
// Only static, non-operational values belong here. The live business name,
// WhatsApp number, logo reference, social links and public information come
// from the database through GET /api/v1/public/settings (KI-011); the values
// below are display fallbacks used while settings load or when they are not
// configured.
export const brand = {
  fallbackName: 'MABA PRINTING',
  tagline: 'Cetak dokumen, ATK, service laptop, dan instalasi software',
} as const
