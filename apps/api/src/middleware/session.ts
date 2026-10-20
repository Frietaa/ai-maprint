// Server-managed browser sessions (Architecture §15, TASK-03.01).
//
// express-session keeps the session state server-side (PostgreSQL table
// user_sessions via connect-pg-simple in the running API); the browser only
// holds the signed, opaque session ID in an HttpOnly cookie. No auth token is
// ever handed to JavaScript or stored in localStorage.
import { randomBytes } from 'node:crypto'
import type { CookieOptions, Request, RequestHandler, Response } from 'express'
import session, { type Store } from 'express-session'

// Minimal session payload: who signed in, when, and the CSRF token. The
// user's role and active state are re-read from the database on every
// request (see authenticate.ts), never trusted from here.
declare module 'express-session' {
  interface SessionData {
    userId: string
    // Epoch milliseconds of the sign-in; enforces the absolute lifetime.
    authenticatedAt: number
    csrfToken: string
  }
}

export const SESSION_COOKIE_NAME = 'maba.sid'

// Absolute session lifetime: 7 days from sign-in. No "remember me" option.
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export interface SessionOptions {
  // Signs the session ID cookie (SESSION_SECRET). Never logged.
  secret: string
  store: Store
  // true in production: the cookie is only sent over HTTPS.
  secureCookies: boolean
}

export interface SessionManager {
  middleware: RequestHandler
  // Starts an authenticated session for `userId` under a NEW session ID
  // (session-fixation defense) with a fresh CSRF token.
  signIn(req: Request, userId: string): Promise<void>
  // Destroys the server-side session (if any) and clears the cookie.
  end(req: Request, res: Response): Promise<void>
}

// 32 random bytes from the CSPRNG, URL-safe.
export function newCsrfToken(): string {
  return randomBytes(32).toString('base64url')
}

export function createSessionManager({
  secret,
  store,
  secureCookies,
}: SessionOptions): SessionManager {
  // Same attributes for setting and clearing, so logout clears the cookie.
  const cookie: CookieOptions = {
    httpOnly: true,
    // Same-site deployment (Architecture §53): Lax blocks cross-site
    // subrequests while keeping normal top-level navigation working.
    sameSite: 'lax',
    secure: secureCookies,
    path: '/',
  }

  const middleware = session({
    name: SESSION_COOKIE_NAME,
    secret,
    store,
    // Browsing never creates a session: one is stored only once something
    // is put into it (a CSRF token or a sign-in).
    saveUninitialized: false,
    resave: false,
    // The cookie expiry is set at sign-in and not extended per request.
    rolling: false,
    unset: 'destroy',
    cookie: { ...cookie, maxAge: SESSION_MAX_AGE_MS },
  })

  return {
    middleware,

    async signIn(req, userId) {
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((error) => {
          if (error) reject(toError(error))
          else resolve()
        })
      })
      req.session.userId = userId
      req.session.authenticatedAt = Date.now()
      req.session.csrfToken = newCsrfToken()
      await new Promise<void>((resolve, reject) => {
        req.session.save((error) => {
          if (error) reject(toError(error))
          else resolve()
        })
      })
    },

    async end(req, res) {
      res.clearCookie(SESSION_COOKIE_NAME, cookie)
      if (!req.session) return
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((error) => {
          if (error) reject(toError(error))
          else resolve()
        })
      })
    },
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Session store error')
}
