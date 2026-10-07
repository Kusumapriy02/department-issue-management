const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectTitle: {
      type: String,
      required: [true, 'Please provide a project title'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty ID is required'],
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Classroom ID is required'],
    },
    teamMembers: [
      {
        rollNumber: {
          type: String,
          required: true,
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    deadline: {
      type: Date,
      required: [true, 'Please provide a deadline'],
    },
    maxTeamSize: {
      type: Number,
      default: 5,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'submitted', 'evaluated', 'overdue'],
      default: 'not_started',
    },
    updates: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['student', 'faculty'],
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
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

module.exports = mongoose.model('Project', projectSchema);
