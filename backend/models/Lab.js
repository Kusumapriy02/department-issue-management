const mongoose = require('mongoose');

const labSchema = new mongoose.Schema(
  {
    labName: {
      type: String,
      required: [true, 'Please provide a lab name'],
      trim: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Please provide a room number'],
      unique: true,
      trim: true,
    },
    numberOfSystems: {
      type: Number,
      required: [true, 'Please provide number of systems'],
      min: 1,
    },
    accessories: [
      {
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    incharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lab', labSchema);
