// Google Identity Services (GIS) integration without a wrapper package.
// The GIS script renders Google's own button; its callback hands us an ID
// token ("credential") that is sent to the API for server-side
// verification. The browser never decodes it or treats it as proof.
export const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

export interface GoogleCredentialResponse {
  credential?: string
}

// The subset of the GIS API used here.
export interface GoogleAccountsId {
  initialize(config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode?: 'popup' | 'redirect'
    context?: 'signin' | 'signup' | 'use'
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }): void
  renderButton(
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with'
      shape?: 'rectangular' | 'pill'
      logo_alignment?: 'left' | 'center'
      width?: number
      locale?: string
    },
  ): void
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } }
  }
}

// The Google OAuth client ID (public), or null when Google Sign-In is not
// configured for this build.
export function googleClientId(): string | null {
  const value = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
  return value ? value : null
}

let loading: Promise<GoogleAccountsId> | null = null

// Loads the GIS script once per page.
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  const existing = window.google?.accounts?.id
  if (existing) return Promise.resolve(existing)

  loading ??= new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      const id = window.google?.accounts?.id
      if (id) resolve(id)
      else reject(new Error('Google Identity Services unavailable'))
    }
    script.onerror = () => {
      reject(new Error('Google Identity Services failed to load'))
    }
    document.head.append(script)
  }).catch((error: unknown) => {
    loading = null
    throw error
  })
  return loading
}
