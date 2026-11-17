const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'g315_water_portal_capstone_secret_2026';

/**
 * Optional authentication: attaches req.user if a valid Bearer token is present,
 * otherwise proceeds for anonymous/minimal sign-up citizen reporting (FR1).
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      req.user = null;
    }
  }
  next();
}

/**
 * Strict authentication: requires a valid JWT token.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

/**
 * Role-based access control middleware (FR1, FR6, FR10).
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')} (your role: ${req.user.role})`,
      });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  optionalAuth,
  requireAuth,
  requireRole,
};
