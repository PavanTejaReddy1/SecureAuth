require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const connectDB    = require('./config/db');

const authRoutes     = require('./routes/auth');
const webauthnRoutes = require('./routes/webauthn');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Database ────────────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/webauthn', webauthnRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ─── Global error handler ────────────────────────────────────────────────────
// Catches any error thrown inside a route handler (via asyncHandler or next(err))
// Returns a clean JSON error instead of crashing the process.
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join('. ') });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ message: 'An account with these details already exists.' });
  }

  res.status(500).json({ message: 'Internal server error.' });
});

// ─── Process-level safety net ────────────────────────────────────────────────
// Prevents the process from exiting on an unhandled rejection.
// All routes use asyncHandler so this should never fire in normal operation.
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`SecureAuth server running on port ${PORT}`);
  console.log(`Demo mode: ${process.env.DEMO_MODE === 'true' ? 'ON' : 'OFF'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
