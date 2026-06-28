require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { syncDatabase } = require('./models');

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Dev request logger
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/projects',  require('./routes/projects'));
app.use('/api/notes',     require('./routes/notes'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/users',     require('./routes/users'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', db: 'MySQL (Sequelize)', time: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('❌ Server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ── Connect MySQL → Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await syncDatabase();   // creates / alters all tables
    app.listen(PORT, () => {
      console.log(`🚀 TaskFlow API (MySQL) → http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('');
    console.error('Checklist:');
    console.error('  1. Is MySQL running?      →  mysql.server start');
    console.error('  2. Does the DB exist?     →  CREATE DATABASE taskflow;');
    console.error('  3. Is backend/.env set?   →  cp .env.example .env  then edit');
    process.exit(1);
  }
})();

module.exports = app;
