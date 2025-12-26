const User = require('../models/User');

const adminOnly = async (req, res, next) => {
  try {
    // req.user may be attached by auth middleware
    let user = req.user;
    if (!user && req.userId) {
      user = await User.findByPk(req.userId);
    }
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.isAdmin || user.role === 'admin') {
      return next();
    }

    return res.status(403).json({ error: 'Admin role required' });
  } catch (err) {
    console.error('admin middleware error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { adminOnly };
