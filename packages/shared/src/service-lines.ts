// The three service-based business lines (PRD §2) and how service
// categories map to them. service_categories has no business-line column
// (KI-013; adding one is a schema decision for the owner), so a category
// belongs to a line when its name contains one of the line's keywords. This
// is the single definition: the public service pages group by it and the
// Admin services page shows each category's lines, so a rename that breaks
// the mapping is visible immediately.
export const SERVICE_LINES = [
  'printing',
  'laptop-service',
  'software-installation',
] as const
export type ServiceLine = (typeof SERVICE_LINES)[number]

export const SERVICE_LINE_LABELS: Record<ServiceLine, string> = {
  printing: 'Printing',
  'laptop-service': 'Service Laptop',
  'software-installation': 'Instalasi Software',
}

export const SERVICE_LINE_KEYWORDS: Record<ServiceLine, readonly string[]> = {
  printing: ['print', 'cetak', 'fotokopi', 'fotocopy', 'jilid', 'scan'],
  'laptop-service': ['laptop', 'komputer', 'notebook'],
  'software-installation': [
    'software',
    'instal',
    'aplikasi',
    'perangkat lunak',
  ],
}

export function categoryMatchesLine(
  categoryName: string,
  line: ServiceLine,
): boolean {
  const name = categoryName.toLocaleLowerCase('id-ID')
  return SERVICE_LINE_KEYWORDS[line].some((keyword) => name.includes(keyword))
}

// Every line whose page shows the category; [] = only the full-catalog
// fallback of the service pages shows it.
export function serviceLinesForCategory(categoryName: string): ServiceLine[] {
  return SERVICE_LINES.filter((line) => categoryMatchesLine(categoryName, line))
}
