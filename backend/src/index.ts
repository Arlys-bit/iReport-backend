#!/usr/bin/env node

// Log immediately before any imports
console.log('[INSTANT] App starting');

const express = require('express');
const { createServer } = require('http');

console.log('[INSTANT] Imports complete');

const app = express();
const httpServer = createServer(app);

app.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok' });
});

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = httpServer.listen(PORT, () => {
  console.log(`[INSTANT] Server listening on ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[INSTANT] SIGTERM received');
  server.close(() => process.exit(0));
});

module.exports = app;
