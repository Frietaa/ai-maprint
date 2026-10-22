// Post-deployment smoke test (TASK-08.08) — READ-ONLY: only GET and CORS
// preflight requests; never creates orders, accounts, uploads or payments.
//
//   node scripts/smoke.mjs --web https://www.example.id --api https://api.example.id
//   node scripts/smoke.mjs --web https://www.example.id   (API same-origin)
//
// Exit code 0 when every check passes, 1 otherwise.
const args = process.argv.slice(2)
function option(name) {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}
const web = new URL(option('--web') ?? '').origin
const api = new URL(option('--api') ?? web).origin
const https = web.startsWith('https:')
let failures = 0

function report(ok, label, detail = '') {
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`)
}

async function get(url, init = {}) {
  try {
    return await fetch(url, { redirect: 'manual', ...init })
  } catch (error) {
    return {
      ok: false,
      status: 0,
      headers: new Headers(),
      text: async () => '',
      error,
    }
  }
}

// --- website ----------------------------------------------------------------
const home = await get(`${web}/`)
const html = await home.text()
report(
  home.status === 200 && html.includes('<div id="root">'),
  'website / serves the app',
  `HTTP ${home.status}`,
)
const csp = home.headers.get('content-security-policy') ?? ''
report(
  csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'none'"),
  'website CSP',
)
if (api !== web) report(csp.includes(api), 'website CSP allows the API origin')
report(
  home.headers.get('x-content-type-options') === 'nosniff',
  'website nosniff',
)
report(
  home.headers.get('x-frame-options') === 'DENY',
  'website X-Frame-Options DENY',
)
report(Boolean(home.headers.get('referrer-policy')), 'website Referrer-Policy')
report(
  Boolean(home.headers.get('permissions-policy')),
  'website Permissions-Policy',
)
if (https) {
  report(
    (home.headers.get('strict-transport-security') ?? '').includes('max-age='),
    'website HSTS',
  )
}
report(
  (home.headers.get('cache-control') ?? '').includes('no-cache'),
  'index.html is revalidated',
)
const asset = /src="(\/assets\/[^"]+\.js)"/.exec(html)?.[1]
if (asset) {
  const response = await get(`${web}${asset}`)
  report(
    response.status === 200 &&
      (response.headers.get('cache-control') ?? '').includes('immutable'),
    'hashed assets are immutable',
  )
} else {
  report(false, 'hashed asset referenced by index.html')
}
for (const route of [
  '/atk',
  '/track-order',
  '/account/orders',
  '/admin/login',
]) {
  const response = await get(`${web}${route}`)
  const body = await response.text()
  report(
    response.status === 200 && body.includes('<div id="root">'),
    `SPA route ${route}`,
  )
}
const robots = await get(`${web}/robots.txt`)
report(
  robots.status === 200 && (await robots.text()).includes('Disallow: /admin'),
  'robots.txt keeps /admin out',
)

// --- API ----------------------------------------------------------------------
async function json(path) {
  const response = await get(`${api}/api/v1${path}`)
  let body = null
  try {
    body = await response.json()
  } catch {
    // not JSON
  }
  return { response, body }
}
const health = await json('/health')
report(
  health.response.status === 200 && health.body?.status === 'ok',
  'API health',
)
const ready = await json('/readiness')
report(
  ready.response.status === 200 && ready.body?.status === 'ready',
  'API readiness',
)
report(
  (health.response.headers.get('content-security-policy') ?? '').includes(
    "default-src 'none'",
  ) && health.response.headers.get('x-content-type-options') === 'nosniff',
  'API security headers',
)
if (https) {
  report(
    Boolean(health.response.headers.get('strict-transport-security')),
    'API HSTS',
  )
}
const settings = await json('/public/settings')
report(
  settings.response.status === 200 &&
    settings.body !== null &&
    'data' in settings.body,
  'public settings',
)
report(settings.body?.data !== null, 'business settings are configured')
for (const path of [
  '/locations',
  '/products?pageSize=1',
  '/services?pageSize=1',
]) {
  const { response, body } = await json(path)
  report(
    response.status === 200 && Array.isArray(body?.data),
    `catalog ${path}`,
  )
}
if (api !== web) {
  const preflight = await get(`${api}/api/v1/orders`, {
    method: 'OPTIONS',
    headers: { Origin: web, 'Access-Control-Request-Method': 'POST' },
  })
  report(
    preflight.headers.get('access-control-allow-origin') === web &&
      preflight.headers.get('access-control-allow-credentials') === 'true',
    'CORS allows the website origin with credentials',
  )
  const foreign = await get(`${api}/api/v1/products`, {
    headers: { Origin: 'https://not-the-website.invalid' },
  })
  report(
    !foreign.headers.get('access-control-allow-origin'),
    'CORS refuses other origins',
  )
}

console.log(failures === 0 ? 'SMOKE PASS' : `SMOKE FAIL (${failures} check(s))`)
process.exitCode = failures === 0 ? 0 : 1
