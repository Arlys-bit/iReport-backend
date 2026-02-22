#!/usr/bin/env node

console.log('[START] Process PID:', process.pid);
console.log('[START] Node version:', process.version);
console.log('[START] Environment:', process.env.NODE_ENV);
console.log('[START] Timestamp:', new Date().toISOString());

let server;

try {
  console.log('[LOAD] Loading Express...');
  const express = require('express');
  console.log('[LOAD] Express loaded successfully');
  
  const app = express();
  
  // Simple test endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      uptime: process.uptime(),
      timestamp: new Date().toISOString() 
    });
  });
  
  app.get('/', (req, res) => {
    res.json({ 
      message: 'iReport Backend Ready', 
      version: '1.0.0',
      uptime: process.uptime()
    });
  });
  
  // Add a ping endpoint to keep the process alive
  app.get('/ping', (req, res) => {
    res.json({ pong: true });
  });
  
  const PORT = parseInt(process.env.PORT || '3000', 10);
  console.log('[SETUP] Starting server on port:', PORT);
  
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SUCCESS] Server is listening on 0.0.0.0:${PORT}`);
    console.log('[SUCCESS] Ready to accept requests');
  });
  
  // Keep the process alive by setting a dummy interval
  const keepAlive = setInterval(() => {
    console.log('[ALIVE] Process still running, uptime:', process.uptime().toFixed(2), 'seconds');
  }, 30000); // Log every 30 seconds
  
  // Prevent the interval from keeping the process alive unnecessarily
  keepAlive.unref();
  
  server.on('clientError', (err, socket) => {
    console.warn('[WARN] Client error:', err.message);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });
  
  server.on('error', (err) => {
    console.error('[SERVER_ERROR]', err.message);
    if (err.code === 'EADDRINUSE') {
      console.error('[ERROR] Port', PORT, 'is already in use');
    }
  });
  
  // Handle process signals
  process.on('SIGTERM', () => {
    console.log('[SIGTERM] Received SIGTERM signal at', new Date().toISOString());
    console.log('[SIGTERM] Closing server gracefully...');
    
    server.close(() => {
      console.log('[SIGTERM] Server closed gracefully');
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('[SIGTERM] Forcing exit after timeout');
      process.exit(1);
    }, 10000);
  });
  
  process.on('SIGINT', () => {
    console.log('[SIGINT] Received SIGINT signal');
    process.exit(0);
  });
  
  process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT_EXCEPTION]', err);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED_REJECTION]', reason);
  });
  
  // Log that startup is complete
  console.log('[STARTUP_COMPLETE] Application is fully initialized and ready');
  
  module.exports = app;
  
} catch (error) {
  console.error('[FATAL_ERROR] Startup error:', error);
  process.exit(1);
}
