// server/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { auth } = require('../middleware/auth'); 

router.post('/', auth, async (req, res) => {
  const { furnitureType, woodType, dimensions, notes } = req.body;

  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const order = await Order.create({
      userEmail: user.email,
      furnitureType,
      woodType,
      dimensions,
      notes,
    });

    res.status(201).json({ message: 'Order accepted!', orderId: order.id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;