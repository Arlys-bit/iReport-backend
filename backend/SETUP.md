# Setup Instructions - Complete Backend Guide

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: 12+
- **npm**: 8+
- **Git**: For version control

---

## ⚡ Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Database

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/ireport_db
```

### Step 3: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql:
CREATE DATABASE ireport_db;
CREATE USER ireport_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ireport_db TO ireport_user;
\q
```

### Step 4: Run Migrations & Seed Data

```bash
npm run migrate
npm run seed
```

### Step 5: Start Development Server

```bash
npm run dev
```

**Output:**
```
╭─────────────────────────────────────╮
│   iReport Backend API is Running    │
├─────────────────────────────────────┤
│   🌐 Server: http://localhost:5000  │
│   📡 WebSocket: ws://localhost:5000 │
│   🗄️  Database: ireport_db         │
╰─────────────────────────────────────╯
```

---

## 🔧 What Was Created

### Project Structure
```
backend/
├── src/
│   ├── config/              # Configuration setup
│   ├── controllers/         # Route handlers
│   ├── database/            # Database connection & migrations
│   ├── middleware/          # Authentication & error handling
│   ├── routes/              # API endpoint definitions
│   ├── services/            # Business logic
│   ├── types/               # TypeScript interfaces
│   ├── utils/               # Helper functions
│   └── index.ts             # Main server file
├── migrations/              # SQL migration scripts
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── .env.example             # Environment template
├── README.md                # Project overview
├── API.md                   # API documentation
├── DATABASE.md              # Database schema
├── DEPLOYMENT.md            # Deployment guide
└── FRONTEND_INTEGRATION.md  # Frontend setup guide
```

### Available Scripts

```bash
npm run dev              # Development with hot reload
npm run build            # TypeScript compilation
npm start                # Production start
npm run migrate          # Run database migrations
npm run seed             # Seed database with sample data
npm run lint             # Lint code
npm run typecheck        # Type check without emitting
```

---

## 📚 Key Features

### 1. **PostgreSQL Database**
- 9 tables (users, staff, students, reports, notifications, etc.)
- Proper relationships and indexes
- Support for schools with multiple buildings and sections

### 2. **REST API**
- Full CRUD for reports, students, and users
- JWT authentication
- Role-based access control (RBAC)
- Complete API documentation

### 3. **Real-time Synchronization**
- Socket.IO for live updates
- Instant report notifications across devices
- Status change broadcasts

### 4. **Security**
- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Role-based permissions

---

## 🌐 API Overview

### Authentication
```bash
POST /api/auth/login         # User login
POST /api/auth/register      # User registration
GET /api/auth/me             # Get current user
```

### Reports
```bash
GET /api/reports             # List all reports
POST /api/reports            # Create new report
GET /api/reports/:id         # Get specific report
PUT /api/reports/:id/status  # Update report status
DELETE /api/reports/:id      # Delete report
```

### Students
```bash
GET /api/students            # List all students
POST /api/students           # Create student
GET /api/students/:id        # Get student details
PUT /api/students/:id        # Update student
```

---

## 🔗 Frontend Integration

### Quick Connection

1. **Install dependencies in React Native**
```bash
npm install socket.io-client axios
```

2. **Copy the integration guide**
   - See `FRONTEND_INTEGRATION.md` for complete setup
   - Includes API client, Socket.IO service
   - Sample AuthContext and ReportContext updates

3. **Update API URL**
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000'
  : 'https://your-production-url.com';
