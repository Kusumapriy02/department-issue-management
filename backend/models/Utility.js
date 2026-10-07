const mongoose = require('mongoose');

const utilitySchema = new mongoose.Schema(
  {
    utilityName: {
      type: String,
      required: [true, 'Please provide a utility name'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['furniture', 'equipment', 'facilities'],
      lowercase: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      default: null,
    },
    status: {
      type: String,
      enum: ['working', 'damaged', 'maintenance'],
      default: 'working',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Utility', utilitySchema);
