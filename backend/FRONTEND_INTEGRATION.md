# Quick Start Guide for Frontend Integration

## Backend Setup (Already Done)

The backend is now ready. Copy `.env.example` to `.env` and update with your database credentials:

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev
```

Server will start on `http://localhost:5000`

---

## Frontend Integration with React Native

### 1. Update iReport Frontend Dependencies

Add these packages to your React Native iReport app:

```bash
npm install socket.io-client axios
```

### 2. Create API Client Service

Create a new file: `iReport/iReport/services/apiClient.ts`

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-deployed-backend.com'
  : 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('school_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('school_auth_token');
      // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3. Create Socket.IO Service

Create a new file: `iReport/iReport/services/socketService.ts`

```typescript
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_IO_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-deployed-backend.com'
  : 'http://localhost:5000';

let socket: Socket;

export const initializeSocket = (userId: string) => {
  socket = io(SOCKET_IO_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    socket.emit('user:join', userId);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = (): Socket => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

// Event listeners
export const onReportCreated = (callback: (data: any) => void) => {
  getSocket().on('report:created', callback);
};

export const onReportUpdated = (callback: (data: any) => void) => {
  getSocket().on('report:updated', callback);
};

export const onNotification = (callback: (data: any) => void) => {
  getSocket().on('notification:received', callback);
};

// Emit events
export const submitReport = (reportData: any) => {
  getSocket().emit('report:submit', reportData);
};

export const updateReportStatus = (updateData: any) => {
  getSocket().emit('report:statusUpdate', updateData);
};

export const sendNotification = (recipientId: string, message: string) => {
  getSocket().emit('notification:send', { recipientId, message });
};
```

### 4. Update Auth Context to Use Backend

Update `iReport/iReport/contexts/AuthContext.tsx`:

```typescript
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import { initializeSocket, disconnectSocket } from '@/services/socketService';

const STORAGE_KEY = 'school_auth_token';
const USER_KEY = 'school_current_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = await AsyncStorage.getItem(STORAGE_KEY);
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          setCurrentUser(response.data.data);
          setIsAuthenticated(true);
          // Initialize socket when user is authenticated
          initializeSocket(response.data.data.id);
        } catch (error) {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setIsAuthenticated(false);
        }
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user } = response.data.data;

      await AsyncStorage.setItem(STORAGE_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      setCurrentUser(user);
      setIsAuthenticated(true);

      // Initialize socket
      initializeSocket(user.id);

      return { success: true, user };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string, role: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        fullName,
        email,
        password,
        role,
      });
      const { token, user } = response.data.data;

      await AsyncStorage.setItem(STORAGE_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      setCurrentUser(user);
      setIsAuthenticated(true);

      // Initialize socket
      initializeSocket(user.id);

      return { success: true, user };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      disconnectSocket();
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
});
```

### 5. Update Report Context to Use Backend

Create API calls for reports in `iReport/iReport/contexts/ReportContext.tsx`:

```typescript
import apiClient from '@/services/apiClient';
import { onReportCreated, onReportUpdated, submitReport } from '@/services/socketService';

// In your ReportContext, replace AsyncStorage calls with API calls:

const createReportMutation = useMutation({
  mutationFn: async (reportData: IncidentReport) => {
    const response = await apiClient.post('/reports', {
      reporterName: reportData.reporterName,
      reporterLrn: reportData.reporterLRN,
      incidentDate: reportData.incidentDate,
      incidentType: reportData.type,
      description: reportData.description,
      building: reportData.location?.building,
      floor: reportData.location?.floor,
      room: reportData.location?.room,
      involvedStudentIds: reportData.involvedStudentIds,
    });
    return response.data.data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    // Emit via socket for real-time sync
    submitReport(data);
  },
});

// Listen for real-time report creation
useEffect(() => {
  onReportCreated((newReport) => {
    // Update local reports list
    queryClient.invalidateQueries({ queryKey: ['reports'] });
  });
}, []);
```

---

## Testing Multi-Device Sync

### 1. Start Backend
```bash
cd backend
npm run dev
# Output: Server running on http://localhost:5000
```

### 2. Device 1 (Your Laptop)
- Open app
- Login with test account
- Navigate to create report
- Submit a report

### 3. Device 2 (Friend's Laptop)
- Open app on friend's computer
- Login (same or different account)
- Navigate to reports list
- **Report should appear in real-time!**

### 4. Test Real-time Status Update
- Device 1: Submit report
- Device 2: Change report status
- Device 1: Status should update instantly without refreshing

---

## Environment Variables for Deployment

When deploying to production:

```env
# .env.production
NODE_ENV=production
API_BASE_URL=https://your-deployed-backend.com
SOCKET_IO_URL=https://your-deployed-backend.com
```

Update your React Native app to use environment variables:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000' 
  : 'https://your-deployed-backend.com';
```

---

## Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution:**
- Verify backend is running: `curl http://localhost:5000/health`
- Check API_BASE_URL matches backend address
- Ensure same WiFi network for both devices

### Issue: "Socket connection timeout"
**Solution:**
- Check SOCKET_IO_URL is correct
- Verify firewall allows port 5000
- Check browser console for connection errors

### Issue: "Token expired"
**Solution:**
- Backend automatically handles 401 and redirects to login
- Token is stored in AsyncStorage

---

## Next Steps

1. ✅ Backend is ready
2. 📱 Add Socket.IO client to frontend
3. 🔌 Connect API endpoints to your components
4. 🌍 Deploy to cloud (Railway or Render)
5. 🎉 Demo with 2 devices!
