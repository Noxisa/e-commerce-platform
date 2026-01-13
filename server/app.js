// Avoid loading .env during tests to prevent accidental DB connections
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./database');

// Rate limiting: prefer `express-rate-limit`, but fall back to a simple in-memory limiter
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  rateLimit = null;
}

const app = express();

// Avoid connecting to the DB during tests
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Auth endpoints should be rate limited to mitigate brute-force attacks.
// Use express-rate-limit if available, otherwise use a simple fallback limiter.
const createFallbackLimiter = ({ windowMs = 15 * 60 * 1000, max = 5 } = {}) => {
  const map = new Map();
  return (req, res, next) => {
    try {
      const key = req.ip || req.connection.remoteAddress || 'global';
      const now = Date.now();
      const entry = map.get(key) || { count: 0, first: now };
      if (now - entry.first > windowMs) {
        entry.count = 1;
        entry.first = now;
      } else {
        entry.count += 1;
      }
      map.set(key, entry);
      if (entry.count > max) {
        res.set('Retry-After', Math.ceil((windowMs - (now - entry.first)) / 1000));
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
      }
      return next();
    } catch (err) {
      return next();
    }
  };
};

const loginLimiter = rateLimit
  ? rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false })
  : createFallbackLimiter({ windowMs: 15 * 60 * 1000, max: 5 });

const signupLimiter = rateLimit
  ? rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false })
  : createFallbackLimiter({ windowMs: 60 * 60 * 1000, max: 10 });

// Lightweight health endpoints used by tests
app.get('/', (req, res) => res.status(200).send('OK'));
app.get('/api', (req, res) => res.json({ status: 'ok' }));

// Apply route-specific limiters before mounting auth routes so they take effect
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/signup', signupLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/products', require('./routes/products'));

module.exports = app;
