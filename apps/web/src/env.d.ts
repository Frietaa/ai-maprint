/// <reference types="vite/client" />

// Browser-visible build-time configuration (every VITE_* value is public).
interface ImportMetaEnv {
  // Origin (optionally with a path prefix) of the MABA PRINTING API, e.g.
  // "https://api.example.test". Empty/unset = same origin as the website
  // (local development uses the Vite /api proxy).
  readonly VITE_API_BASE_URL?: string
  // Google OAuth client ID for Google Identity Services (a public
  // identifier). Empty/unset hides the Google Sign-In button.
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
