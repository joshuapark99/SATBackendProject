const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken, requireAuth, optionalAuth } = require('../../../middleware');

const router = express.Router();

// Create Supabase client for authentication
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Login endpoint - authenticate user and return token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: error.message
      });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    // Return success response with token and user data
    res.json({
      success: true,
      data: {
        message: 'Login successful',
        user: {
          id: data.user.id,
          email: data.user.email,
          phone: data.user.phone,
          display_name: data.user.user_metadata?.display_name || 
                       data.user.user_metadata?.full_name || 
                       data.user.email?.split('@')[0] || 
                       'User',
          created_at: data.user.created_at,
          last_sign_in_at: data.user.last_sign_in_at
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in login endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Register endpoint - create new user account
router.post('/register', async (req, res) => {
  try {
    const { email, password, display_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Create user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: display_name || email.split('@')[0]
        }
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }

    if (!data.user) {
      return res.status(400).json({
        success: false,
        message: 'User creation failed'
      });
    }

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        message: 'Registration successful',
        user: {
          id: data.user.id,
          email: data.user.email,
          display_name: data.user.user_metadata?.display_name || email.split('@')[0],
          created_at: data.user.created_at
        },
        // Note: access_token might be null if email confirmation is required
        access_token: data.session?.access_token || null,
        requires_confirmation: !data.session
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in register endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Logout endpoint - sign out user
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Sign out with Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Logout successful'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in logout endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Public route - no authentication required
router.get('/public', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'This is a public endpoint - no authentication required',
      timestamp: new Date().toISOString()
    }
  });
});

// Optional authentication route - works with or without auth
router.get('/optional', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      data: {
        message: 'Welcome back, authenticated user!',
        user: {
          id: req.user.id,
          email: req.user.email,
          display_name: req.user.display_name
        },
        timestamp: new Date().toISOString()
      }
    });
  } else {
    res.json({
      success: true,
      data: {
        message: 'Welcome, anonymous user!',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Protected route - authentication required
router.get('/protected', verifyToken, requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Access granted to protected resource (RS256 JWT verified)',
      user: {
        id: req.user.id,
        email: req.user.email,
        display_name: req.user.display_name,
        phone: req.user.phone,
        created_at: req.user.created_at,
        last_sign_in_at: req.user.last_sign_in_at
      },
      timestamp: new Date().toISOString()
    }
  });
});

// Get current user profile
router.get('/profile', verifyToken, requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'User profile retrieved successfully (asymmetric JWT)',
      profile: {
        id: req.user.id,
        email: req.user.email,
        phone: req.user.phone,
        display_name: req.user.display_name,
        created_at: req.user.created_at,
        last_sign_in_at: req.user.last_sign_in_at
      },
      timestamp: new Date().toISOString()
    }
  });
});

// Test token validation endpoint
router.post('/validate-token', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Token is valid (verified with RS256 public key)',
      token_info: {
        user_id: req.user.id,
        email: req.user.email,
        display_name: req.user.display_name,
        token_length: req.token ? req.token.length : 0,
        algorithm: 'RS256 (asymmetric)'
      },
      timestamp: new Date().toISOString()
    }
  });
});

// JWKS endpoint info (for debugging)
router.get('/jwks-info', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'JWKS endpoint information',
      jwks_url: `${process.env.SUPABASE_URL}/auth/v1/jwks`,
      algorithm: 'RS256',
      key_type: 'RSA public key',
      cache_duration: '10 minutes',
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
