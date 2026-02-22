import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config/index.js';
import { initializeSocketIO } from './utils/socketIO.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import studentRoutes from './routes/students.js';
import { runMigrations } from './database/migrations.js';
import { seedDatabase } from './database/seed.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO safely
let io;
try {
  io = initializeSocketIO(httpServer);
} catch (err) {
  console.error('Socket.IO initialization error:', err);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/debug', (req, res) => {
  res.json({ 
    status: 'running',
    port: config.port,
    env: config.env,
    timestamp: new Date().toISOString()
  });
});

// API Routes - disabled for now
// app.use('/api/auth', authRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/students', studentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database initialization and server start
const initializeAndStart = async () => {
  try {
    console.log('Starting iReport Backend...');
    console.log('Environment:', config.env);
    console.log('Port:', config.port);
    
    // Start server first, no database initialization
    httpServer.listen(config.port, '0.0.0.0', () => {
      console.log('iReport Backend API is Running on port ' + config.port);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
initializeAndStart();

export default app;
