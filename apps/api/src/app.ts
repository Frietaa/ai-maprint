import express from 'express'

// Builds the Express app without opening a port, so tests can import it.
export function createApp() {
  const app = express()

  // Do not advertise the framework in response headers.
  app.disable('x-powered-by')

  app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  return app
}
