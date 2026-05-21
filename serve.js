#!/usr/bin/env node
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const ROOT = path.resolve(__dirname, '..')   // één niveau hoger: vibe/

const MIME = {
  '.jscad': 'text/javascript',
  '.js':    'text/javascript',
  '.stl':   'model/stl',
  '.png':   'image/png',
  '.html':  'text/html; charset=utf-8',
  '.json':  'application/json',
  '.md':    'text/markdown',
  '.scad':  'text/plain',
  '.svg':   'image/svg+xml',
  '.amf':   'application/xml',
}

function findFiles(dir, ext, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      findFiles(full, ext, results)
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full)
    }
  }
  return results
}

function indexHtml(host) {
  const jscadFiles = findFiles(path.join(ROOT, 'foamcutter', 'designs'), '.jscad')
  const base = `http://${host}`

  const rows = jscadFiles.map(f => {
    const rel  = path.relative(ROOT, f).replace(/\\/g, '/')
    const url  = `${base}/${rel}`
    const name = path.relative(path.join(ROOT, 'foamcutter', 'designs'), f).replace(/\\/g, '/')
    const localUrl  = `${base}/foamcutter/openjscad-local/OpenJSCAD.org/packages/web/?uri=${url}`
    const remoteUrl = `https://openjscad.xyz/?uri=${url}`
    return `
    <tr>
      <td><code>${name}</code></td>
      <td><a href="/${rel}" target="_blank">${url}</a></td>
      <td><a href="${localUrl}" target="_blank">lokaal ↗</a></td>
      <td><a href="${remoteUrl}" target="_blank">openjscad.xyz ↗</a></td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>JSCAD Design Server</title>
  <style>
    body { font-family: monospace; padding: 2rem; background: #1a1a1a; color: #e0e0e0; }
    h1 { color: #7ec8e3; }
    table { border-collapse: collapse; width: 100%; }
    th { text-align: left; padding: .5rem 1rem; color: #aaa; border-bottom: 1px solid #333; }
    td { padding: .4rem 1rem; border-bottom: 1px solid #222; vertical-align: top; }
    a { color: #7ec8e3; }
    code { color: #c3e88d; }
    .note { color: #888; font-size: .85em; margin-top: 2rem; }
  </style>
</head>
<body>
  <h1>JSCAD Design Server</h1>
  <p>Serving <code>${ROOT}</code> on <strong>${base}</strong> — CORS ingeschakeld</p>
  <table>
    <thead><tr><th>Design</th><th>URL</th><th>Lokaal</th><th>openjscad.xyz</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="note">
    Tip: in openjscad.xyz → <em>File &gt; Open URL…</em> en plak de URL.<br>
    Of gebruik de <em>Open in openjscad.xyz ↗</em> link (werkt alleen als HTTPS→HTTP mixed-content is toegestaan in je browser,<br>
    of als je een lokale JSCAD-instantie draait op <code>http://localhost</code>).
  </p>
</body>
</html>`
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const urlPath = req.url.split('?')[0]

  if (urlPath === '/' || urlPath === '') {
    const html = indexHtml(req.headers.host || `localhost:${PORT}`)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
    return
  }

  const filePath = path.join(ROOT, decodeURIComponent(urlPath))

  // Prevent path traversal outside ROOT
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end(`Not found: ${urlPath}`)
      return
    }

    // Serve index.html for directory requests
    if (stat.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html')
      fs.stat(indexPath, (err2, stat2) => {
        if (err2 || !stat2.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end(`Not found: ${urlPath}`)
          return
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': stat2.size })
        fs.createReadStream(indexPath).pipe(res)
      })
      return
    }

    const ext  = path.extname(filePath).toLowerCase()
    const mime = MIME[ext] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size })
    fs.createReadStream(filePath).pipe(res)
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nJSCAD Design Server draait op http://localhost:${PORT}`)
  console.log(`\nBeschikbare .jscad bestanden:`)
  findFiles(path.join(ROOT, 'foamcutter', 'designs'), '.jscad').forEach(f => {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/')
    console.log(`  http://localhost:${PORT}/${rel}`)
  })
  console.log()
})
