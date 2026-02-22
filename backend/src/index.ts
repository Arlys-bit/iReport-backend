#!/usr/bin/env node

console.log('[START] PID:', process.pid, '| Node:', process.version);

const http = require('http');

const server = http.createServer((req, res) => {
  console.log('[REQUEST]', req.method, req.url);
  
  if (req.url === '/health' || req.url === '/') {
    console.log('[HEALTH] Responding');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);

server.listen(PORT, '0.0.0.0', () => {
  console.log('[READY] Listening on ' + PORT);
  
  // Log every 5 seconds to show app is alive
  setInterval(() => {
    console.log('[ALIVE]', Math.round(process.uptime()), 'seconds');
  }, 5000).unref();
});

process.on('SIGTERM', () => {
  console.log('[SIGTERM] Shutting down');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000);
});

module.exports = server;
