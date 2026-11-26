// app.js — Express app setup, exported so it can be used by:
//   - server.js for local development (calls app.listen)
//   - api/index.js for Vercel serverless deployment

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const connectDB    = require('./config/db');

const authRoutes     = require('./routes/auth');
const webauthnRoutes = require('./routes/webauthn');

// Connect to MongoDB once — Vercel reuses the connection across invocations
connectDB();

const app = express();

// CORS — allow the deployed frontend and localhost for development.
// Any *.vercel.app origin is also allowed to cover preview deployments.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://secure-auth-aite.vercel.app',
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/webauthn', webauthnRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Root — shown when someone visits the backend URL directly in a browser
app.get('/', (req, res) => {
  res.json({
    name:    'SecureAuth API',
    status:  'running',
    version: '1.0.0',
    health:  '/api/health',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join('. ') });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'An account with these details already exists.' });
  }

  res.status(500).json({ message: 'Internal server error.' });
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

module.exports = app;
