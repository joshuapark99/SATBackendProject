// Middleware Index - Export all middleware

const auth = require('./auth');
const validation = require('./validation');

module.exports = {
  // Authentication middleware
  verifyToken: auth.verifyToken,
  requireAuth: auth.requireAuth,
  optionalAuth: auth.optionalAuth,
  getUserFromToken: auth.getUserFromToken,
  extractToken: auth.extractToken,
  
  // Validation middleware
  ...validation
};
