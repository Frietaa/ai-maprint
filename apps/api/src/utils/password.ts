// Password hashing (Architecture §17): Argon2id via @node-rs/argon2 with
// the library defaults — m = 19456 KiB, t = 2, p = 1 (the OWASP baseline).
// The encoded PHC string ($argon2id$v=19$...) carries salt and parameters,
// so nothing else is stored. Plaintext passwords are never stored or logged.
import { randomBytes } from 'node:crypto'
import { hash, verify } from '@node-rs/argon2'

export function hashPassword(password: string): Promise<string> {
  return hash(password)
}

// false for a wrong password or an unreadable stored hash.
export async function verifyPassword(
  encodedHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(encodedHash, password)
  } catch {
    return false
  }
}

let dummyHash: Promise<string> | undefined

// Spends the same Argon2id work as a real check when there is no hash to
// compare (unknown email, Google-only account), so the response time does
// not obviously reveal whether an account exists. Not a constant-time
// guarantee over the network.
export async function verifyAgainstDummy(password: string): Promise<void> {
  dummyHash ??= hash(randomBytes(32).toString('base64url'))
  await verifyPassword(await dummyHash, password)
}
