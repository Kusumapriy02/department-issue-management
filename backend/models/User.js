const mongoose = require('mongoose');
const { hashPassword } = require('../utils/passwordUtils');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    registrationNumber: {
      type: String,
      sparse: true, // Sparse index allows null for non-student users
      unique: true,
    },
    teacherId: {
      type: String,
      sparse: true, // Sparse index allows null for non-faculty/admin users
      unique: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Password hash is not returned by default in queries
    },
    role: {
      type: String,
      enum: ['admin', 'faculty', 'student', 'hod'],
      required: [true, 'Please specify a role'],
      default: 'student',
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    courseType: {
      type: String,
      enum: ['BTech', 'MTech'],
      default: 'BTech',
    },
    specialization: {
      type: String,
      enum: {
        values: [
          null,
          'Artificial Intelligence and Machine Learning',
          'Computer Science & Technology',
          'Computer Networks and Information Security',
        ],
        message: 'Invalid specialization',
      },
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: Hashes the password before saving to the database
 * Only hashes if the password field is modified or new document
 */
userSchema.pre('save', async function (next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    this.passwordHash = await hashPassword(this.passwordHash);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare provided password with stored hash
 * @param {string} enteredPassword - Password to compare
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  const { comparePassword } = require('../utils/passwordUtils');
  return await comparePassword(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
