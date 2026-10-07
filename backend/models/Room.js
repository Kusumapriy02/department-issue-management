const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    // Room Identification
    number: {
      type: String,
      required: [true, 'Please provide room number'],
      unique: true,
      trim: true,
    },

    // Block Information
    block: {
      type: String,
      enum: ['Main Block', 'Algorithm Block'],
      required: [true, 'Please specify which block the room belongs to'],
    },

    // Assignment Status
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      default: null,
      description: 'ID of the classroom this room is assigned to (null if available)',
    },

    // Room Details
    capacity: {
      type: Number,
      default: 60,
      description: 'Student capacity of the room',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    amenities: [
      {
        type: String,
        enum: ['Projector', 'AC', 'Whiteboard', 'Smart Board', 'Lab Equipment'],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      description: 'Room availability status',
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick room lookups by block
roomSchema.index({ block: 1 });

// Index for finding available rooms
roomSchema.index({ assignedTo: 1 });

// Index for block + availability
roomSchema.index({ block: 1, assignedTo: 1, isActive: 1 });

module.exports = mongoose.model('Room', roomSchema);
