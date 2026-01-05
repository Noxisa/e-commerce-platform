require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./database');

const app = express();

// Avoid connecting to the DB during tests
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Lightweight health endpoints used by tests
app.get('/', (req, res) => res.status(200).send('OK'));
app.get('/api', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/products', require('./routes/products'));

module.exports = app;
