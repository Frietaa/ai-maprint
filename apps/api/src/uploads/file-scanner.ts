// Malware-scanning boundary for uploaded documents (TASK-07.05, KI-019).
// Content-signature validation (file-validation.ts) proves a file is the
// type it claims to be; it is NOT malware scanning. A FileScanner runs after
// that validation and before anything is stored:
// - "none": no scanning (development/tests; in production only when the
//   operator sets UPLOAD_SCANNER=none explicitly);
// - "clamav": a self-hosted ClamAV daemon (clamd) over TCP using its
//   INSTREAM protocol — no SDK, no external vendor.
// Scanner failures fail closed: the upload is refused (503), never stored
// unscanned. Documents stay private and attachment-only either way.
import { createReadStream } from 'node:fs'
import { connect } from 'node:net'

export type ScanVerdict = { clean: true } | { clean: false; signature: string }

export interface FileScanner {
  readonly kind: 'none' | 'clamav'
  scan(path: string): Promise<ScanVerdict>
  // Readiness: resolves when the scanner can take work.
  ping(): Promise<void>
}

export class ScannerUnavailableError extends Error {
  constructor(message = 'File scanner unavailable') {
    super(message)
    this.name = 'ScannerUnavailableError'
  }
}

export const noScanner: FileScanner = {
  kind: 'none',
  scan: () => Promise.resolve({ clean: true }),
  ping: () => Promise.resolve(),
}

export interface ClamavOptions {
  host: string
  port: number
  // Whole scan, including connecting and sending the file.
  timeoutMs: number
}

const CHUNK_BYTES = 64 * 1024

// clamd replies "stream: OK", "stream: <Signature> FOUND" or
// "<message> ERROR" (zINSTREAM: NUL-terminated).
export function parseClamdReply(reply: string): ScanVerdict {
  const text = reply.replace(/\0/g, '').trim()
  if (/^stream: OK$/.test(text)) return { clean: true }
  const found = /^stream: (.+) FOUND$/.exec(text)
  if (found?.[1]) return { clean: false, signature: found[1] }
  throw new ScannerUnavailableError('Unexpected scanner reply')
}

// One request/response exchange with clamd ("zPING" -> "PONG").
function clamdCommand(
  { host, port, timeoutMs }: ClamavOptions,
  command: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port })
    const reply: Buffer[] = []
    const timer = setTimeout(() => {
      socket.destroy()
      reject(new ScannerUnavailableError('File scanner timed out'))
    }, timeoutMs)
    socket.on('connect', () => socket.write(`z${command}\0`))
    socket.on('data', (chunk) => reply.push(chunk))
    socket.on('error', () => {
      clearTimeout(timer)
      reject(new ScannerUnavailableError())
    })
    socket.on('end', () => {
      clearTimeout(timer)
      resolve(Buffer.concat(reply).toString().replace(/\0/g, '').trim())
    })
  })
}

export function createClamavScanner(options: ClamavOptions): FileScanner {
  const { host, port, timeoutMs } = options
  return {
    kind: 'clamav',
    ping: async () => {
      if ((await clamdCommand(options, 'PING')) !== 'PONG') {
        throw new ScannerUnavailableError()
      }
    },
    scan: (path) =>
      new Promise<ScanVerdict>((resolve, reject) => {
        const socket = connect({ host, port })
        const reply: Buffer[] = []
        let settled = false
        const finish = (error: Error | null, verdict?: ScanVerdict) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          socket.destroy()
          if (error) reject(error)
          else if (verdict) resolve(verdict)
        }
        const timer = setTimeout(() => {
          finish(new ScannerUnavailableError('File scan timed out'))
        }, timeoutMs)

        socket.on('error', () => {
          finish(new ScannerUnavailableError())
        })
        socket.on('data', (chunk) => reply.push(chunk))
        socket.on('end', () => {
          try {
            finish(null, parseClamdReply(Buffer.concat(reply).toString()))
          } catch (error) {
            finish(error as Error)
          }
        })
        socket.on('connect', () => {
          socket.write('zINSTREAM\0')
          const file = createReadStream(path, { highWaterMark: CHUNK_BYTES })
          file.on('data', (data) => {
            const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data)
            const size = Buffer.alloc(4)
            size.writeUInt32BE(chunk.length)
            if (!socket.write(Buffer.concat([size, chunk]))) {
              file.pause()
              socket.once('drain', () => file.resume())
            }
          })
          file.on('error', () => {
            finish(new ScannerUnavailableError('Upload could not be read'))
          })
          // A zero-length chunk ends the stream.
          file.on('end', () => socket.write(Buffer.alloc(4)))
        })
      }),
  }
}
