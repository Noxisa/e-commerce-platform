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

// Create product (admin) with validation
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      basePrice,
      availableWoodTypes,
      variants,
    } = req.body;

    const errors = [];

    const validCats = ['chair','table','cabinet','bed','shelf'];
    const validWoods = ['oak','pine','walnut','cherry','maple'];

    // name
    if (typeof name !== 'string') errors.push('name must be a string');
    else {
      const t = name.trim();
      if (t.length < 3 || t.length > 100) errors.push('name must be 3-100 chars');
    }

    // category
    if (typeof category !== 'string' || !validCats.includes(category))
      errors.push('category must be one of: ' + validCats.join(', '));

    // description
    if (typeof description !== 'string') errors.push('description must be a string');
    else {
      const t = description.trim();
      if (t.length < 10 || t.length > 1000) errors.push('description must be 10-1000 chars');
    }

    // basePrice
    if (basePrice === undefined || isNaN(Number(basePrice))) errors.push('basePrice must be a number');
    else {
      const num = Number(basePrice);
      if (num <= 0) errors.push('basePrice must be positive');
      if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(String(basePrice))) errors.push('basePrice must have at most 2 decimal places');
    }

    // availableWoodTypes
    if (!Array.isArray(availableWoodTypes) || availableWoodTypes.length < 1) {
      errors.push('availableWoodTypes must be an array with at least one item');
    } else {
      for (const w of availableWoodTypes) {
        if (!validWoods.includes(w)) errors.push(`invalid wood type ${w}`);
      }
    }

    // variants
    if (variants !== undefined) {
      if (!Array.isArray(variants)) errors.push('variants must be an array');
      else {
        variants.forEach((v, idx) => {
          if (typeof v !== 'object' || v === null) errors.push(`variant[${idx}] must be object`);
          else {
            if (typeof v.name !== 'string' || !v.name.trim()) errors.push(`variant[${idx}].name required`);
            if (v.priceModifier === undefined || isNaN(Number(v.priceModifier))) errors.push(`variant[${idx}].priceModifier must be number`);
          }
        });
      }
    }

    if (errors.length) return res.status(400).json({ errors });

    const p = await Product.create({
      name: name.trim(),
      category,
      description: description.trim(),
      basePrice: Number(basePrice).toFixed(2),
      availableWoodTypes,
      variants: variants || [],
    });
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

// Delete (soft) product (admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    p.isActive = false;
    await p.save();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
