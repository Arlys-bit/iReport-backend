# API Documentation

## Base URL
- **Development**: `http://localhost:5000`
- **Production**: `https://your-deployed-backend.com`

## Authentication

All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### Authentication Endpoints

#### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@school.edu",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@school.edu",
      "fullName": "John Doe",
      "role": "teacher"
    }
  }
}
```

---

#### Register
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane@school.edu",
  "password": "securePassword123",
  "role": "student"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "jane@school.edu",
      "fullName": "Jane Smith",
      "role": "student"
    }
  }
}
```

---

#### Get Current User
```
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@school.edu",
    "role": "teacher"
  }
}
```

---

### Report Endpoints

#### Create Incident Report
```
POST /api/reports
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reporterName": "John Doe",
  "reporterLrn": "LRN123456",
  "incidentDate": "2024-02-20T10:30:00Z",
  "incidentType": "Physical Bullying",
  "description": "Student engaged in bullying behavior at the cafeteria",
  "building": "A",
  "floor": "2nd",
  "room": "Cafeteria",
  "involvedStudentIds": ["uuid1", "uuid2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reporterId": "uuid",
    "status": "under_review",
    "createdAt": "2024-02-20T10:30:00Z"
  }
}
```

---

#### Get All Reports
```
GET /api/reports
```

**Query Parameters:**
- `status` (optional): `under_review`, `accepted`, `declined`
- `reporterId` (optional): Filter by reporter
- `limit` (optional): Number of results (default: all)

**Example:**
```
GET /api/reports?status=under_review&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reporterName": "John Doe",
      "status": "under_review",
      "incidentType": "Physical Bullying",
      "createdAt": "2024-02-20T10:30:00Z"
    }
  ]
}
```

---

#### Get Report by ID
```
GET /api/reports/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reporterId": "uuid",
    "reporterName": "John Doe",
    "incidentDate": "2024-02-20T10:30:00Z",
    "status": "under_review",
    "reviewHistory": [
      {
        "id": "uuid",
        "reviewerId": "uuid",
        "action": "submitted",
        "timestamp": "2024-02-20T10:30:00Z"
      }
    ]
  }
}
```

---

#### Update Report Status
```
PUT /api/reports/:id/status
```

**Required Roles:** `admin`, `principal`, `guidance`

**Request Body:**
```json
{
  "status": "accepted",
  "notes": "Report reviewed and approved"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "accepted",
    "updatedAt": "2024-02-20T10:45:00Z"
  }
}
```

---

#### Delete Report
```
DELETE /api/reports/:id
```

**Required Roles:** `admin`, `principal`

**Response (200):**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

---

### Student Endpoints

#### Create Student
```
POST /api/students
```

**Required Roles:** `admin`, `principal`

**Request Body:**
```json
{
  "userId": "uuid",
  "lrn": "LRN-2024-001",
  "gradeLevelId": "uuid",
  "sectionId": "uuid",
  "schoolEmail": "student@school.edu",
  "assignedTeacherId": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "lrn": "LRN-2024-001",
    "createdAt": "2024-02-20T10:30:00Z"
  }
}
```

---

#### Get All Students
```
GET /api/students
```

**Query Parameters:**
- `gradeLevelId` (optional): Filter by grade
- `sectionId` (optional): Filter by section

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "lrn": "LRN-2024-001",
      "fullName": "Jane Smith",
      "email": "jane@school.edu"
    }
  ]
}
```

---

#### Get Student by ID
```
GET /api/students/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "lrn": "LRN-2024-001",
    "fullName": "Jane Smith",
    "email": "jane@school.edu",
    "violationHistory": [
      {
        "id": "uuid",
        "type": "Physical Bullying",
        "date": "2024-02-20T10:30:00Z",
        "status": "accepted"
      }
    ]
  }
}
```

---

#### Update Student
```
PUT /api/students/:id
```

**Required Roles:** `admin`, `principal`

**Request Body:** (any field to update)
```json
{
  "gradeLevelId": "uuid",
  "sectionId": "uuid",
  "assignedTeacherId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "lrn": "LRN-2024-001",
    "updatedAt": "2024-02-20T10:45:00Z"
  }
}
```

---

## Socket.IO Events

Real-time events for multi-device sync:

### Client → Server

#### User Join
```javascript
socket.emit('user:join', userId)
```

#### Submit Report
```javascript
socket.emit('report:submit', reportData)
```

#### Update Report Status
```javascript
socket.emit('report:statusUpdate', updateData)
```

#### Send Notification
```javascript
socket.emit('notification:send', {
  recipientId: 'uuid',
  message: 'Report status updated'
})
```

### Server → Client

#### User Joined
```javascript
socket.on('user:joined', { userId, socketId })
```

#### Report Created (Broadcast)
```javascript
socket.on('report:created', reportData)
```

#### Report Updated (Broadcast)
```javascript
socket.on('report:updated', updateData)
```

#### Notification Received
```javascript
socket.on('notification:received', { recipientId, message })
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Error details"
}
```
