const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and load full user from DB.
 * Attaches userId, role, classroomId, name, email to req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('[AUTH MIDDLEWARE] Request received');
    console.log('[AUTH MIDDLEWARE] Path:', req.path);
    console.log('[AUTH MIDDLEWARE] Method:', req.method);

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.warn('[AUTH MIDDLEWARE] ❌ No authorization header found');
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    console.log('[AUTH MIDDLEWARE] Authorization header found');

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.warn('[AUTH MIDDLEWARE] ❌ Invalid authorization header format (no token after Bearer)');
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format',
      });
    }

    console.log('[AUTH MIDDLEWARE] Token extracted from header');

    // THIS IS WHERE JWT IS VERIFIED
    let decoded;
    try {
      decoded = verifyToken(token);
      console.log('[AUTH MIDDLEWARE] ✅ JWT verification passed');
    } catch (jwtError) {
      console.error('[AUTH MIDDLEWARE] ❌ JWT verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token verification failed: ' + jwtError.message,
      });
    }

    console.log('[AUTH MIDDLEWARE] Fetching user from database (userId:', decoded.userId + ')');

    // Fetch full user so downstream controllers have classroomId, name, etc.
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.warn('[AUTH MIDDLEWARE] ❌ User not found in database (userId:', decoded.userId + ')');
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      console.warn('[AUTH MIDDLEWARE] ❌ User account is inactive (email:', user.email + ')');
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    console.log('[AUTH MIDDLEWARE] ✅ User found and active (email:', user.email + ')');

    // Normalize role: lowercase and trim to prevent case/whitespace issues
    const normalizedRole = (user.role || '').toString().toLowerCase().trim();

    req.user = {
      userId: user._id,
      role: normalizedRole,  // Store normalized role
      classroomId: user.classroomId,
      name: user.name,
      email: user.email,
      registrationNumber: user.registrationNumber,
      teacherId: user.teacherId,
      rollNumber: user.registrationNumber, // Backward compatibility for project team members
    };

    console.log('[AUTH MIDDLEWARE] ✅ User attached to request:', {
      email: req.user.email,
      role: normalizedRole,
      userId: req.user.userId,
    });

    console.log('[AUTH MIDDLEWARE] ✅ Authentication complete - proceeding to next middleware');
    console.log('='.repeat(70) + '\n');

    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE] ❌ Unexpected error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    return res.status(401).json({
      success: false,
      message: 'Authentication error: ' + error.message,
    });
  }
};

/**
 * Factory: restrict access to one or more roles.
 * Usage: authorize('admin') or authorize('faculty', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.warn('[AUTHORIZE] No user in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Normalized role (also normalize in authorize as defensive measure)
    const userRole = (req.user.role || '').toString().toLowerCase().trim();
    const hasAccess = roles.includes(userRole);
    
    console.log('[AUTHORIZE] Role check:', {
      user_role: userRole,
      role_type: typeof userRole,
      required_roles: roles,
      has_access: hasAccess,
      path: req.path,
      email: req.user.email,
    });

    if (!hasAccess) {
      console.warn('[AUTHORIZE] Access denied - role not authorized:', {
        user_role: userRole,
        required: roles,
        email: req.user.email,
        path: req.path,
      });
      return res.status(403).json({
        success: false,
        message: `Access restricted to: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

// Convenient aliases so existing routes keep working
const adminOnly = authorize('admin');
const facultyOnly = authorize('faculty', 'admin');
const studentOnly = authorize('student', 'admin');
const hodOrAdmin = authorize('hod', 'admin');

module.exports = {
  authMiddleware,
  authorize,
  adminOnly,
  facultyOnly,
  studentOnly,
  hodOrAdmin,
};
