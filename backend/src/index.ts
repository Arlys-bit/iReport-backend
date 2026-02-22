#!/usr/bin/env node

console.log('[START] Process PID:', process.pid);
console.log('[START] Node version:', process.version);
console.log('[START] Environment:', process.env.NODE_ENV);

try {
  console.log('[LOAD] Loading Express...');
  const express = require('express');
  console.log('[LOAD] Express loaded successfully');
  
  const app = express();
  
  console.log('[SETUP] Setting up health check endpoint');
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  app.get('/', (req, res) => {
    res.json({ message: 'iReport Backend Ready', version: '1.0.0' });
  });
  
  console.log('[SETUP] Creating server...');
  const PORT = parseInt(process.env.PORT || '3000', 10);
  console.log('[SETUP] PORT:', PORT);
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SUCCESS] Server listening on 0.0.0.0:${PORT}`);
    console.log('[SUCCESS] Health check available at /health');
  });
  
  server.on('error', (err) => {
    console.error('[ERROR] Server error:', err);
    process.exit(1);
  });
  
  process.on('SIGTERM', () => {
    console.log('[SHUTDOWN] SIGTERM received, graceful shutdown starting');
    server.close(() => {
      console.log('[SHUTDOWN] Server closed gracefully');
      process.exit(0);
    });
  });
  
  process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught exception:', err);
    process.exit(1);
  });
  
  module.exports = app;
  
} catch (error) {
  console.error('[FATAL] Startup error:', error);
  process.exit(1);
}