```

---

## 🚀 Deployment Options

### Option A: Railway (Recommended)
- Easiest setup
- Built-in PostgreSQL
- Auto-deploy from GitHub
- Free tier available

See: **DEPLOYMENT.md** → Railway Section

### Option B: Render
- Free tier
- Easy Docker deployment
- PostgreSQL included

See: **DEPLOYMENT.md** → Render Section

### Option C: Friend's Laptop (Backup)
- Install PostgreSQL locally
- Clone repo
- Run backend server
- Make accessible via IP address

See: **DEPLOYMENT.md** → Friend's Laptop Section

---

## ✅ Testing Checklist

### Single Device
- [ ] Login works
- [ ] Create incident report
- [ ] View reports
- [ ] Update report status
- [ ] Create student record

### Multi-Device (2 Laptops)
- [ ] Both devices connected to same backend
- [ ] Device 1 creates report
- [ ] Device 2 sees report in real-time
- [ ] Device 2 updates report status
- [ ] Device 1 receives status update instantly

### Production Ready
- [ ] Changed JWT_SECRET
- [ ] Database credentials secure
- [ ] CORS_ORIGIN updated to frontend domain
- [ ] Tests pass (if added)
- [ ] Error handling works

---

## 🐛 Troubleshooting

### "Cannot find module" Error
```bash
npm install
```

### "Database connection failed"
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Recreate database
psql -U postgres
DROP DATABASE ireport_db;
CREATE DATABASE ireport_db;
```

### "Port 5000 already in use"
```bash
# Change port in .env or:
PORT=5001 npm run dev
```

### "Socket connection error"
- Check backend is running
- Verify API_BASE_URL in frontend matches backend address
- Check firewall allows port 5000
- Ensure both devices on same network (for friend's laptop)

---

## 📡 Network Setup for 2-Device Presentation

### Local Development (Both on Same Computer)
```
Computer A (Your Laptop)
├── Backend: localhost:5000
├── Frontend 1: http://localhost:3000
└── Frontend 2: http://localhost:3001
```

### WiFi Network (Both Computers)
```
Your Laptop          Friend's Laptop
└─ Backend: https://deployed-backend.com
└─ Frontend          └─ Frontend (same backend)
```

### Hybrid (Backup)
```
Friend's Laptop (Primary)
└─ Backend: http://192.168.1.100:5000
├─ Your Laptop connects to: http://192.168.1.100:5000
└─ Friend's Laptop connects to: http://localhost:5000
```

---

## 📖 Documentation Files

- **API.md** - Complete API endpoints with examples
- **DATABASE.md** - Database schema and relationships
- **DEPLOYMENT.md** - Production deployment instructions
- **FRONTEND_INTEGRATION.md** - React Native integration guide
- **README.md** - Project overview

---

## 🎯 Next Steps

### Before Presentation
1. [ ] Deploy to Railway/Render
2. [ ] Test multi-device sync on deployed backend
3. [ ] Create test data
4. [ ] Document any custom modifications
5. [ ] Practice demo with friend's laptop

### During Presentation
1. [ ] Open app on your laptop
2. [ ] Open app on friend's laptop
3. [ ] Both connect to same backend
4. [ ] Create incident report on Device 1
5. [ ] View live sync on Device 2
6. [ ] Update status on Device 2
7. [ ] See instant update on Device 1

---

## 💡 Tips for Success

- **Keep backend and frontend repos in sync** - Update both when making changes
- **Use environment variables** - Make it easy to switch between dev/prod
- **Test frequently** - Catch issues early
- **Document changes** - Make it easy for your teacher/group to understand
- **Have a backup plan** - Friend's laptop as failsafe

---

## 🤝 Need Help?

### Common Questions

**Q: Can I use MySQL instead of PostgreSQL?**
A: Yes, change the database URL in .env. Some SQL syntax may need adjusting.

**Q: How do I add more features?**
A: Add new routes in `src/routes/`, create controllers and services, update types.

**Q: Can I host for free?**
A: Yes, Railway and Render have free tiers. Friend's laptop also works for demo.

**Q: How many users can the backend support?**
A: Designed for school use (100-500 students). Scale with cloud provider.

---

## ✨ You're All Set!

Your backend is ready for:
- ✅ Multi-device synchronization
- ✅ Real-time incident reporting
- ✅ Production deployment
- ✅ School project presentation

**Good luck with your presentation! 🎉**
