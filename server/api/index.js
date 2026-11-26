// Vercel serverless entry point.
// Vercel calls this file for every request — it exports the Express app
// so Vercel can invoke it as a serverless function.

require('dotenv').config();
const app = require('../app');

module.exports = app;
