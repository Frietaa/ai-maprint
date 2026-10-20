// Authentication & member-account REST contract shared by apps/api and
// apps/web. Implementation-independent: no Prisma, Express, session, Google
// or React types. Password hashes, Google subject IDs, internal user IDs and
// session data are intentionally never part of these DTOs.

export const AUTH_API_PATHS = {
  csrf: '/auth/csrf',
  register: '/auth/register',
  login: '/auth/login',
  google: '/auth/google',
  logout: '/auth/logout',
  me: '/auth/me',
} as const

export const ACCOUNT_API_PATHS = {
  profile: '/account/profile',
} as const

// Request header carrying the session-bound CSRF token on unsafe methods
// (POST/PUT/PATCH/DELETE).
export const CSRF_HEADER = 'X-CSRF-Token'

// Persistent account roles. Guests have no account and no role.
export const USER_ROLES = ['MEMBER', 'ADMIN'] as const
export type UserRole = (typeof USER_ROLES)[number]

// Input bounds enforced by the API (authoritative) and mirrored by the web
// forms for early feedback. Lengths are JavaScript string lengths.
export const AUTH_LIMITS = {
  nameMaxLength: 100,
  emailMaxLength: 254,
  passwordMinLength: 8,
  passwordMaxLength: 128,
  whatsappMaxLength: 20,
  whatsappMinDigits: 8,
  whatsappMaxDigits: 15,
  googleCredentialMaxLength: 4096,
} as const

// --- requests --------------------------------------------------------------

export interface RegisterRequest {
  name: string
  email: string
  password: string
  // Optional contact number; omitted, null or "" = none.
  whatsapp?: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

// `credential` is the Google Identity Services ID token. The API verifies
// it; the browser never treats it as proof of anything.
export interface GoogleLoginRequest {
  credential: string
}

// At least one field. `whatsapp: null` (or "") removes the number. Email,
// role and every other account field are not editable here.
export interface UpdateProfileRequest {
  name?: string
  whatsapp?: string | null
}

// --- responses -------------------------------------------------------------

// GET /auth/csrf
export interface CsrfTokenDto {
  csrfToken: string
}

// The signed-in account as the web app may know it. GET /auth/me returns
// `data: null` when no valid session exists.
export interface AuthUserDto {
  name: string
  email: string
  role: UserRole
}

// GET/PATCH /account/profile (MEMBER only).
export interface ProfileDto {
  name: string
  email: string
  whatsapp: string | null
  // How this account can sign in.
  signInMethods: {
    password: boolean
    google: boolean
  }
}
