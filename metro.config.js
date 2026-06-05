const { getDefaultConfig } = require('@expo/metro-config')
const https = require('https')

const config = getDefaultConfig(__dirname)

config.resolver.sourceExts.push('mjs')

// Proxy /api/piped/* to the Piped API (avoids CORS on web)
config.server = config.server || {}
config.server.enhanceMiddleware = (metroMiddleware) => {
  return (req, res, next) => {
    if (!req.url?.startsWith('/api/piped/')) {
      return metroMiddleware(req, res, next)
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      res.end()
      return
    }

    const pipedPath = req.url.replace('/api/piped', '')
    const options = {
      hostname: 'api.piped.private.coffee',
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
        })
        res.end(body)
      })
    })

    proxyReq.on('error', (err) => {
      console.error('[proxy]', err.message)
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' })
        res.end('Proxy error: ' + err.message)
      }
    })

    proxyReq.end()
  }
}

module.exports = config
