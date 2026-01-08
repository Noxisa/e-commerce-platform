const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Product = require('../models/Product');
const cache = require('../utils/cache');
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// List products (public)
// Public list with pagination, filters and short in-memory caching
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { category, wood, q } = req.query;

    const cacheKey = `products:${page}:${limit}:${category || ''}:${wood || ''}:${q || ''}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    const where = { isActive: true };
    if (category) where.category = category;
    if (q) where.name = { [Op.iLike]: `%${q}%` };
    if (wood) where.availableWoodTypes = { [Op.contains]: [wood] };

    const products = await Product.findAll({
      where,
      attributes: ['id', 'name', 'category', 'basePrice', 'imageUrl', 'description'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    cache.set(cacheKey, products, 30); // cache 30s
    res.set('Cache-Control', 'public, max-age=30');
    res.set('X-Cache', 'MISS');
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get one product
router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const p = await Product.create(req.body);
    res.status(201).json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product (admin)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    Object.assign(p, req.body);
    await p.save();
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product (admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    await p.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
