import express from 'express'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.js'
import { requestId } from '../middleware/request-id.js'
import { requestLog } from '../middleware/request-log.js'
import { testAuthOptions } from '../test/app-options.js'
import {
  createLogger,
  type Logger,
  logger,
  parseLogLevel,
  setLogger,
} from './logger.js'

const original = logger()
afterEach(() => {
  setLogger(original)
})

function capture(level: Parameters<typeof createLogger>[0]['level'] = 'debug') {
  const lines: Record<string, unknown>[] = []
  const log: Logger = createLogger({
    level,
    write: (_level, line) =>
      lines.push(JSON.parse(line) as Record<string, unknown>),
    now: () => new Date('2026-10-22T01:02:03.000Z'),
  })
  return { log, lines }
}

describe('createLogger', () => {
  it('writes one JSON object per entry with time, level and event', () => {
    const { log, lines } = capture()
    log.info('order.created', { status: 201, durationMs: 12.5 })
    expect(lines).toStrictEqual([
      {
        time: '2026-10-22T01:02:03.000Z',
        level: 'info',
        event: 'order.created',
        status: 201,
        durationMs: 12.5,
      },
    ])
  })

  it('filters by level', () => {
    const { log, lines } = capture('warn')
    log.debug('a')
    log.info('b')
    log.warn('c')
    log.error('d')
    expect(lines.map((line) => line.event)).toStrictEqual(['c', 'd'])
    const silent = capture('silent')
    silent.log.error('x')
    expect(silent.lines).toStrictEqual([])
  })

  it('drops fields whose names suggest secrets', () => {
    const { log, lines } = capture()
    log.error('x', {
      password: 'hunter2',
      sessionId: 's',
      csrfToken: 't',
      idempotencyKey: 'k',
      authorization: 'Bearer y',
      storageKeys: ['orders/0123456789abcdef0123456789abcdef'],
    })
    expect(JSON.stringify(lines)).not.toMatch(/hunter2|Bearer|"s"|"t"|"k"/)
    expect(lines[0]?.storageKeys).toHaveLength(1)
  })

  it('validates LOG_LEVEL', () => {
    expect(parseLogLevel(undefined)).toBe('info')
    expect(parseLogLevel('error')).toBe('error')
    expect(() => parseLogLevel('verbose')).toThrow('Invalid LOG_LEVEL')
  })
})

describe('request log', () => {
  it('logs the route template, never the concrete path or query', async () => {
    const { log, lines } = capture()
    setLogger(log)
    const app = express()
    app.use(requestId)
    app.use(requestLog)
    const router = express.Router()
    router.get('/orders/track/:publicId', (_req, res) => {
      res.status(200).json({ ok: true })
    })
    app.use('/api/v1', router)

    const response = await request(app).get(
      '/api/v1/orders/track/MP-2026-7K92D4QX8M7RA?email=rina@example.test',
    )
    expect(response.status).toBe(200)
    const entry = lines.find((line) => line.event === 'http.request')
    expect(entry).toMatchObject({
      level: 'info',
      requestId: response.headers['x-request-id'],
      method: 'GET',
      route: '/api/v1/orders/track/:publicId',
      status: 200,
    })
    expect(typeof entry?.durationMs).toBe('number')
    expect(JSON.stringify(lines)).not.toMatch(/MP-2026|rina|email/)
  })

  it('marks unmatched routes and logs server errors at error level', async () => {
    const { log, lines } = capture()
    setLogger(log)
    const app = createApp({
      getDb: () => {
        throw new Error('no database')
      },
      auth: testAuthOptions(),
    })
    await request(app).get('/api/v1/no-such-route')
    await request(app).get('/api/v1/public/settings')
    const requests = lines.filter((line) => line.event === 'http.request')
    expect(
      requests.map((line) => [line.route, line.status, line.level]),
    ).toStrictEqual([
      ['unmatched', 404, 'info'],
      ['/api/v1/public/settings', 500, 'error'],
    ])
  })
})

describe('error logs of parameterized routes', () => {
  it('never contain the concrete Public Order ID', async () => {
    const { log, lines } = capture()
    setLogger(log)
    const app = express()
    app.use(requestId)
    app.use(requestLog)
    const router = express.Router()
    router.get('/admin/orders/:publicId', () => {
      throw new Error('boom')
    })
    app.use('/api/v1', router)
    const { errorHandler } = await import('../middleware/error-handler.js')
    app.use(errorHandler)

    await request(app).get('/api/v1/admin/orders/MP-2026-7K92D4QX8M7RA')
    const routes = lines.map((line) => line.route)
    expect(routes).toStrictEqual([
      '/api/v1/admin/orders/:publicId',
      '/api/v1/admin/orders/:publicId',
    ])
    expect(JSON.stringify(lines)).not.toContain('MP-2026')
  })
})

describe('readiness', () => {
  it('answers 503 without details when the database is unreachable', async () => {
    const { log, lines } = capture()
    setLogger(log)
    const app = createApp({
      getDb: () =>
        ({
          $queryRaw: () =>
            Promise.reject(new Error('connect ECONNREFUSED 10.0.0.5:5432')),
        }) as never,
      auth: testAuthOptions(),
      orders: { storage: {} as never, uploadTempDir: '.' },
    })
    const response = await request(app).get('/api/v1/readiness')
    expect(response.status).toBe(503)
    expect(response.body).toStrictEqual({ status: 'unavailable' })
    expect(response.headers['cache-control']).toBe('no-store')
    expect(
      lines.find((line) => line.event === 'readiness.failed'),
    ).toMatchObject({
      check: 'database',
      category: 'Error',
    })
    expect(JSON.stringify(lines)).not.toContain('10.0.0.5')
  })

  it('is not ready without document storage', async () => {
    const app = createApp({
      getDb: () => ({ $queryRaw: () => Promise.resolve([]) }) as never,
      auth: testAuthOptions(),
    })
    const response = await request(app).get('/api/v1/readiness')
    expect(response.status).toBe(503)
  })

  it('keeps health independent of the database', async () => {
    const app = createApp({
      getDb: () => {
        throw new Error('no database')
      },
      auth: testAuthOptions(),
    })
    const response = await request(app).get('/api/v1/health')
    expect(response.status).toBe(200)
    expect(response.body).toStrictEqual({ status: 'ok' })
  })
})
