// server.js — local development entry point only.
// For Vercel deployment the entry point is api/index.js.

require('dotenv').config();
const app  = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SecureAuth server running on port ${PORT}`);
  console.log(`Demo mode: ${process.env.DEMO_MODE === 'true' ? 'ON' : 'OFF'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
