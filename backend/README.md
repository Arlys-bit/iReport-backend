# iReport Backend API

School Incident Reporting System Backend - Node.js + Express + PostgreSQL + Socket.IO

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### Database Setup

```bash
npm run migrate
npm run seed  # Optional: seed with sample data
```

### Development

```bash
npm run dev
```

Server runs on http://localhost:5000

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student by ID

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create incident report
- `GET /api/reports/:id` - Get report by ID
- `PUT /api/reports/:id` - Update report
- `PUT /api/reports/:id/status` - Update report status

### Real-time Events (Socket.IO)
- `report:created` - New report submitted
- `report:updated` - Report status changed
- `notification:new` - New notification for user

## Database Schema

See [Database Documentation](./docs/database.md)

## Deployment

### Cloud Deployment (Vercel, Railway, Render, etc.)

1. Set environment variables in cloud platform
2. Deploy using Git
3. Ensure PostgreSQL is configured on cloud platform

### Docker Deployment

```bash
docker build -t ireport-backend .
docker run -p 5000:5000 --env-file .env ireport-backend
```

## Architecture

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── database/        # Database connection & migrations
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── services/        # Business logic
├── types/           # TypeScript types
├── utils/           # Utility functions
└── index.ts         # Entry point
```
