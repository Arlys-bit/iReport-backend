# Deployment Guide

## Cloud Deployment Strategy

### Step 1: Choose Cloud Provider

**Recommended Options:**

1. **Railway** (Easiest for beginners)
   - Built-in PostgreSQL support
   - Free tier includes $5/month
   - GitHub integration for auto-deploy

2. **Render** 
   - Free tier available
   - Easy Docker support
   - PostgreSQL databases included

3. **Vercel** (with Serverless Functions)
   - Good for lightweight APIs
   - Free tier available
   - PostgreSQL via Vercel Storage

### Step 2: Prepare for Deployment

#### 2.1 Environment Variables
Create a `.env.production` file with:
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@cloud-host:5432/ireport_db
JWT_SECRET=your-super-secret-production-jwt-key-change-this
CORS_ORIGIN=https://your-frontend-domain.com
SOCKET_IO_CORS=https://your-frontend-domain.com
```

#### 2.2 Build Configuration
```bash
npm install
npm run build
npm start
```

### Step 3: Deploy to Railway (Recommended)

1. **Sign up at railway.app**

2. **Connect GitHub repository**
   - Project → New → GitHub Repo → Select your repo

3. **Add PostgreSQL Database**
   - Project → Add Service → Database → PostgreSQL

4. **Configure Environment Variables**
   ```
   NODE_ENV=production
   JWT_SECRET=<your-secret>
   DATABASE_URL=<railway-generated-url>
   CORS_ORIGIN=https://your-app.vercel.app
   ```

5. **Deploy**
   - Push to main branch
   - Railway auto-deploys

### Step 4: Deploy to Render

1. **Sign up at render.com**

2. **Create Web Service**
   - New → Web Service → Connect GitHub

3. **Configure Build & Start**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **Add PostgreSQL**
   - New → PostgreSQL
   - Connect to your web service

5. **Set Environment Variables**
   - Settings → Environment → Add variables

### Step 5: Friend's Laptop as Backup

1. **Install PostgreSQL locally**
   ```bash
   # Windows
   choco install postgresql
   
   # macOS
   brew install postgresql
   
   # Linux
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Create database**
   ```bash
   createdb ireport_db
   ```

3. **Clone backend code**
   ```bash
   git clone <your-repo>
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with local credentials
   npm run migrate
   npm run dev
   ```

4. **Make accessible to other devices**
   ```bash
   # Find your laptop IP
   ipconfig getifaddr en0  # macOS
   ipconfig              # Windows
   
   # Update .env with your IP:PORT
   ```

### Step 6: Frontend Connection Configuration

Update your React Native app to connect to backend:

```typescript
// Frontend Connection for Development
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-deployed-backend.com'
  : 'http://localhost:5000'; // or your friend's laptop IP:5000

// Socket.IO Connection
const SOCKET_IO_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-deployed-backend.com'
  : 'http://localhost:5000';
```

### Step 7: Testing Multi-Device Sync

1. **Device 1 (Your laptop)**: Connect to Backend
   - Open app on your computer

2. **Device 2 (Friend's laptop)**: Connect to Same Backend
   - Open app on friend's computer
   - Both should use same backend URL

3. **Test Real-time Updates**
   - Device 1: Create incident report
   - Device 2: Should see report immediately
   - Device 1: Update report status
   - Device 2: Should see status change instantly

### Troubleshooting Deployment

**Database Connection Error**
- Check DATABASE_URL is correct
- Verify PostgreSQL is running
- Check firewall allows port 5432

**CORS Error**
- Add frontend domain to CORS_ORIGIN in .env
- Format: `https://domain.com,http://localhost:3000`

**Socket.IO Connection Failed**
- Check SOCKET_IO_CORS matches frontend domain
- Ensure WebSocket is enabled on cloud provider
- Check firewall allows WebSocket connections

**SSL/TSL Certificate Issues**
- Most cloud providers auto-generate SSL
- Use HTTPS (not HTTP) in CORS_ORIGIN

## Monitoring

### Logs
```bash
# Railway
railway logs

# Render
Watch logs in dashboard

# Local
npm run dev  # See console output
```

### Health Check
```bash
curl https://your-backend.com/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-20T10:30:00Z"
}
```

## Database Backup

### Before Presentation
```bash
# Export database
pg_dump ireport_db > backup.sql

# On friend's laptop, restore if needed
psql ireport_db < backup.sql
```

## Performance Tips

1. Add indexes for frequently queried columns (already done)
2. Implement pagination for large datasets
3. Cache popular queries
4. Monitor database performance

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use HTTPS for all connections
- [ ] Set strong database password
- [ ] Enable firewall on database
- [ ] Limit API rate (TODO: implement)
- [ ] Use environment variables for secrets
- [ ] Enable logging for audit trail
