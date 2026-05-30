/**
 * Production entry. Bundles the TanStack Start SSR/API handler with a thin
 * static-file layer so a single Bun process can serve everything:
 *
 *   GET /assets/*       → ./dist/client/assets/*     (cached forever)
 *   GET /<any-static>   → ./dist/client/<file>       (e.g. /favicon.ico, /robots.txt)
 *   GET /*  (anything else) → SSR + API via dist/server/server.js
 *
 * If you'd rather have nginx serve static assets directly, point it at
 * `dist/client/` and proxy non-static traffic to this process.
 */
// @ts-expect-error — built artefact; types not provided by TanStack Start.
import handler from './dist/server/server.js'
import { stat, readFile } from 'node:fs/promises'
import { join, normalize, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const CLIENT_DIR = join(__dirname, 'dist', 'client')
const PORT = Number(process.env.PORT ?? 3000)
const HOST = process.env.HOST ?? '0.0.0.0'

const MIME: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

async function tryServeStatic(pathname: string): Promise<Response | null> {
  // Reject traversal attempts.
  if (pathname.includes('\0') || pathname.includes('..')) return null
  const safePath = normalize(pathname).replace(/^[\\/]+/, '')
  if (!safePath) return null

  const filePath = join(CLIENT_DIR, safePath)
  if (!filePath.startsWith(CLIENT_DIR)) return null
  if (!existsSync(filePath)) return null

  const info = await stat(filePath).catch(() => null)
  if (!info || !info.isFile()) return null

  const body = await readFile(filePath)
  const ext = extname(filePath).toLowerCase()
  const contentType = MIME[ext] ?? 'application/octet-stream'

  // Hashed assets under /assets/* get long-term caching; everything else is
  // served with a conservative cache.
  const isHashed = pathname.startsWith('/assets/')
  const cacheControl = isHashed
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=3600'

  return new Response(body, {
    headers: {
      'content-type': contentType,
      'content-length': String(body.byteLength),
      'cache-control': cacheControl,
    },
  })
}

Bun.serve({
  port: PORT,
  hostname: HOST,
  // 5 MB max body for incoming API uploads.
  maxRequestBodySize: 5 * 1024 * 1024,
  async fetch(request: Request) {
    const url = new URL(request.url)

    // API + SSR routes go straight to TanStack Start.
    if (url.pathname.startsWith('/api/')) {
      return handler.fetch(request)
    }

    // Try static asset; fall back to SSR.
    if (request.method === 'GET' || request.method === 'HEAD') {
      const staticResp = await tryServeStatic(url.pathname)
      if (staticResp) return staticResp
    }

    return handler.fetch(request)
  },
  error(err: Error) {
    console.error('[server] unhandled error:', err)
    return new Response('Internal Server Error', { status: 500 })
  },
})

console.log(`[server] vetcare ready on http://${HOST}:${PORT}`)
