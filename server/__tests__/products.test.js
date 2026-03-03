const request = require('supertest');

// bypass authentication/authorization for these endpoint tests
jest.mock('../middleware/auth', () => ({ auth: (req, res, next) => next() }));
jest.mock('../middleware/admin', () => ({ adminOnly: (req, res, next) => next() }));

// create mock functions for product operations
const mockFindAll = jest.fn();
const mockCreate = jest.fn();
const mockFindByPk = jest.fn();

// also stub associations so other modules can require Product safely
jest.mock('../models/Product', () => ({
  findAll: mockFindAll,
  create: mockCreate,
  findByPk: mockFindByPk,
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
}));

// mock request model entirely to avoid loading associations
jest.mock('../models/Request', () => ({
  hasMany: jest.fn(),
  belongsTo: jest.fn(),
}));

const app = require('../app');

describe('GET /api/products', () => {
  beforeEach(() => {
    mockFindAll.mockReset();
  });

  test('returns products and sets MISS on first request, HIT on second', async () => {
    const products = [
      { id: 1, name: 'Classic Wooden Chair', category: 'chair', basePrice: '299.00', imageUrl: null, description: 'Nice' },
    ];
    mockFindAll.mockResolvedValue(products);

    const res1 = await request(app).get('/api/products');
    expect(res1.status).toBe(200);
    expect(res1.body).toEqual(products);
    expect(res1.headers['x-cache']).toBe('MISS');

    const res2 = await request(app).get('/api/products');
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual(products);
    expect(res2.headers['x-cache']).toBe('HIT');

    // ensure underlying DB call was made only once due to caching
    expect(mockFindAll).toHaveBeenCalledTimes(1);
  });

  test('applies pagination and filters to findAll options', async () => {
    mockFindAll.mockResolvedValue([]);

    await request(app).get('/api/products?page=2&limit=5&category=table&q=wood&wood=oak');

    expect(mockFindAll).toHaveBeenCalledTimes(1);
    const opts = mockFindAll.mock.calls[0][0];
    expect(opts.limit).toBe(5);
    expect(opts.offset).toBe(5); // page 2 offset = (2-1)*5
    expect(opts.where.category).toBe('table');
    expect(opts.where.availableWoodTypes).toBeDefined();
  });
});

// Additional tests for POST and DELETE

describe('POST /api/products', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns 400 when required fields missing or invalid', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({});
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('creates product when body valid', async () => {
    mockCreate.mockResolvedValue({ id: 5, name: 'A' });
    const body = {
      name: 'Valid Name',
      category: 'chair',
      description: 'A valid description long enough',
      basePrice: 123.45,
      availableWoodTypes: ['oak'],
    };
    const res = await request(app).post('/api/products').send(body);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(5);
  });
});

describe('DELETE /api/products/:id', () => {
  beforeEach(() => {
    mockFindByPk.mockReset();
  });

  it('returns 404 for non-existent product', async () => {
    mockFindByPk.mockResolvedValue(null);
    const res = await request(app).delete('/api/products/1');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Product not found/i);
  });

  it('soft deletes when found', async () => {
    const save = jest.fn().mockResolvedValue(true);
    mockFindByPk.mockResolvedValue({ id: 2, isActive: true, save });
    const res = await request(app).delete('/api/products/2');
    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalled();
  });
});

