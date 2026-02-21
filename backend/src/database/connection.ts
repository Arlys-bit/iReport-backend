import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

let pool: pg.Pool;

export const getPool = (): pg.Pool => {
  if (!pool) {
    if (config.database.url) {
      pool = new Pool({
        connectionString: config.database.url,
        ssl: config.isProduction ? { rejectUnauthorized: false } : false,
      });
    } else {
      pool = new Pool({
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        password: config.database.password,
      });
    }

    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
};

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    if (config.isDevelopment) {
      console.log('Executed query', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
  }
};

export default { query, getPool, closePool };
