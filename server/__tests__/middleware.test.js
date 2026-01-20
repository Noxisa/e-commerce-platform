const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

// We'll mock User model for middleware tests
const mockFindByPk = jest.fn();
jest.mock('../models/User', () => ({ findByPk: mockFindByPk }));

const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

describe('middleware auth and adminOnly', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockFindByPk.mockReset();
  });

  test('auth rejects missing token', async () => {
    app.get('/test', auth, (req, res) => res.sendStatus(200));
    const res = await request(app).get('/test');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });

  test('auth accepts valid token and attaches user when found', async () => {
    const payload = { userId: 42 };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'testsecret');
    mockFindByPk.mockResolvedValue({ id: 42, email: 'a@b.com' });

    app.get('/ok', auth, (req, res) => res.json({ userId: req.userId, user: !!req.user }));
    const res = await request(app).get('/ok').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(42);
    expect(res.body.user).toBe(true);
  });

  test('adminOnly rejects when no user', async () => {
    app.get('/adm', adminOnly, (req, res) => res.sendStatus(200));
    const res = await request(app).get('/adm');
    expect(res.status).toBe(401);
  });

  test('adminOnly allows when user has admin role or isAdmin flag', async () => {
    mockFindByPk.mockResolvedValue({ id: 1, role: 'admin' });
    const req = { userId: 1 };
    // call adminOnly directly by simulating req/res/next
    const res = {};
    res.status = (s) => ({ json: (b) => ({ status: s, body: b }) });

    // Use express route to exercise middleware flow
    app.get('/adm2', (req, res, next) => { req.userId = 1; next(); }, adminOnly, (req, res) => res.sendStatus(200));
    const result = await request(app).get('/adm2');
    expect(result.status).toBe(200);
  });
});
