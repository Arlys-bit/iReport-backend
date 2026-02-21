import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  // Database
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'ireport_db',
    user: process.env.DB_USER || 'ireport_user',
    password: process.env.DB_PASSWORD || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change_me_in_production',
    expiresIn: process.env.JWT_EXPIRE || '7d',
  },

  // CORS - For production/mobile, allow all origins or set via environment
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.CORS_ORIGIN || '*').split(',')
      : (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:19000,http://localhost:8081,http://127.0.0.1:5000').split(','),
  },

  // Socket.IO
  socketIO: {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? (process.env.SOCKET_IO_CORS || '*')
        : (process.env.SOCKET_IO_CORS || 'http://localhost:3000,http://localhost:19000,http://localhost:8081,http://127.0.0.1:5000').split(','),
      methods: ['GET', 'POST'],
    },
  },

  // App
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

export default config;
