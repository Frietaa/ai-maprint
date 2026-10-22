// Structured logging (Architecture §46, TASK-07.07): one JSON object per
// line on stdout (debug/info) or stderr (warn/error), ready for any log
// collector — no logging service SDK. Callers pass an event name and a few
// safe fields; values are reduced to primitives (or arrays of them) and
// fields whose names suggest secrets are dropped, as a second line of
// defense. Never pass request bodies, cookies, tokens, passwords, file names,
// document contents or paths that contain a Public Order ID.

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

type Primitive = string | number | boolean | null
export type LogFields = Record<
  string,
  Primitive | undefined | readonly Primitive[]
>

export interface Logger {
  debug(event: string, fields?: LogFields): void
  info(event: string, fields?: LogFields): void
  warn(event: string, fields?: LogFields): void
  error(event: string, fields?: LogFields): void
}

const SEVERITY: Record<Exclude<LogLevel, 'silent'>, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const SECRET_FIELD = /pass|secret|token|cookie|authorization|session|key$/i
// Storage keys are random identifiers, explicitly allowed for diagnostics.
const ALLOWED_FIELDS = new Set(['storageKeys'])

export function parseLogLevel(raw: string | undefined): LogLevel {
  if (raw === undefined) return 'info'
  if (!(LOG_LEVELS as readonly string[]).includes(raw)) {
    throw new Error(
      `Invalid LOG_LEVEL: expected one of ${LOG_LEVELS.join(', ')}`,
    )
  }
  return raw as LogLevel
}

export interface LoggerOptions {
  level: LogLevel
  // Output sink; defaults to console (stdout for debug/info, stderr else).
  write?: (level: Exclude<LogLevel, 'silent'>, line: string) => void
  now?: () => Date
}

function defaultWrite(level: Exclude<LogLevel, 'silent'>, line: string) {
  if (level === 'warn' || level === 'error') console.error(line)
  else console.log(line)
}

export function createLogger({
  level,
  write = defaultWrite,
  now = () => new Date(),
}: LoggerOptions): Logger {
  const threshold = level === 'silent' ? Infinity : SEVERITY[level]
  const emit =
    (entryLevel: Exclude<LogLevel, 'silent'>) =>
    (event: string, fields: LogFields = {}) => {
      if (SEVERITY[entryLevel] < threshold) return
      const entry: Record<string, unknown> = {
        time: now().toISOString(),
        level: entryLevel,
        event,
      }
      for (const [name, value] of Object.entries(fields)) {
        if (value === undefined) continue
        if (SECRET_FIELD.test(name) && !ALLOWED_FIELDS.has(name)) continue
        entry[name] = value
      }
      write(entryLevel, JSON.stringify(entry))
    }
  return {
    debug: emit('debug'),
    info: emit('info'),
    warn: emit('warn'),
    error: emit('error'),
  }
}

// Process-wide logger. LOG_LEVEL (default info); under the test runner only
// warnings and errors are written unless LOG_LEVEL says otherwise.
let current: Logger = createLogger({
  level:
    process.env.LOG_LEVEL?.trim() || !process.env.VITEST
      ? parseLogLevel(process.env.LOG_LEVEL?.trim() || undefined)
      : 'warn',
})

export function logger(): Logger {
  return current
}

export function setLogger(next: Logger): void {
  current = next
}

// "PrismaClientKnownRequestError P2024", "TypeError", ... — never messages,
// which may contain SQL, arguments or request data.
export function errorCategory(error: unknown): string {
  if (!(error instanceof Error)) return typeof error
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? `${error.name} ${code}` : error.name
}
