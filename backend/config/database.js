import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;
const shouldEnableSSL = (() => {
  if (process.env.DB_SSL === 'true') {
    return true;
  }
  if (process.env.DB_SSL === 'false') {
    return false;
  }
  return Boolean(connectionString && !connectionString.includes('localhost'));
})();

const poolConfig = connectionString
  ? {
      connectionString,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'alok_library',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };

if (shouldEnableSSL) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

