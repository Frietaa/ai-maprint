/// <reference types="vite/client" />

// Browser-visible build-time configuration (every VITE_* value is public).
interface ImportMetaEnv {
  // Origin (optionally with a path prefix) of the MABA PRINTING API, e.g.
  // "https://api.example.test". Empty/unset = same origin as the website
  // (local development uses the Vite /api proxy).
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
