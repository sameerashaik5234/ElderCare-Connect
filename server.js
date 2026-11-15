
// ElderCare Connect - Production Server
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const env = require('./src/config/env');
const { handleApiRequest } = require('./src/routes/apiRoutes');
const seedDemo = require('./src/db/seed-demo');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer(async (req, res) => {
  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Scheduler-Token, X-CloudScheduler');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. Dispatch REST API requests
  if (pathname.startsWith('/api/')) {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      let parsedBody = {};

      if (body.trim()) {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
          return;
        }
      }

      await handleApiRequest(req, res, pathname, parsedUrl.query, parsedBody);
    });

    return;
  }

  // 2. Serve Static Frontend Files
  const filePath = path.join(
    __dirname,
    'public',
    pathname === '/' ? 'index.html' : pathname
  );

  // Security: Prevent directory traversal outside public
  const safePrefix = path.join(__dirname, 'public');

  if (!filePath.startsWith(safePrefix)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(__dirname, 'public', 'index.html');

      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=UTF-8'
          });
          res.end(content);
        }
      });

      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    if (ext === '.js' && filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Service-Worker-Allowed', '/');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

const PORT = env.PORT;

// Start server only after optional demo seeding completes
async function startServer() {
  if (process.env.SEED_DEMO_DATA === 'true') {
    console.log('[Startup] Demo seeding enabled.');
    await seedDemo();
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log('===============================================================');
    console.log(`  🏥 ElderCare Connect Server Running at: http://localhost:${PORT}`);
    console.log(`  Environment: ${env.NODE_ENV} | Port: ${PORT}`);
    console.log('===============================================================');
  });
}

startServer().catch(error => {
  console.error('[Startup] Failed to start server:', error);
  process.exit(1);
});

// Graceful Shutdown for Google Cloud Run
function gracefulShutdown(signal) {
  console.log(`[Server] Received ${signal}. Closing HTTP server...`);

  server.close(() => {
    console.log('[Server] HTTP server closed. Exiting process.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Server] Forcefully terminating after timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
