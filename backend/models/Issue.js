const mongoose = require('mongoose');

const CATEGORIES = ['asset', 'infrastructure', 'academic', 'conduct', 'general'];
const PRIORITIES = ['low', 'normal', 'high'];
const STATUSES = ['open', 'in-progress', 'resolved'];
const ASSET_ISSUE_TYPES = ['damaged', 'maintenance'];

const issueSchema = new mongoose.Schema(
  {
    // ──── Core Fields ────
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: 'Category must be one of: ' + CATEGORIES.join(', '),
      },
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITIES,
        message: 'Priority must be one of: ' + PRIORITIES.join(', '),
      },
      default: 'normal',
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: 'Status must be one of: ' + STATUSES.join(', '),
      },
      default: 'open',
    },

    // ──── Asset-Specific Fields (only when category = "asset") ────
    assetType: {
      type: String,
      trim: true,
      default: null,
    },
    block: {
      type: String,
      enum: ['Department', 'Algorithm'],
      default: null,
    },
    room: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    quantity: {
      type: Number,
      min: [1, 'Quantity must be at least 1'],
      default: null,
    },
    issueType: {
      type: String,
      enum: {
        values: ASSET_ISSUE_TYPES,
        message: 'Issue type must be one of: ' + ASSET_ISSUE_TYPES.join(', '),
      },
      default: null,
    },

    // ──── Academic-Specific Fields ────
    subject: {
      type: String,
      trim: true,
      default: null,
    },
    facultyName: {
      type: String,
      trim: true,
      default: null,
    },

    // ──── Proof & Ownership ────
    proofImage: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },

    // ──── Resolution ────
    resolvedAt: {
      type: Date,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ──── Conditional Validation ────
issueSchema.pre('validate', function (next) {
  if (this.category === 'asset') {
    if (!this.assetType) {
      this.invalidate('assetType', 'Asset type is required when category is "asset"');
    }
    if (!this.block) {
      this.invalidate('block', 'Block is required when category is "asset"');
    }
    if (!this.room) {
      this.invalidate('room', 'Room is required when category is "asset"');
    }
    if (this.quantity == null || this.quantity < 1) {
      this.invalidate('quantity', 'Quantity is required and must be at least 1 when category is "asset"');
    }
    if (!this.issueType) {
      this.invalidate('issueType', 'Issue type (damaged/maintenance) is required when category is "asset"');
    }
  }

  if (this.category === 'academic') {
    if (!this.subject) {
      this.invalidate('subject', 'Subject is required when category is "academic"');
    }
  }

  // Clear asset fields if category is not "asset"
  if (this.category !== 'asset') {
    this.assetType = null;
    this.block = null;
    this.room = null;
    this.quantity = null;
    this.issueType = null;
  }

  // Clear academic fields if category is not "academic"
  if (this.category !== 'academic') {
    this.subject = null;
    this.facultyName = null;
  }

  next();
});

// ──── Indexes ────
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ createdBy: 1 });
issueSchema.index({ status: 1, priority: 1 });
issueSchema.index({ category: 1, block: 1, room: 1 });

module.exports = mongoose.model('Issue', issueSchema);
