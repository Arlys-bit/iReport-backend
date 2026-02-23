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
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
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

// API-prefixed auth endpoint
app.post('/api/auth/login', (req, res) => {
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

// Mock students endpoint (both /students and /api/students)
const mockStudents = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john@school.com',
    gradeLevel: '10',
    section: 'A',
    schoolEmail: 'john.doe@school.edu',
    gradeLevelId: 'g10',
    sectionId: 'sec_a',
    lrn: 'LRN001',
    role: 'student',
    isActive: true,
    violationHistory: []
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    email: 'jane@school.com',
    gradeLevel: '10',
    section: 'B',
    schoolEmail: 'jane.smith@school.edu',
    gradeLevelId: 'g10',
    sectionId: 'sec_b',
    lrn: 'LRN002',
    role: 'student',
    isActive: true,
    violationHistory: []
  }
];

// Endpoint for backward compatibility
app.get('/students', (req, res) => {
  res.json({ data: mockStudents });
});

// API endpoints with /api prefix
app.get('/api/students', (req, res) => {
  res.json({ data: mockStudents });
});

app.post('/api/students', (req, res) => {
  const { fullName, email, lrn, gradeLevelId, sectionId, schoolEmail, password } = req.body;
  
  if (!fullName || !email || !lrn) {
    return res.status(400).json({ error: 'Full name, email, and LRN are required' });
  }
  
  const newStudent = {
    id: 'student_' + Date.now(),
    fullName,
    email,
    lrn,
    gradeLevelId: gradeLevelId || 'g10',
    sectionId: sectionId || 'sec_a',
    schoolEmail: schoolEmail || '',
    gradeLevel: gradeLevelId || '10',
    section: sectionId || 'A',
    role: 'student',
    isActive: true,
    violationHistory: [],
    createdAt: new Date().toISOString()
  };
  
  mockStudents.push(newStudent);
  res.status(201).json({ data: newStudent });
});

app.put('/api/auth/students/:id/email', (req, res) => {
  const { id } = req.params;
  const { newEmail } = req.body;
  
  if (!newEmail) {
    return res.status(400).json({ error: 'New email is required' });
  }
  
  const student = mockStudents.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  student.email = newEmail;
  res.json({ data: student, message: 'Email updated successfully' });
});

app.put('/api/auth/students/:id/password', (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  
  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }
  
  const student = mockStudents.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  res.json({ data: student, message: 'Password updated successfully' });
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

app.get('/api/reports', (req, res) => {
  res.json({
    data: [
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
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[START] Server running on port ${PORT}`);
  console.log(`[READY] Health check: http://localhost:${PORT}/health`);
});

export default app;
