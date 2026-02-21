# Railway Deployment Guide for iReport Backend

## Prerequisites

1. **Railway Account** - Sign up at https://railway.app
2. **GitHub Account** - For connecting repository
3. **PostgreSQL Add-on** - Railway will provision this automatically

## Quick Start (5 minutes)

### Step 1: Prepare Your Code

Ensure your backend code is in a git repository:

```bash
cd c:\Users\Arl\Downloads\iReport_backend_version
git init
git add .
git commit -m "Initial commit: iReport backend with Socket.IO"
```

### Step 2: Push to GitHub

Create a new repository on GitHub and push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ireport-backend.git
git branch -M main
git push -u origin main
```

### Step 3: Create Railway Project

1. Go to **https://railway.app/dashboard**
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Choose your repository: `ireport-backend`
5. Railway will auto-detect Node.js and create the service

### Step 4: Configure Environment Variables

In Railway Dashboard, go to **Variables** tab and add:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=http://localhost:19006,http://localhost:3000,http://192.168.1.X:8081
PORT=3000
NODE_ENV=production
```

**How to get DATABASE_URL:**

1. Add PostgreSQL add-on in Railway
2. Click PostgreSQL service
3. Copy the CONNECTION_STRING from **Connect** tab
4. Paste as DATABASE_URL

### Step 5: Add PostgreSQL Database

1. In Railway project dashboard, click **"+ Add Service"**
2. Select **PostgreSQL**
3. Wait for it to provision (2-3 minutes)
4. The DATABASE_URL will auto-populate

### Step 6: Deploy

1. Push code to main branch:
   ```bash
   git push origin main
   ```

2. Railway automatically deploys when it detects changes

3. Watch deployment logs in Railway dashboard

### Step 7: Run Database Migrations

Once deployed, run migrations on Railway database:

```bash
# Get your Railway app's node environment
railway shell

# Run migrations
npm run migrate

# Run seed data (optional, for test accounts)
npm run seed

# Exit
exit
```

## Environment Variables Explained

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://...` | From PostgreSQL add-on |
| `JWT_SECRET` | `your-secret-key-123` | Keep this SECRET! Change it! |
| `CORS_ORIGIN` | `http://localhost:19006` | Your frontend URL(s) |
| `PORT` | `3000` | Railway assigns dynamically (ignore this) |
| `NODE_ENV` | `production` | For production deployment |

## Get Your Live Backend URL

After deployment:

1. Go to Railway dashboard
2. Click your iReport-backend service
3. Go to **Settings** tab
4. Copy **Public URL** (e.g., `https://ireport-backend-prod.railway.app`)

## Update Frontend to Use Railway URL

Update your React Native app to use the Railway URL:

**File:** `iReport/iReport/services/apiClient.ts`

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://YOUR_RAILWAY_URL';
// or
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://ireport-backend-prod.railway.app';
```

Then set environment variable in Expo:

**Terminal:**
```bash
export EXPO_PUBLIC_API_URL=https://your-railway-url.railway.app
```

## Troubleshooting

### "Database connection failed"

- Check `DATABASE_URL` is correct
- Ensure PostgreSQL service is running in Railway
- Run migrations: `railway exec npm run migrate`

### "Port 5000 already in use"

- Railway uses random ports, don't hardcode port 5000
- Use `process.env.PORT || 3000` in your code

### "CORS errors"

- Add frontend URL to `CORS_ORIGIN` variable
- Include both localhost (dev) and production URLs

### Deployment stuck

- Check logs in Railway: **Deployments** tab
- Ensure `npm run build` succeeds locally
- Verify all environment variables are set

## Test Deployment

Once live, test your endpoints:

```bash
# Test health check
curl https://your-railway-url/health

# Test login
curl -X POST https://your-railway-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"admin123"}'
```

## Cost

- **Free tier**: 5GB disk, shared CPU
- **Paid**: Pay-as-you-go ($0.39/hour minimum)
- **PostgreSQL**: $20/month minimum

## Next Steps

1. ✅ Prepare code for git
2. ✅ Push to GitHub
3. ✅ Connect Railway to GitHub
4. ✅ Add PostgreSQL
5. ✅ Set environment variables
6. ✅ Deploy and test
7. ✅ Update frontend to use Railway URL
8. ✅ Test 2-device sync with live URL

---

**Need Help?**

- Railway Docs: https://docs.railway.app
- Discord Support: https://railway.app/chat
- GitHub Issues: Create issue in your repository
