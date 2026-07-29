import pg from 'pg';

const { Pool } = pg;

let pool = null;
let connected = false;

function createPool() {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const database = process.env.DB_NAME || 'daas_test_app';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';

  return new Pool({
    host,
    port,
    database,
    user,
    password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export function isConnected() {
  return connected;
}

export async function ensureDatabase() {
  const localPool = getPool();
  const client = await localPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    connected = true;
    console.log('Database connected and table ensured.');
  } finally {
    client.release();
  }
}

export async function waitForDatabase(retries = 30, delayMs = 2000) {
  const localPool = getPool();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await localPool.connect();
      client.release();
      console.log(`Database connection established on attempt ${attempt}.`);
      return;
    } catch (err) {
      console.log(
        `Database connection attempt ${attempt}/${retries} failed: ${err.message}`
      );
      if (attempt === retries) {
        throw new Error(
          `Could not connect to database after ${retries} attempts.`
        );
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    connected = false;
  }
}

