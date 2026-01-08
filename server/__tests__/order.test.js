const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

// Mock models
const mockUserFind = jest.fn();
const mockRequestCreate = jest.fn();
const mockRequestFindAll = jest.fn();
const mockRequestFindByPk = jest.fn();
jest.mock('../models/User', () => ({ findByPk: mockUserFind, hasMany: jest.fn() }));
jest.mock('../models/Request', () => ({ create: mockRequestCreate, findAll: mockRequestFindAll, findByPk: mockRequestFindByPk }));

const app = require('../app');

describe('Order routes', () => {
  beforeEach(() => {
    mockUserFind.mockReset();
    mockRequestCreate.mockReset();
    mockRequestFindAll.mockReset();
    mockRequestFindByPk.mockReset();
  });

  test('POST /api/orders creates request when user exists', async () => {
    mockUserFind.mockResolvedValue({ id: 1, email: 'u@e.com' });
    mockRequestCreate.mockResolvedValue({ id: 99 });

    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);
    const res = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`).send({ furnitureType: 'chair', woodType: 'oak', dimensions: '10x10' });
    expect(res.status).toBe(201);
    expect(res.body.requestId).toBe(99);
  });

  test('POST /api/orders returns 404 when user not found', async () => {
    mockUserFind.mockResolvedValue(null);
    const token = jwt.sign({ userId: 2 }, process.env.JWT_SECRET);
    const res = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(404);
  });

  test('GET /api/orders returns all for admin', async () => {
    mockUserFind.mockResolvedValue({ id: 1, isAdmin: true });
    mockRequestFindAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('GET /api/orders returns only user requests for non-admin', async () => {
    mockUserFind.mockResolvedValue({ id: 3, isAdmin: false });
    mockRequestFindAll.mockResolvedValue([{ id: 10, UserId: 3 }]);
    const token = jwt.sign({ userId: 3 }, process.env.JWT_SECRET);
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/orders/:id forbids access when not owner', async () => {
    mockUserFind.mockResolvedValue({ id: 1, isAdmin: false });
    mockRequestFindByPk.mockResolvedValue({ id: 5, UserId: 2 });
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);
    const res = await request(app).get('/api/orders/5').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('PATCH /api/orders/:id/status invalid status returns 400', async () => {
    mockUserFind.mockResolvedValue({ id: 9, isAdmin: true });
    const token = jwt.sign({ userId: 9 }, process.env.JWT_SECRET);
    const res = await request(app).patch('/api/orders/1/status').set('Authorization', `Bearer ${token}`).send({ status: 'bad' });
    expect(res.status).toBe(400);
  });

  test('PATCH /api/orders/:id/status updates status when valid', async () => {
    mockUserFind.mockResolvedValue({ id: 9, isAdmin: true });
    const save = jest.fn().mockResolvedValue(true);
    mockRequestFindByPk.mockResolvedValue({ id: 1, status: 'pending', save });
    const token = jwt.sign({ userId: 9 }, process.env.JWT_SECRET);
    const res = await request(app).patch('/api/orders/1/status').set('Authorization', `Bearer ${token}`).send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalled();
  });

  test('DELETE /api/orders/:id deletes when admin', async () => {
    mockUserFind.mockResolvedValue({ id: 9, isAdmin: true });
    const destroy = jest.fn().mockResolvedValue(true);
    mockRequestFindByPk.mockResolvedValue({ id: 2, destroy });
    const token = jwt.sign({ userId: 9 }, process.env.JWT_SECRET);
    const res = await request(app).delete('/api/orders/2').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(destroy).toHaveBeenCalled();
  });
});
