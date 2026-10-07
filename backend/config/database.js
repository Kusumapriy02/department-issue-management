const mongoose = require('mongoose');

/**
 * Connects to MongoDB using Mongoose
 * Sets up connection event handlers for monitoring connection status
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/department_management';

    await mongoose.connect(mongoUri);

    console.log('MongoDB connected successfully');
    
    // Connection event handlers
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
