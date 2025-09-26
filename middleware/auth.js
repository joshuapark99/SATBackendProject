// Authentication Middleware
// Handles JWT token validation and user authentication using Supabase's JWKS endpoint

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Get Supabase URL from environment variables
const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}

// Create JWKS client for fetching public keys from Supabase's well-known endpoint
const client = jwksClient({
  jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  timeout: 30000 // 30 seconds timeout
});

// Function to get signing key from JWKS
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('Error fetching signing key:', err.message);
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey || key.ecPublicKey;
    callback(null, signingKey);
  });
};

/**
 * Extract JWT token from Authorization header
 * Supports both "Bearer <token>" and direct token formats
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }

  // Handle "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Handle direct token format
  return authHeader;
};

/**
 * Verify JWT token and extract user data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    // Verify the JWT token using Supabase's public key from JWKS
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        algorithms: ['ES256'],
        audience: 'authenticated',
        issuer: `${supabaseUrl}/auth/v1`
      }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    // Extract user data from the decoded token
    req.user = {
      id: decoded.sub, // Supabase uses 'sub' for user ID
      email: decoded.email,
      phone: decoded.phone,
      display_name: decoded.user_metadata?.display_name || 
                   decoded.user_metadata?.full_name || 
                   decoded.email?.split('@')[0] || 
                   'User',
      created_at: new Date(decoded.iat * 1000).toISOString(), // Convert issued at to ISO string
      last_sign_in_at: new Date(decoded.iat * 1000).toISOString() // Use issued at as last sign in
    };

    // Also attach the raw token for potential use
    req.token = token;

    next();
  } catch (error) {
    console.error('Error in verifyToken middleware:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Require authentication middleware
 * Ensures user is authenticated before proceeding
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
};

/**
 * Optional authentication middleware
 * Verifies token if present but doesn't require it
 * Useful for routes that work for both authenticated and anonymous users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      // If token is provided, verify it
      try {
        const decoded = await new Promise((resolve, reject) => {
          jwt.verify(token, getKey, {
            algorithms: ['ES256'],
            audience: 'authenticated',
            issuer: `${supabaseUrl}/auth/v1`
          }, (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded);
          });
        });

        req.user = {
          id: decoded.sub,
          email: decoded.email,
          phone: decoded.phone,
          display_name: decoded.user_metadata?.display_name || 
                       decoded.user_metadata?.full_name || 
                       decoded.email?.split('@')[0] || 
                       'User',
          created_at: new Date(decoded.iat * 1000).toISOString(),
          last_sign_in_at: new Date(decoded.iat * 1000).toISOString()
        };
        req.token = token;
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.log('Invalid token in optionalAuth:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Error in optionalAuth middleware:', error);
    // Don't fail the request, just continue without user data
    next();
  }
};

/**
 * Get user from token without middleware
 * Utility function for use in controllers
 */
const getUserFromToken = async (token) => {
  try {
    if (!token) {
      return null;
    }

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        algorithms: ['ES256'],
        audience: 'authenticated',
        issuer: `${supabaseUrl}/auth/v1`
      }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    return {
      id: decoded.sub,
      email: decoded.email,
      phone: decoded.phone,
      display_name: decoded.user_metadata?.display_name || 
                   decoded.user_metadata?.full_name || 
                   decoded.email?.split('@')[0] || 
                   'User',
      created_at: new Date(decoded.iat * 1000).toISOString(),
      last_sign_in_at: new Date(decoded.iat * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};

module.exports = {
  verifyToken,
  requireAuth,
  optionalAuth,
  getUserFromToken,
  extractToken
};
