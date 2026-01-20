const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

const bcrypt = require('bcryptjs');
jest.mock('bcryptjs', () => ({ compare: jest.fn() }));

const app = require('../app');
const User = require('../models/User');

describe('Auth routes', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    bcrypt.compare.mockReset();
  });

  test('signup rejects duplicate email', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue({ id: 1 });
    const res = await request(app).post('/api/auth/signup').send({ email: 'a@b.com', password: 'p' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email already exists');
  });

  test('signup succeeds and returns token', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockResolvedValue({ id: 2 });
    const res = await request(app).post('/api/auth/signup').send({ email: 'new@u.com', password: 'p' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('login invalid credentials (no user)', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'p' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('login invalid password', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue({ id: 1, password: 'hash', isVerified: true });
    bcrypt.compare.mockResolvedValue(false);
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'p' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('login not verified', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue({ id: 1, password: 'hash', isVerified: false });
    bcrypt.compare.mockResolvedValue(true);
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'p' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Email not verified');
  });

  test('login success returns token', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue({ id: 10, password: 'hash', isVerified: true });
    bcrypt.compare.mockResolvedValue(true);
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'p' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('verify token invalid', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const res = await request(app).get('/api/auth/verify/invalidtoken');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid token');
  });

  test('verify token success', async () => {
    const save = jest.fn().mockResolvedValue(true);
    jest.spyOn(User, 'findOne').mockResolvedValue({ id: 5, isVerified: false, verificationToken: 't', save });
    const res = await request(app).get('/api/auth/verify/t');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Email verified');
    expect(save).toHaveBeenCalled();
  });
});
