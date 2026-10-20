import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Returns the test database to empty after the E2E run (guarded to
// maba_printing_test by the API script).
export default function globalTeardown() {
  execSync('npm run e2e:fixtures:clean', {
    cwd: fileURLToPath(new URL('../../api', import.meta.url)),
    stdio: 'inherit',
  })
}
