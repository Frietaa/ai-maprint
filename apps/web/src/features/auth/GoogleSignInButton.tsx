import { useEffect, useRef, useState } from 'react'
import { googleClientId, loadGoogleIdentity } from './google-identity.ts'

interface GoogleSignInButtonProps {
  context: 'signin' | 'signup'
  // Receives the Google ID token; the caller sends it to the API.
  onCredential: (credential: string) => void
  disabled?: boolean
}

// Google's own button (Google Identity Services), rendered only when
// VITE_GOOGLE_CLIENT_ID is configured. Without it — or if the script cannot
// load — email + password sign-in is unaffected.
export function GoogleSignInButton({
  context,
  onCredential,
  disabled = false,
}: GoogleSignInButtonProps) {
  const clientId = googleClientId()
  const container = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  // Latest callback without re-initializing GIS on every render.
  const callback = useRef(onCredential)
  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    loadGoogleIdentity()
      .then((gis) => {
        const parent = container.current
        if (cancelled || !parent) return
        gis.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) callback.current(response.credential)
          },
          ux_mode: 'popup',
          context,
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        gis.renderButton(parent, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: context === 'signup' ? 'signup_with' : 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.min(parent.clientWidth || 320, 400),
          locale: 'id',
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [clientId, context])

  if (!clientId) return null

  return (
    <div>
      <div className="relative my-6 flex items-center" aria-hidden="true">
        <div className="flex-1 border-t border-slate-200" />
        <span className="px-3 text-sm text-slate-500">atau</span>
        <div className="flex-1 border-t border-slate-200" />
      </div>
      {failed ? (
        <p className="text-center text-sm text-slate-600">
          Masuk dengan Google tidak dapat dimuat saat ini.
        </p>
      ) : (
        <div
          role="group"
          aria-label="Masuk dengan Google"
          aria-disabled={disabled || undefined}
          className={`flex min-h-11 justify-center ${
            disabled ? 'pointer-events-none opacity-60' : ''
          }`}
          ref={container}
        />
      )}
    </div>
  )
}
