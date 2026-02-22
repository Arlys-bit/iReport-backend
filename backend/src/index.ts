#!/usr/bin/env node

console.log('[START] Process PID:', process.pid);
console.log('[START] Node version:', process.version);
console.log('[START] Environment:', process.env.NODE_ENV);
console.log('[START] Timestamp:', new Date().toISOString());

let isShuttingDown = false;

try {
  const express = require('express');
  const app = express();
  
  // Ultra-fast health check - must respond instantly
  app.get('/health', (req, res) => {
    // Respond immediately without any async operations
    res.status(200).set('Content-Type', 'application/json').end('{"status":"ok"}');
  });
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({ message: 'iReport Backend Ready', version: '1.0.0' });
  });
  
  // Ping endpoint
  app.get('/ping', (req, res) => {
    res.json({ pong: true });
  });
  
  // Error handling middleware
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  
  const PORT = parseInt(process.env.PORT || '3000', 10);
  console.log('[STARTUP] Listening on port:', PORT);
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('[READY] Server ready to accept connections');
  });
  
  // Disable Nagle's algorithm for faster responses
  server.on('connection', (socket) => {
    socket.setNoDelay(true);
  });
  
  // Handle errors
  server.on('error', (err) => {
    console.error('[SERVER_ERROR]', err.code, err.message);
    if (!isShuttingDown) {
      process.exit(1);
    }
  });
  
  // Handle SIGTERM - Railway's graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[SIGTERM] Received shutdown signal');
    isShuttingDown = true;
    
    server.close(() => {
      console.log('[SHUTDOWN] Server closed');
      process.exit(0);
    });
    
    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      console.error('[SHUTDOWN] Forcing exit');
      process.exit(1);
    }, 10000);
  });
  
  process.on('SIGINT', () => {
    console.log('[SIGINT] Shutting down');
    process.exit(0);
  });
  
  // Prevent memory leaks
  process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT]', err.message);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('[REJECTION]', reason);
  });
  
  console.log('[COMPLETE] Application initialized');
  module.exports = app;
  
} catch (error) {
  console.error('[FATAL]', error.message);
  process.exit(1);
}
