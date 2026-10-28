// MABA PRINTING logo — the single place the brand mark is rendered.
//
// The bundled horizontal logo (public/assets/logo.png) is the default; a
// logo configured by an Admin (business_settings.logo_ref) replaces it.
// The text mark remains as a fallback if no image source is given.
export const defaultLogoSrc = '/assets/logo.png'
interface LogoProps {
  name: string
  imageSrc?: string | null
}

export function Logo({ name, imageSrc }: LogoProps) {
  if (imageSrc) {
    // 782×181 source: the width/height attributes reserve the space (no
    // layout shift); CSS scales it to the header — smaller on phones.
    return (
      <img
        src={imageSrc}
        alt={name}
        width={782}
        height={181}
        decoding="async"
        className="h-9 w-auto sm:h-10 lg:h-11"
      />
    )
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
