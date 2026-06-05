const http = require('http')
const https = require('https')
const url = require('url')

const PORT = 3333
const PIPED_API = 'api.piped.private.coffee'

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  const pipedPath = req.url
  console.log(`[proxy] ${req.method} ${pipedPath}`)

  const options = {
    hostname: PIPED_API,
    port: 443,
    path: pipedPath,
    method: req.method,
    headers: {
      'user-agent': 'YouTubeDream/1.0',
      accept: 'application/json',
    },
  }

  const proxyReq = https.request(options, (proxyRes) => {
    const chunks = []
    proxyRes.on('data', (c) => chunks.push(c))
    proxyRes.on('end', () => {
      const body = Buffer.concat(chunks)
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'Access-Control-Allow-Origin': '*',
        'access-control-allow-origin': '*',
      })
      res.end(body)
    })
  })

  proxyReq.on('error', (err) => {
    console.error(`[proxy] Error: ${err.message}`)
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end(`Proxy error: ${err.message}`)
  })

  proxyReq.end()
})

server.listen(PORT, () => {
  console.log(`[proxy] Piped API proxy running on http://localhost:${PORT}`)
})
