const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

// Mock User model and bcrypt
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
jest.mock('../models/User', () => ({ findOne: mockFindOne, create: mockCreate }));

const bcrypt = require('bcryptjs');
jest.mock('bcryptjs', () => ({ compare: jest.fn() }));

const app = require('../app');

describe('Auth routes', () => {
  beforeEach(() => {
    mockFindOne.mockReset();
    mockCreate.mockReset();
    bcrypt.compare.mockReset();
  });

  test('signup rejects duplicate email', async () => {
    mockFindOne.mockResolvedValue({ id: 1 });
    const res = await request(app).post('/api/auth/signup').send({ email: 'a@b.com', password: 'p' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email already exists');
  });

  test('signup succeeds and returns token', async () => {
    mockFindOne.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 2 });
    const res = await request(app).post('/api/auth/signup').send({ email: 'new@u.com', password: 'p' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('login invalid credentials (no user)', async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'p' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('login invalid password', async () => {
    mockFindOne.mockResolvedValue({ id: 1, password: 'hash', isVerified: true });
    bcrypt.compare.mockResolvedValue(false);
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'p' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('login not verified', async () => {
    mockFindOne.mockResolvedValue({ id: 1, password: 'hash', isVerified: false });
    bcrypt.compare.mockResolvedValue(true);
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'p' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Email not verified');
  });

  test('login success returns token', async () => {
    mockFindOne.mockResolvedValue({ id: 10, password: 'hash', isVerified: true });
    bcrypt.compare.mockResolvedValue(true);
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'p' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('verify token invalid', async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await request(app).get('/api/auth/verify/invalidtoken');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid token');
  });

  test('verify token success', async () => {
    const save = jest.fn().mockResolvedValue(true);
    mockFindOne.mockResolvedValue({ id: 5, isVerified: false, verificationToken: 't', save });
    const res = await request(app).get('/api/auth/verify/t');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Email verified');
    expect(save).toHaveBeenCalled();
  });
});
