const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Auth middleware: check cookie first (HttpOnly cookie set by server), then fallback to Authorization header
const auth = async (req, res, next) => {
  const cookieToken = req.cookies && (req.cookies.accessToken || req.cookies.access_token);
  const authHeader = req.headers.authorization;
  let token = null;

  if (cookieToken) token = cookieToken;
  else if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || !payload.userId) return res.status(401).json({ error: 'Invalid token' });

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
