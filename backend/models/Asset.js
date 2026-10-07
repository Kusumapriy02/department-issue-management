const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Asset type is required'],
      trim: true,
      enum: [
        'Bench',
        'Fan',
        'Light',
        'LED Board',
        'Whiteboard',
        'Smart Board',
        'Projector',
        'Other',
      ],
    },
    block: {
      type: String,
      required: [true, 'Block is required'],
      enum: ['Department', 'Algorithm'],
    },
    room: {
      type: String,
      required: [true, 'Room is required'],
      trim: true,
      uppercase: true,
    },
    total: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Total must be at least 1'],
    },
    // damaged and maintenance are NOT stored here.
    // They are computed dynamically from active Issues via aggregation.
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ──── Indexes ────
assetSchema.index({ block: 1, room: 1 });
assetSchema.index({ type: 1 });
assetSchema.index({ block: 1, room: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Asset', assetSchema);
