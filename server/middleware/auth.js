const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || !payload.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // attach userId for downstream handlers
    req.userId = payload.userId;

    // optional: attach user object
    try {
      const user = await User.findByPk(req.userId);
      if (user) req.user = user;
    } catch (e) {
      // ignore user fetch error; middleware already validated token
    }

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { auth };
