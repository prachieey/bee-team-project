// server.js
// SettleUp Express Application Entry Point
// Demonstrates: Express setup, middleware chain, CORS, cookie-parser (Lecture 38-42)

require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');

const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const dashboardRoutes   = require('./routes/dashboard');
const groupRoutes       = require('./routes/groups');

// ── Connect to MongoDB Atlas ──────────────────────────────────────────────────
connectDB();

// ── Initialize Express ────────────────────────────────────────────────────────
const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────────

// CORS: allow requests from Vite dev server with credentials (cookies)
app.use(
  cors({
    origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,   // Required for HTTP-only cookies
    methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());          // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(cookieParser());          // Parse cookies

// Serve uploaded receipt images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/groups',       groupRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'SettleUp API is running', timestamp: new Date().toISOString() });
});

// ── 404 handler for unknown API routes ────────────────────────────────────────
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

// ── Centralized Error Handler (must be last middleware) ───────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 SettleUp server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Allowed origin: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}`);
  });
}

module.exports = app;

