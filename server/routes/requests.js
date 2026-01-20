// server/routes/requests.js
const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.post('/', auth, async (req, res) => {
  const { productId, phoneNumber, selectedVariants, preferredDeliveryDate, notes } = req.body;

  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Calculate total price based on base price and variant modifiers
    let totalPrice = Number(product.basePrice);
    if (Array.isArray(selectedVariants) && selectedVariants.length > 0) {
      for (const variantName of selectedVariants) {
        const variant = product.variants.find(v => v.name === variantName);
        if (variant && variant.priceModifier) {
          totalPrice += Number(variant.priceModifier);
        }
      }
    }

    const request = await Request.create({
      userEmail: user.email,
      phoneNumber,
      productId,
      productName: product.name,
      selectedVariants: selectedVariants || [],
      basePrice: product.basePrice,
      totalPrice,
      preferredDeliveryDate,
      notes,
      status: 'pending',
      UserId: user.id,
      furnitureType: product.category,
      woodType: '',
      dimensions: '',
    });

    res.status(201).json({ message: 'Request created!', requestId: request.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET / - list requests: admin gets all, users get their own
router.get('/', auth, async (req, res) => {
  try {
    if (req.user && (req.user.isAdmin || req.user.role === 'admin')) {
      const all = await Request.findAll({ include: [User, Product] });
      return res.json(all);
    }

    const requests = await Request.findAll({
      where: { UserId: req.userId },
      include: [User, Product],
    });
    return res.json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id - admin or owner
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await Request.findByPk(req.params.id, { include: [User, Product] });
    if (!r) return res.status(404).json({ error: 'Not found' });

    if (req.user && (req.user.isAdmin || req.user.role === 'admin')) return res.json(r);

    if (r.UserId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    return res.json(r);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /:id/status - admin only: update status
router.patch('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'contacted', 'in_progress', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const r = await Request.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });

    r.status = status;
    await r.save();
    return res.json(r);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /:id/admin-notes - admin only: update admin notes
router.patch('/:id/admin-notes', auth, adminOnly, async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const r = await Request.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });

    r.adminNotes = adminNotes;
    await r.save();
    return res.json(r);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id - admin only
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const r = await Request.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    await r.destroy();
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
