/**
 * Minimale statische server om de site lokaal te bekijken zonder Vite.
 * Handig wanneer node_modules niet geinstalleerd is.
 *
 *   node scripts/dev-server.mjs [poort]
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.argv[2] || 4323);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const zoek = (rel) => {
  // public/ wordt door Vite naar de root gekopieerd; hier doen we dat ook.
  const kandidaten = [path.resolve(ROOT, '.' + rel), path.resolve(ROOT, 'public', '.' + rel)];
  return kandidaten.find((p) => p.startsWith(ROOT) && fs.existsSync(p) && fs.statSync(p).isFile());
};

http
  .createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';

    const file = zoek(rel);
    if (!file) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 — niet gevonden: ' + rel);
      return;
    }

    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`Statische preview op http://localhost:${PORT}`));
