import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config/index.js';

let io: SocketIOServer;

export const initializeSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: config.socketIO.cors,
    transports: ['websocket', 'polling'],
  });

  // Track connected users
  const connectedUsers = new Map<string, string[]>();

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins with their user ID
    socket.on('user:join', (userId: string) => {
      socket.join(`user:${userId}`);
      
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, []);
      }
      connectedUsers.get(userId)!.push(socket.id);

      socket.emit('user:joined', { userId, socketId: socket.id });
      console.log(`User ${userId} joined (${socket.id})`);
    });

    // New report submitted
    socket.on('report:submit', (data) => {
      // Broadcast to all staff members
      io.emit('report:created', data);
      console.log('Report submitted:', data.id);
    });

    // Report status updated
    socket.on('report:statusUpdate', (data) => {
      io.emit('report:updated', data);
      console.log('Report updated:', data.id);
    });

    // Send notification to specific user
    socket.on('notification:send', (data: { recipientId: string; message: string }) => {
      io.to(`user:${data.recipientId}`).emit('notification:received', data);
    });

    // User leaves
    socket.on('disconnect', () => {
      connectedUsers.forEach((sockets, userId) => {
        const index = sockets.indexOf(socket.id);
        if (index > -1) {
          sockets.splice(index, 1);
          if (sockets.length === 0) {
            connectedUsers.delete(userId);
          }
        }
      });
      console.log(`Socket disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  getIO().to(`user:${userId}`).emit(event, data);
};

export const broadcastToAll = (event: string, data: any) => {
  getIO().emit(event, data);
};

export default { initializeSocketIO, getIO, emitToUser, broadcastToAll };
