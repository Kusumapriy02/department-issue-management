const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token for authenticated users
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} role - User's role (admin, faculty, student)
 * @returns {string} - JWT token
 */
const generateToken = (userId, role) => {
  try {
    const payload = {
      userId,
      role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    return token;
  } catch (error) {
    throw new Error('Error generating token: ' + error.message);
  }
};

/**
 * Verifies and decodes a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    console.log('[JWT] Verifying token...');
    console.log('[JWT] Token length:', token.length);
    console.log('[JWT] Token preview:', token.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('[JWT] ✅ Token verified successfully');
    console.log('[JWT] Decoded payload:', {
      userId: decoded.userId,
      role: decoded.role,
      iat: new Date(decoded.iat * 1000).toISOString(),
      exp: new Date(decoded.exp * 1000).toISOString(),
      expiresIn: Math.round((decoded.exp - decoded.iat) / 86400) + ' days',
      timeUntilExpiry: Math.round((decoded.exp - Math.floor(Date.now() / 1000)) / 60) + ' minutes',
    });
    
    return decoded;
  } catch (error) {
    console.error('[JWT] ❌ Token verification failed:', {
      error_name: error.name,
      error_message: error.message,
      token_length: token.length,
    });
    
    // Specific error handling
    if (error.name === 'TokenExpiredError') {
      console.error('[JWT] Token expired at:', new Date(error.expiredAt).toISOString());
      throw new Error('Token expired: ' + error.message);
    } else if (error.name === 'JsonWebTokenError') {
      console.error('[JWT] Invalid token format or signature');
      throw new Error('Invalid token: ' + error.message);
    }
    
    throw new Error('Invalid or expired token: ' + error.message);
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
