import { createReadStream } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
const DIST = resolve(ROOT, 'dist')
const API = resolve(ROOT, 'api')
const PORT = Number(process.env.PORT || 10000)
const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

function setStaticHeaders(res: ServerResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
}

function sendJson(res: ServerResponse, status: number, message: string) {
  if (res.headersSent) return res.end()
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify({ error: message }))
}

async function serveApi(pathname: string, req: IncomingMessage, res: ServerResponse) {
  const route = pathname.slice('/api/'.length).replace(/\/$/, '')
  const segments = route.split('/')
  if (!route || segments.some((segment) => !/^[a-z0-9-]+$/i.test(segment))) {
    return sendJson(res, 404, 'Not found')
  }

  const handlerPath = resolve(API, `${route}.ts`)
  if (!handlerPath.startsWith(`${API}${sep}`)) return sendJson(res, 404, 'Not found')
  try {
    await access(handlerPath)
  } catch {
    return sendJson(res, 404, 'Not found')
  }

  try {
    const endpoint = await import(pathToFileURL(handlerPath).href) as { default?: unknown }
    if (typeof endpoint.default !== 'function') return sendJson(res, 404, 'Not found')
    await (endpoint.default as (request: IncomingMessage, response: ServerResponse) => Promise<void>)(req, res)
  } catch (error) {
    console.error(`API route failed: ${pathname}`, error)
    sendJson(res, 500, 'Server error')
  }
}

async function serveStatic(pathname: string, req: IncomingMessage, res: ServerResponse) {
  let decodedPath: string
  try {
    decodedPath = decodeURIComponent(pathname)
  } catch {
    res.statusCode = 400
    return res.end('Bad request')
  }
  const requestedPath = resolve(DIST, `.${decodedPath}`)
  if (!requestedPath.startsWith(`${DIST}${sep}`) && requestedPath !== DIST) {
    res.statusCode = 403
    return res.end('Forbidden')
  }

  let filePath = requestedPath
  try {
    if (!(await stat(filePath)).isFile()) filePath = join(filePath, 'index.html')
    await access(filePath)
  } catch {
    if (extname(decodedPath)) {
      res.statusCode = 404
      return res.end('Not found')
    }
    filePath = join(DIST, 'index.html')
  }

  try {
    const file = await stat(filePath)
    res.statusCode = 200
    res.setHeader('Content-Type', MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream')
    res.setHeader('Content-Length', file.size)
    if (filePath.includes(`${sep}assets${sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    } else {
      res.setHeader('Cache-Control', 'no-cache')
    }
    if (req.method === 'HEAD') return res.end()
    createReadStream(filePath).pipe(res)
  } catch (error) {
    console.error('Static file failed:', error)
    res.statusCode = 500
    res.end('Server error')
  }
}

const server = createServer((req, res) => {
  setStaticHeaders(res)
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    void serveApi(pathname, req, res)
    return
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET, HEAD')
    return res.end('Method not allowed')
  }
  void serveStatic(pathname, req, res)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Staroot Hub listening on 0.0.0.0:${PORT}`)
})
