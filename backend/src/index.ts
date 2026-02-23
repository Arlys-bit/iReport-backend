#!/usr/bin/env node

const http = require('http');

let requestCount = 0;

const server = http.createServer((req, res) => {
  requestCount++;
  console.log('[REQ #' + requestCount + ']', req.method, req.url, 'uptime=' + Math.round(process.uptime()) + 's');
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'ok',
    uptime: process.uptime(),
    requests: requestCount
  }));
});

const PORT = 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('[START]', new Date().toISOString(), 'PID=' + process.pid);
  console.log('[READY] Listening on', PORT);
});

process.on('SIGTERM', () => {
  console.log('[STOP]', new Date().toISOString());
  process.exit(0);
});

// Keep process alive forever
setInterval(() => {
  // noop
}, 1000);
