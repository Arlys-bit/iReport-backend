console.log('STARTUP: BEGIN');

import express from 'express';
import { createServer } from 'http';

console.log('STARTUP: Imports done');

const app = express();
const httpServer = createServer(app);

console.log('STARTUP: Server created');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`STARTUP: COMPLETE - listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGNAL: SIGTERM - exiting');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGNAL: SIGINT - exiting');
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  console.error('ERROR: Uncaught exception:', err);
  process.exit(1);
});

console.log('STARTUP: Ready for requests');

export default app;
