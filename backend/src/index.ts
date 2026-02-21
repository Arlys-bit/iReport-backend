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

// Initialize Socket.IO
const io = initializeSocketIO(httpServer);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/students', studentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database initialization and server start
const initializeAndStart = async () => {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  DATABASE_URL not set, skipping migrations');
      console.warn('Set DATABASE_URL environment variable and restart to run migrations');
    } else {
      console.log('🔧 Initializing database...');
      await runMigrations();
      await seedDatabase();
      console.log('✅ Database initialized');
    }

    httpServer.listen(config.port, () => {
      console.log(`
╭─────────────────────────────────────╮
│   iReport Backend API is Running    │
├─────────────────────────────────────┤
│   🌐 Server: http://localhost:${config.port}        │
│   📡 WebSocket: ws://localhost:${config.port}        │
│   🗄️  Database: ${config.database.name}           │
│   🔐 JWT Secret: ${config.jwt.secret.substring(0, 10)}...    │
╰─────────────────────────────────────╯
      `);
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
