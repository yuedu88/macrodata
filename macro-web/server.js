const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);
const FRED_ENDPOINT = 'https://api.stlouisfed.org/fred/series/observations';
const ROOT = __dirname;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function send(response, status, body, contentType = 'application/json; charset=utf-8') {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(body);
}

async function proxyFred(request, response, url) {
  const seriesId = url.searchParams.get('series_id') || '';
  if (!/^[A-Z0-9]+$/.test(seriesId)) {
    send(response, 400, JSON.stringify({ error_message: 'Invalid series id' }));
    return;
  }

  const apiKey = String(request.headers['x-fred-api-key'] || '').trim();
  if (!/^[a-z0-9]{32}$/.test(apiKey)) {
    send(response, 400, JSON.stringify({ error_code: 'invalid_api_key', error_message: 'Enter a valid FRED API key in API settings.' }));
    return;
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    file_type: 'json',
    limit: '100',
    series_id: seriesId,
    sort_order: 'desc'
  });

  try {
    const fredResponse = await fetch(`${FRED_ENDPOINT}?${params}`);
    const body = await fredResponse.text();
    send(response, fredResponse.status, body);
  } catch {
    send(response, 502, JSON.stringify({ error_message: 'FRED request failed' }));
  }
}

function serveStatic(request, response, url) {
  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!['/index.html', '/app.js', '/styles.css'].includes(requestedPath)) {
    send(response, 404, 'Not found', 'text/plain; charset=utf-8');
    return;
  }
  const filePath = path.resolve(ROOT, `.${requestedPath}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) {
    send(response, 403, JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(response, error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Not found' : 'Server error', 'text/plain; charset=utf-8');
      return;
    }
    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    response.writeHead(200, {
      'Cache-Control': 'no-cache',
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(data);
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${HOST}:${PORT}`);
  if (request.method === 'GET' && url.pathname === '/api/fred/series/observations') {
    proxyFred(request, response, url);
    return;
  }
  if (request.method === 'GET') {
    serveStatic(request, response, url);
    return;
  }
  send(response, 405, JSON.stringify({ error: 'Method not allowed' }));
});

server.listen(PORT, HOST, () => {
  console.log(`Macro 365 is running at http://${HOST}:${PORT}`);
});
