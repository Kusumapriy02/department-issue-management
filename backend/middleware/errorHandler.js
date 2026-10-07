/**
 * Global error handling middleware
 * Catches all errors from async route handlers and sends consistent error responses
 * Must be the last middleware registered in the Express app
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    message = `Validation Error: ${messages}`;
  }

  // Mongoose Cast Error (Invalid ID format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const duplicateFields = Object.keys(err.keyPattern);
    if (duplicateFields.length > 1) {
      message = `A record with this combination of ${duplicateFields.join(', ')} already exists`;
    } else {
      message = `${duplicateFields[0]} already exists`;
    }
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
