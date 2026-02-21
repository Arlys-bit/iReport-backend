import io, { Socket } from 'socket.io-client';

// Production URL: https://ireport-backend-production.up.railway.app
// For local development: http://localhost:5001
const SOCKET_IO_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

let socket: Socket | null = null;

export const initializeSocket = (userId: string) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_IO_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    socket?.emit('user:join', userId);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
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
    socket = null;
  }
};

export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

// Event listeners for reports
export const onReportCreated = (callback: (data: any) => void) => {
  getSocket().on('report:created', callback);
};

export const offReportCreated = () => {
  getSocket().off('report:created');
};

export const onReportUpdated = (callback: (data: any) => void) => {
  getSocket().on('report:updated', callback);
};

export const offReportUpdated = () => {
  getSocket().off('report:updated');
};

// Event listeners for notifications
export const onNotification = (callback: (data: any) => void) => {
  getSocket().on('notification:received', callback);
};

export const offNotification = () => {
  getSocket().off('notification:received');
};

// Emit events
export const submitReport = (reportData: any) => {
  getSocket().emit('report:submit', reportData);
};

export const updateReportStatusSocket = (updateData: any) => {
  getSocket().emit('report:statusUpdate', updateData);
};

export const sendNotification = (recipientId: string, message: string) => {
  getSocket().emit('notification:send', { recipientId, message });
};
