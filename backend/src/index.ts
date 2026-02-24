#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Middleware (apply before Socket.IO routes)
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

// GET /api/pull - Pull all data from backend (students, staff, sections, reports, grades)
app.get('/api/pull', (req, res) => {
  const sectionsWithGradeLevelId = mockSections.map(s => ({
    ...s,
    gradeLevelId: s.gradeLevel,
    gradeLevel: undefined
  }));

  const staffList = global.mockStaff || [];

  res.json({
    data: {
      students: mockStudents,
      staff: staffList,
      sections: sectionsWithGradeLevelId,
      gradeLevels: [
        { id: 'g7', name: 'Grade 7', order: 1, isActive: true },
        { id: 'g8', name: 'Grade 8', order: 2, isActive: true },
        { id: 'g9', name: 'Grade 9', order: 3, isActive: true },
        { id: 'g10', name: 'Grade 10', order: 4, isActive: true },
        { id: 'g11', name: 'Grade 11', order: 5, isActive: true },
        { id: 'g12', name: 'Grade 12', order: 6, isActive: true },
      ],
      reports: mockReports,
      admin: mockAdmin,
      timestamp: new Date().toISOString(),
    }
  });
});

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  
  socket.on('user:join', (userId) => {
    console.log('User joined:', userId, 'with socket:', socket.id);
    socket.join(`user:${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

const PORT = parseInt(process.env.PORT || '3000', 10);

// Helper function to determine user role based on email
const getUserRoleFromEmail = (email: string): string => {
  if (email.includes('admin')) {
    return 'admin';
  } else if (email.includes('teacher') || email.includes('staff')) {
    return 'staff';
  }
  return 'student';
};

// Helper function to generate user ID based on email
const getUserIdFromEmail = (email: string): string => {
  const base = email.split('@')[0];
  return `user_${base}_${Date.now().toString().slice(-4)}`;
};

// Mock sections array
const mockSections = [
  // Grade 7
  { id: 'sec_g7_a', name: 'Section A', gradeLevel: 'g7', order: 1 },
  { id: 'sec_g7_b', name: 'Section B', gradeLevel: 'g7', order: 2 },
  // Grade 8
  { id: 'sec_g8_a', name: 'Section A', gradeLevel: 'g8', order: 1 },
  { id: 'sec_g8_b', name: 'Section B', gradeLevel: 'g8', order: 2 },
  // Grade 9
  { id: 'sec_g9_a', name: 'Section A', gradeLevel: 'g9', order: 1 },
  { id: 'sec_g9_b', name: 'Section B', gradeLevel: 'g9', order: 2 },
  // Grade 10
  { id: 'sec_g10_a', name: 'Section A', gradeLevel: 'g10', order: 1 },
  { id: 'sec_g10_b', name: 'Section B', gradeLevel: 'g10', order: 2 },
  { id: 'sec_g10_c', name: 'Section C', gradeLevel: 'g10', order: 3 },
  // Grade 11
  { id: 'sec_g11_a', name: 'Section A', gradeLevel: 'g11', order: 1 },
  { id: 'sec_g11_b', name: 'Section B', gradeLevel: 'g11', order: 2 },
  // Grade 12
  { id: 'sec_g12_a', name: 'Section A', gradeLevel: 'g12', order: 1 },
  { id: 'sec_g12_b', name: 'Section B', gradeLevel: 'g12', order: 2 },
];

// Mock admin user
const mockAdmin = {
  id: 'admin_1',
  fullName: 'Admin User',
  email: 'admin@school.edu',
  schoolEmail: 'admin@school.edu',
  password: 'admin123',
  role: 'admin',
  position: 'principal',
  staffId: 'ADMIN001',
  isActive: true,
  createdAt: new Date().toISOString()
};

// Mock students array
const mockStudents = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john@school.com',
    gradeLevel: '10',
    section: 'A',
    schoolEmail: 'john.doe@school.edu',
    gradeLevelId: 'g10',
    sectionId: 'sec_g10_a',
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
    sectionId: 'sec_g10_b',
    lrn: 'LRN002',
    role: 'student',
    isActive: true,
    violationHistory: []
  }
];

// Mock reports array for persistence
let mockReports: any[] = [];

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
  
  const role = getUserRoleFromEmail(email);
  const userId = getUserIdFromEmail(email);
  
  // Generate full staff data
  const fullName = email.split('@')[0]
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const staffId = `STAFF${Date.now().toString().slice(-6)}`;
  const schoolEmail = email;
  const position = role === 'admin' ? 'principal' : role === 'staff' ? 'teacher' : 'student_user';
  
  // Mock token
  res.json({
    data: {
      token: 'mock_token_' + Date.now(),
      user: {
        id: userId,
        email: email,
        role: role,
        fullName: fullName,
        staffId: staffId,
        schoolEmail: schoolEmail,
        position: position
      }
    }
  });
});

// API login endpoint - checks against created accounts
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Check admin user first
  if (mockAdmin && (mockAdmin.email === email || mockAdmin.schoolEmail === email)) {
    return res.json({
      data: {
        token: 'mock_token_' + Date.now(),
        user: {
          id: mockAdmin.id,
          email: mockAdmin.email,
          role: 'admin',
          fullName: mockAdmin.fullName,
          staffId: mockAdmin.staffId,
          schoolEmail: mockAdmin.schoolEmail,
          position: mockAdmin.position
        }
      }
    });
  }

  // Check in students
  const student = mockStudents.find(s => s.email === email || s.schoolEmail === email);
  if (student) {
    return res.json({
      data: {
        token: 'mock_token_' + Date.now(),
        user: {
          id: student.id,
          email: student.email,
          role: 'student',
          fullName: student.fullName,
          gradeLevelId: student.gradeLevelId,
          sectionId: student.sectionId,
          lrn: student.lrn,
          schoolEmail: student.schoolEmail
        }
      }
    });
  }

  // Check in staff
  const staff = (global.mockStaff || []).find(s => s.email === email || s.schoolEmail === email);
  if (staff) {
    return res.json({
      data: {
        token: 'mock_token_' + Date.now(),
        user: {
          id: staff.id,
          email: staff.email,
          role: staff.position === 'principal' || staff.position === 'vice_principal' ? 'admin' : 'staff',
          fullName: staff.fullName,
          staffId: staff.staffId,
          schoolEmail: staff.schoolEmail,
          position: staff.position
        }
      }
    });
  }

  // User not found
  return res.status(401).json({ error: 'Invalid email or password' });
});



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
  
  // Default to first section for the given grade level, or first section overall
  const defaultGradeLevel = gradeLevelId || 'g10';
  let assignedSectionId = sectionId;
  
  if (!assignedSectionId) {
    const sectionForGrade = mockSections.find(s => s.gradeLevel === defaultGradeLevel);
    assignedSectionId = sectionForGrade ? sectionForGrade.id : mockSections[0]?.id || 'sec_g10_a';
  }
  
  const assignedSection = mockSections.find(s => s.id === assignedSectionId) || { name: 'Unknown', gradeLevel: defaultGradeLevel };
  
  const newStudent = {
    id: 'student_' + Date.now(),
    fullName,
    email,
    lrn,
    gradeLevelId: defaultGradeLevel,
    sectionId: assignedSectionId,
    schoolEmail: schoolEmail || '',
    gradeLevel: gradeLevelId || '10',
    section: assignedSection.name,
    role: 'student',
    isActive: true,
    violationHistory: [],
    createdAt: new Date().toISOString()
  };
  
  mockStudents.push(newStudent);
  res.status(201).json({ data: newStudent });
});

// Staff creation endpoint
app.post('/api/staff', (req, res) => {
  const { fullName, staffId, schoolEmail, email, password, position, specialization, rank } = req.body;
  
  if (!fullName || !staffId || !schoolEmail) {
    return res.status(400).json({ error: 'Full name, staff ID, and school email are required' });
  }
  
  const newStaff = {
    id: 'staff_' + Date.now(),
    fullName,
    staffId,
    schoolEmail,
    email: email || schoolEmail,
    password,
    position: position || 'teacher',
    specialization: specialization || undefined,
    rank: rank || undefined,
    role: 'staff',
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  // Add to mock students array under a staff collection (or separate array)
  // For now, store in a virtual collection
  if (!global.mockStaff) {
    global.mockStaff = [];
  }
  global.mockStaff.push(newStaff);
  
  res.status(201).json({ data: newStaff });
});

// GET staff endpoint
app.get('/api/staff', (req, res) => {
  const staffList = global.mockStaff || [];
  res.json({ data: staffList });
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

// Helper function to format report ID
const generateReportId = () => `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Old mock reports endpoint for backward compatibility
app.get('/reports', (req, res) => {
  res.json(mockReports.length > 0 ? mockReports : [
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

// New API reports endpoints
app.get('/api/reports', (req, res) => {
  res.json({ data: mockReports });
});

app.post('/api/reports', (req, res) => {
  const {
    reporterId,
    reporterName,
    reporterGradeLevelId,
    reporterSectionId,
    buildingId,
    buildingName,
    floor,
    room,
    incidentType,
    description,
    status = 'pending',
  } = req.body;

  if (!reporterId || !reporterName || !incidentType || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newReport = {
    id: generateReportId(),
    reporterId,
    reporterName,
    reporterGradeLevelId,
    reporterSectionId,
    buildingId,
    buildingName,
    floor,
    room,
    incidentType,
    description,
    status,
    priority: incidentType === 'emergency' ? 'critical' : 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockReports.push(newReport);
  res.status(201).json({ data: newReport });
});

app.get('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const report = mockReports.find(r => r.id === id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  res.json({ data: report });
});

app.put('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const { status, description } = req.body;

  const report = mockReports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (status) report.status = status;
  if (description) report.description = description;
  report.updatedAt = new Date().toISOString();

  res.json({ data: report });
});

// Sections endpoint
app.get('/api/sections', (req, res) => {
  const sectionsWithGradeLevelId = mockSections.map(s => ({
    ...s,
    gradeLevelId: s.gradeLevel,
    gradeLevel: undefined
  }));
  res.json({ data: sectionsWithGradeLevelId });
});

app.post('/api/sections', (req, res) => {
  const { name, gradeLevelId, gradeLevel } = req.body;
  const grade = gradeLevelId || gradeLevel;
  
  if (!name || !grade) {
    return res.status(400).json({ error: 'Section name and grade level are required' });
  }
  
  const newSection = {
    id: 'sec_' + Date.now(),
    name,
    gradeLevel: grade,
    order: mockSections.filter(s => s.gradeLevel === grade).length + 1
  };
  
  mockSections.push(newSection);
  const sectionResponse = { ...newSection, gradeLevelId: newSection.gradeLevel };
  delete sectionResponse.gradeLevel;
  res.status(201).json({ data: sectionResponse });
});

app.delete('/api/sections/:id', (req, res) => {
  const { id } = req.params;
  const index = mockSections.findIndex(s => s.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Section not found' });
  }
  
  const deletedSection = mockSections.splice(index, 1)[0];
  res.json({ data: deletedSection, message: 'Section deleted successfully' });
});

// Grade levels endpoint
app.get('/api/grade-levels', (req, res) => {
  res.json({
    data: [
      { id: 'g7', name: 'Grade 7', order: 1, isActive: true },
      { id: 'g8', name: 'Grade 8', order: 2, isActive: true },
      { id: 'g9', name: 'Grade 9', order: 3, isActive: true },
      { id: 'g10', name: 'Grade 10', order: 4, isActive: true },
      { id: 'g11', name: 'Grade 11', order: 5, isActive: true },
      { id: 'g12', name: 'Grade 12', order: 6, isActive: true },
    ]
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[START] Server running on port ${PORT}`);
  console.log(`[READY] Health check: http://localhost:${PORT}/health`);
  console.log(`[READY] Socket.IO: ws://localhost:${PORT}`);
});

export default app;
