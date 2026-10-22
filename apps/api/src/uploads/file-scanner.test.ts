import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import {
  createClamavScanner,
  parseClamdReply,
  ScannerUnavailableError,
} from './file-scanner.js'

// The standard, harmless antivirus test string (EICAR), split so this
// source file itself is not flagged.
const EICAR = [
  'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR',
  '-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
].join('')

const dir = mkdtempSync(path.join(tmpdir(), 'maba-test-scanner-'))
const cleanFile = path.join(dir, 'clean.pdf')
const infectedFile = path.join(dir, 'infected.pdf')
const bigFile = path.join(dir, 'big.pdf')
writeFileSync(cleanFile, '%PDF-1.4 harmless')
writeFileSync(infectedFile, `%PDF-1.4 ${EICAR}`)
writeFileSync(bigFile, Buffer.alloc(300 * 1024, 0x41))
afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

type Behavior = 'scan' | 'error-reply' | 'silent'

// A minimal clamd speaking the zINSTREAM / zPING protocol.
function fakeClamd(behavior: Behavior = 'scan') {
  let received = 0
  const server: Server = createServer((socket) => {
    let buffer = Buffer.alloc(0)
    let command: string | null = null
    const body: Buffer[] = []
    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data])
      if (command === null) {
        const end = buffer.indexOf(0)
        if (end === -1) return
        command = buffer.subarray(0, end).toString()
        buffer = buffer.subarray(end + 1)
        if (command === 'zPING') {
          socket.end('PONG\0')
          return
        }
      }
      if (behavior === 'silent') return
      while (buffer.length >= 4) {
        const size = buffer.readUInt32BE(0)
        if (size === 0) {
          const content = Buffer.concat(body).toString()
          received = Buffer.concat(body).length
          if (behavior === 'error-reply') {
            socket.end('INSTREAM size limit exceeded. ERROR\0')
          } else if (content.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')) {
            socket.end('stream: Eicar-Test-Signature FOUND\0')
          } else {
            socket.end('stream: OK\0')
          }
          return
        }
        if (buffer.length < 4 + size) return
        body.push(buffer.subarray(4, 4 + size))
        buffer = buffer.subarray(4 + size)
      }
    })
  })
  return new Promise<{ server: Server; port: number; received: () => number }>(
    (resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address()
        resolve({
          server,
          port: typeof address === 'object' && address ? address.port : 0,
          received: () => received,
        })
      })
    },
  )
}

const servers: Server[] = []
afterEach(() => {
  for (const server of servers.splice(0)) server.close()
})

async function scannerWith(behavior: Behavior = 'scan', timeoutMs = 2000) {
  const clamd = await fakeClamd(behavior)
  servers.push(clamd.server)
  return {
    scanner: createClamavScanner({
      host: '127.0.0.1',
      port: clamd.port,
      timeoutMs,
    }),
    received: clamd.received,
  }
}

describe('ClamAV scanner (clamd INSTREAM)', () => {
  it('reports clean files', async () => {
    const { scanner } = await scannerWith()
    expect(await scanner.scan(cleanFile)).toStrictEqual({ clean: true })
  })

  it('reports infected files with the signature name', async () => {
    const { scanner } = await scannerWith()
    expect(await scanner.scan(infectedFile)).toStrictEqual({
      clean: false,
      signature: 'Eicar-Test-Signature',
    })
  })

  it('streams large files completely in chunks', async () => {
    const { scanner, received } = await scannerWith()
    expect(await scanner.scan(bigFile)).toStrictEqual({ clean: true })
    expect(received()).toBe(300 * 1024)
  })

  it('fails closed on an error reply, a refused connection or a timeout', async () => {
    const failing = await scannerWith('error-reply')
    await expect(failing.scanner.scan(cleanFile)).rejects.toBeInstanceOf(
      ScannerUnavailableError,
    )

    const refused = createClamavScanner({
      host: '127.0.0.1',
      port: 1,
      timeoutMs: 2000,
    })
    await expect(refused.scan(cleanFile)).rejects.toBeInstanceOf(
      ScannerUnavailableError,
    )

    const silent = await scannerWith('silent', 200)
    await expect(silent.scanner.scan(cleanFile)).rejects.toThrow('timed out')
  })

  it('answers readiness pings', async () => {
    const { scanner } = await scannerWith()
    await expect(scanner.ping()).resolves.toBeUndefined()
    const refused = createClamavScanner({
      host: '127.0.0.1',
      port: 1,
      timeoutMs: 500,
    })
    await expect(refused.ping()).rejects.toBeInstanceOf(ScannerUnavailableError)
  })

  it('parses only well-formed clamd replies', () => {
    expect(parseClamdReply('stream: OK\0')).toStrictEqual({ clean: true })
    expect(
      parseClamdReply('stream: Win.Test.EICAR_HDB-1 FOUND\0'),
    ).toStrictEqual({
      clean: false,
      signature: 'Win.Test.EICAR_HDB-1',
    })
    expect(() => parseClamdReply('')).toThrow(ScannerUnavailableError)
    expect(() => parseClamdReply('UNKNOWN COMMAND')).toThrow(
      ScannerUnavailableError,
    )
  })
})
