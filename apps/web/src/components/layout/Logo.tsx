// MABA PRINTING logo — the single place the brand mark is rendered.
//
// Until the owner's logo asset is configured (business_settings.logo_ref),
// a simple text mark is shown. To use a bundled file instead, add it under
// src/assets/brand/ and pass it as `imageSrc`.
interface LogoProps {
  name: string
  imageSrc?: string | null
}

export function Logo({ name, imageSrc }: LogoProps) {
  if (imageSrc) {
    return <img src={imageSrc} alt={name} className="h-9 w-auto" />
  }
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white"
      >
        {initials(name)}
      </span>
      <span className="text-base font-semibold tracking-tight text-slate-900">
        {name}
      </span>
    </span>
  )
}

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
  return letters || 'M'
}
