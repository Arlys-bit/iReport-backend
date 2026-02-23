#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'iReport Backend API', version: '1.0.0' });
});

// Mock auth endpoint
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  // Mock token
  res.json({
    token: 'mock_token_' + Date.now(),
    user: {
      id: 'user_123',
      email: email,
      role: 'student'
    }
  });
});

// Mock students endpoint
app.get('/students', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@school.com',
      gradeLevel: '10',
      section: 'A',
      schoolEmail: 'john.doe@school.edu'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@school.com',
      gradeLevel: '10',
      section: 'B',
      schoolEmail: 'jane.smith@school.edu'
    }
  ]);
});

// Mock reports endpoint
app.get('/reports', (req, res) => {
  res.json([
    {
      id: '1',
      title: 'Incident Report 1',
      description: 'Test incident',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Incident Report 2',
      description: 'Another test',
      status: 'resolved',
      createdAt: new Date().toISOString()
    }
  ]);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[START] Server running on port ${PORT}`);
  console.log(`[READY] Health check: http://localhost:${PORT}/health`);
});

export default app;
