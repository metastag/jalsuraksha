const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Defendteathread@41',
  database: process.env.DB_NAME || 'water_portal_db',
};

const pool = new Pool(dbConfig);

/**
 * Ensures the target database exists in PostgreSQL 18 before running schema migrations.
 */
async function ensureDatabaseExists() {
  const adminPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'postgres',
  });

  try {
    const res = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbConfig.database]
    );
    if (res.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`[DB] Created PostgreSQL database: ${dbConfig.database}`);
    }
  } finally {
    await adminPool.end();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  ensureDatabaseExists,
};
