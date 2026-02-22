// Ultra-fast startup logging
console.log('STARTUP: BEGIN');

import express from 'express';
import { createServer } from 'http';

console.log('STARTUP: Imports done');

const app = express();
const httpServer = createServer(app);

console.log('STARTUP: Server created');

app.get('/health', (req, res) => {
  console.log('HEALTH: ping');
  res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = parseInt(process.env.PORT || '3000', 10);

console.log(`STARTUP: About to listen on ${PORT}`);

const server = httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`STARTUP: COMPLETE - Server running on port ${PORT}`);
});

// Timeout protection - force exit if hangs
setTimeout(() => {
  console.log('STARTUP: Timeout protection - app took too long to initialize');
  process.exit(0);
}, 10000);

process.on('SIGTERM', () => {
  console.log('SIGNAL: SIGTERM');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGNAL: SIGINT');
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  console.error('ERROR: Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('ERROR: Unhandled rejection:', reason);
  process.exit(1);
});

console.log('STARTUP: Event handlers registered');

export default app;
