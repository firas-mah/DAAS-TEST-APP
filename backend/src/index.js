import express from 'express';
import cors from 'cors';
import { waitForDatabase, ensureDatabase, isConnected, closePool } from './db.js';
import notesRouter from './routes/notes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// --- CORS configuration ---
function getAllowedOrigins() {
  const raw = process.env.FRONTEND_URL || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) {
        // Dev fallback: allow localhost origins
        const isLocal =
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('http://0.0.0.0:');
        return callback(null, isLocal);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // permissive in test app
    },
    credentials: true,
  })
);

app.use(express.json());

// --- Health (liveness) ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Readiness ---
app.get('/ready', async (_req, res) => {
  if (isConnected()) {
    try {
      const { getPool } = await import('./db.js');
      const pool = getPool();
      await pool.query('SELECT 1');
      return res.json({ status: 'ready', database: 'connected' });
    } catch {
      return res.status(503).json({ status: 'not ready', database: 'disconnected' });
    }
  }
  return res.status(503).json({ status: 'not ready', database: 'disconnected' });
});

// --- API Status ---
app.get('/api/status', (_req, res) => {
  res.json({
    backend: 'running',
    database: isConnected() ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// --- Notes API ---
app.use('/api/notes', notesRouter);

// --- 404 handler ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// --- Start server ---
async function start() {
  // Try to connect to database with retries
  try {
    await waitForDatabase(30, 2000);
    await ensureDatabase();
  } catch (err) {
    console.warn('Starting without database connection:', err.message);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend listening on 0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await closePool();
      console.log('Server closed.');
      process.exit(0);
    });

    // Force exit after 10s
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();

