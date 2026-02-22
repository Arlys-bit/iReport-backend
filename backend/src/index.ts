console.log('🚀 Starting app initialization...');

import express from 'express';
import { createServer } from 'http';

console.log('✅ Imports successful');

const app = express();
const httpServer = createServer(app);

console.log('✅ Express server created');

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = parseInt(process.env.PORT || '3000', 10);

console.log(`🔧 Listening on port ${PORT}...`);

const server = httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM: shutting down');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT: shutting down');
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled rejection:', reason);
  process.exit(1);
});

console.log('✅ App initialization complete');

export default app;
