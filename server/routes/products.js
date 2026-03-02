const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Product = require('../models/Product');
const cache = require('../utils/cache');
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// List products (public) with filtering, searching, sorting and pagination
// Query params: page, limit, category, wood, q (search), sort (createdAt|basePrice|name)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { category, wood, q, sort } = req.query;

    // Build cache key including sort parameter
    const cacheKey = `products:${page}:${limit}:${category || ''}:${wood || ''}:${q || ''}:${sort || 'createdAt'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Build where clause with isActive: true as base
    const where = { isActive: true };
    
    // Add category filter if provided
    if (category) {
      where.category = category;
    }

    // Add search filter (name and description) if provided
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ];
    }

    // Add wood type filter if provided
    if (wood) {
      where.availableWoodTypes = { [Op.contains]: [wood] };
    }

    // Determine sort column and direction
    let orderClause = [['createdAt', 'DESC']];
    if (sort === 'basePrice') {
      orderClause = [['basePrice', 'ASC']];
    } else if (sort === 'basePrice-desc') {
      orderClause = [['basePrice', 'DESC']];
    } else if (sort === 'name') {
      orderClause = [['name', 'ASC']];
    } else if (sort === 'newest') {
      orderClause = [['createdAt', 'DESC']];
    }

    // Fetch all product fields
    const products = await Product.findAll({
      where,
      limit,
      offset,
      order: orderClause,
      raw: false,
    });

    // Cache the results for 30 seconds
    cache.set(cacheKey, products, 30);
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
