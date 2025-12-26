// server/routes/order.js
const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.post('/', auth, async (req, res) => {
  const { furnitureType, woodType, dimensions, notes } = req.body;

  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const request = await Request.create({
      userEmail: user.email,
      furnitureType,
      woodType,
      dimensions,
      notes,
      status: 'pending',
      requestedAt: new Date(),
      UserId: user.id,
    });

    res.status(201).json({ message: 'Request accepted!', requestId: request.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET / - list requests: admin gets all, users get their own
router.get('/', auth, async (req, res) => {
  try {
    if (req.user && (req.user.isAdmin || req.user.role === 'admin')) {
      const all = await Request.findAll();
      return res.json(all);
    }

    const requests = await Request.findAll({ where: { UserId: req.userId } });
    return res.json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id - admin or owner
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await Request.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });

    if (req.user && (req.user.isAdmin || req.user.role === 'admin')) return res.json(r);

    if (r.UserId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    return res.json(r);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /:id/status - admin only: update status and processedAt
router.patch('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const r = await Request.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });

    r.status = status;
    r.processedAt = status === 'pending' ? null : new Date();
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