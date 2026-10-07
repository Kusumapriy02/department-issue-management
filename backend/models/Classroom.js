const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
  {
    // Academic Structure
    course: {
      type: String,
      enum: ['BTech', 'MTech'],
      required: [true, 'Please specify course type (BTech or MTech)'],
    },
    specialization: {
      type: String,
      required: [true, 'Please provide specialization (e.g., CSE, ECE, ME)'],
      trim: true,
      uppercase: true,
    },
    year: {
      type: Number,
      required: [true, 'Please provide the academic year'],
      validate: {
        validator: function (v) {
          if (this.course === 'BTech') return v >= 1 && v <= 4;
          if (this.course === 'MTech') return v >= 1 && v <= 2;
          return false;
        },
        message: (props) => {
          const yearLimit = props.value && props.instance && props.instance.course === 'MTech' ? 2 : 4;
          return `Year must be between 1 and ${yearLimit} for ${props.instance.course}`;
        },
      },
    },
    section: {
      type: String,
      required: [true, 'Please provide section (e.g., A, B, C)'],
      trim: true,
      uppercase: true,
    },

    // Block Information
    block: {
      type: String,
      enum: ['Main Block', 'Algorithm Block'],
      required: [true, 'Please specify the block'],
    },

    // Room Assignment
    // MODIFIED: Changed from ObjectId to String to store room names like 'A41', 'GFCL1'
    room: {
      type: String,
      required: [true, 'Please assign a room'],
      trim: true,
    },

    // Department/Program Info
    department: {
      type: String,
      required: [true, 'Please provide a department name'],
      trim: true,
    },
    programDuration: {
      type: Number,
      default: 4,
      description: 'Program duration in years (4 for BTech, 2 for MTech)',
    },

    // Class Representatives
    cr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      description: 'Class Representative',
    },
    lr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      description: 'Lab Representative',
    },

    // Faculty Assignment
    facultyList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================

// Unique compound index to prevent duplicate classrooms
// Same course + specialization + year + section = unique classroom
classroomSchema.index(
  { course: 1, specialization: 1, year: 1, section: 1 },
  {
    unique: true,
    name: 'unique_academic_structure',
    sparse: false,
  }
);

// Index for finding classrooms by course and specialization
classroomSchema.index({ course: 1, specialization: 1 });

// Index for finding classrooms by year
classroomSchema.index({ year: 1 });

// Index for finding classrooms by faculty
classroomSchema.index({ facultyList: 1 });

// ==================== VALIDATIONS ====================

// Pre-save hook to validate course-specific year limits
classroomSchema.pre('save', function (next) {
  // Validate year based on course type
  if (this.course === 'BTech' && (this.year < 1 || this.year > 4)) {
    return next(new Error('BTech year must be between 1 and 4'));
  }
  if (this.course === 'MTech' && (this.year < 1 || this.year > 2)) {
    return next(new Error('MTech year must be between 1 and 2'));
  }

  // Auto-set program duration based on course
  this.programDuration = this.course === 'MTech' ? 2 : 4;

  next();
});

// Pre-updateOne and updateMany hooks for validation
classroomSchema.pre(['updateOne', 'updateMany'], function (next) {
  const update = this.getUpdate();
  
  if (update.course && update.year) {
    if (update.course === 'BTech' && (update.year < 1 || update.year > 4)) {
      return next(new Error('BTech year must be between 1 and 4'));
    }
    if (update.course === 'MTech' && (update.year < 1 || update.year > 2)) {
      return next(new Error('MTech year must be between 1 and 2'));
    }
  }

  next();
});

module.exports = mongoose.model('Classroom', classroomSchema);
