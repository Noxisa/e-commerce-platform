const request = require('supertest');

// Mock Product model before importing the app
const mockFindAll = jest.fn();
jest.mock('../models/Product', () => ({ findAll: mockFindAll }));

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
