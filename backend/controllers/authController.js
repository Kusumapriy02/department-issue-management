const mongoose = require('mongoose');
const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');

/**
 * Login — public route
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

console.log("LOGIN HIT");
console.log("Email:", email);

const user = await User.findOne({ email }).select('+passwordHash');

console.log("User from DB:", user);

if (!user) {
  return res.status(401).json({
    success: false,
    message: 'Invalid email or password',
  });
}

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    const isPasswordMatch = await user.matchPassword(password);
    console.log("Password match:", isPasswordMatch);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      registrationNumber: user.registrationNumber,
      teacherId: user.teacherId,
      classroomId: user.classroomId,
      isFirstLogin: user.isFirstLogin,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register — admin only
 */
exports.register = async (req, res, next) => {
  try {
    // Ensure only admin can create users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can create users',
      });
    }

    const { name, email, password, role, registrationNumber, teacherId, classroomId, courseType, specialization } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role',
      });
    }

    // Prevent admin from creating HOD through API
    if (role === 'hod') {
      return res.status(400).json({
        success: false,
        message: 'HOD is a system-level role and cannot be created through this endpoint. Use the separate HOD setup endpoint.',
      });
    }

    // Role-based validation
    if (role === 'student') {
      if (!registrationNumber) {
        return res.status(400).json({
          success: false,
          message: 'Registration number is required for student',
        });
      }
      if (!classroomId) {
        return res.status(400).json({
          success: false,
          message: 'Classroom is required for student',
        });
      }
    } else if (role === 'faculty' || role === 'admin') {
      if (!teacherId) {
        return res.status(400).json({
          success: false,
          message: `Teacher ID is required for ${role}`,
        });
      }
    }

    // Validate courseType and specialization for MTech students only
    if (role === 'student') {
      if (courseType === 'MTech' && !specialization) {
        return res.status(400).json({
          success: false,
          message: 'Specialization is required for MTech students',
        });
      }
    }

    // Validate courseType and specialization for MTech students only
    if (role === 'student') {
      if (courseType === 'MTech' && !specialization) {
        return res.status(400).json({
          success: false,
          message: 'Specialization is required for MTech students',
        });
      }
    }

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // TASK 4: Force ObjectId conversion for classroomId (if student)
    let finalClassroomId = null;
    if (role === 'student' && classroomId) {
      // TASK 6: Validate ObjectId before converting
      if (!mongoose.Types.ObjectId.isValid(classroomId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid classroom ID format',
        });
      }
      // TASK 3: Debug logging
      console.log('[REGISTER] Incoming classroomId:', classroomId, '| Type:', typeof classroomId);
      finalClassroomId = new mongoose.Types.ObjectId(classroomId);
      console.log('[REGISTER] Converted classroomId:', finalClassroomId, '| Type:', typeof finalClassroomId);
    }

    // Set specialization to null if courseType is BTech (students only)
    let finalSpecialization = null;
    if (role === 'student') {
      finalSpecialization = courseType === 'BTech' ? null : (specialization || null);
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password, // pre-save hook will hash it
      role,
      registrationNumber: role === 'student' ? registrationNumber : null,
      teacherId: (role === 'faculty' || role === 'admin') ? teacherId : null,
      classroomId: finalClassroomId,
      courseType: role === 'student' ? (courseType || 'BTech') : null,
      specialization: finalSpecialization,
      isFirstLogin: true, // New users always start with isFirstLogin = true
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationNumber: user.registrationNumber,
        teacherId: user.teacherId,
        classroomId: user.classroomId,
        courseType: user.courseType,
        specialization: user.specialization,
        isActive: user.isActive,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users — admin only
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search, classroomId } = req.query;
    let filter = {};
    let selectFields = '-passwordHash';

    // TASK 1: Filter by classroom + ensure only students
    if (classroomId) {
      // When filtering by classroom, ONLY return students
      filter.classroomId = classroomId;
      filter.role = 'student'; // FORCE: Only students in classrooms
      // TASK 2: Return only name and registrationNumber for classroom students
      selectFields = 'name registrationNumber';
    } else {
      // For general user queries, respect role parameter if provided
      if (role) filter.role = role;
      if (search) {
        filter.$or = [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
        ];
      }
    }

    const query = User.find(filter).select(selectFields);
    
    // Only populate if NOT filtering by classroom
    if (!classroomId) {
      query.populate('classroomId');
    }
    
    query.sort({ createdAt: -1 });
    
    const users = await query.exec();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user — admin only
 * For HOD: Allow editing name and email only. Not allowed to change role or delete.
 */
exports.updateUser = async (req, res, next) => {
  try {
    // Ensure only admin can update users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update users',
      });
    }

    console.log('[UPDATE USER] REQUEST BODY:', JSON.stringify(req.body, null, 2));
    console.log('[UPDATE USER] TARGET USER ID:', req.params.id);

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentRole = user.role;
    console.log('[UPDATE USER] CURRENT ROLE:', currentRole);

    console.log('[UPDATE USER] BEFORE - User from DB:', {
      _id: user._id,
      name: user.name,
      role: user.role,
      registrationNumber: user.registrationNumber,
      rollNumber: user.rollNumber,
      teacherId: user.teacherId,
    });

    // For HOD: Allow only name and email updates
    if (user.role === 'hod') {
      const { name, email } = req.body;
      
      // Check if email is being changed and is already taken
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email already in use by another user',
          });
        }
      }
      
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      
      // Prevent changing HOD role or isActive status through this endpoint
      if (req.body.role || req.body.isActive !== undefined) {
        return res.status(400).json({
          success: false,
          message: 'HOD role and status cannot be changed. Use the "Assign HOD" feature to change HOD.',
        });
      }

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'HOD information updated successfully',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      });
    }

    // Prevent changing a user to HOD role through update endpoint
    if (req.body.role === 'hod') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign HOD role through this endpoint. Use the "Assign HOD" feature.',
      });
    }

    // Extract fields from request
    const { name, email, role, classroomId, isActive, registrationNumber, teacherId, courseType, specialization } = req.body;
    
    // AUTO-MIGRATE OLD USERS: If user is a student but doesn't have registrationNumber, use rollNumber
    if (user.role === 'student' && !user.registrationNumber && user.rollNumber) {
      console.log('[UPDATE USER] AUTO-MIGRATING: rollNumber → registrationNumber');
      user.registrationNumber = user.rollNumber;
    }

    // Determine final role (current or new)
    let finalRole = role || user.role;
    console.log('[UPDATE USER] FINAL ROLE:', finalRole);

    // TASK 1: STRICT ROLE-BASED VALIDATION - Only validate what's needed for the role

    // If role is being changed, validate it
    if (role !== undefined && role !== user.role) {
      // Cannot change to HOD through normal update
      if (role === 'hod') {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign HOD role through normal user update. Use the "Assign HOD" feature.',
        });
      }

      // If changing TO student role, require registration number and classroom
      if (role === 'student') {
        const regNum = registrationNumber || user.registrationNumber;
        if (!regNum) {
          return res.status(400).json({
            success: false,
            message: 'Registration number is required for student role',
          });
        }
        if (!classroomId && !user.classroomId) {
          return res.status(400).json({
            success: false,
            message: 'Classroom is required for student role',
          });
        }
      }

      // If changing TO faculty or admin, require teacher ID
      if (role === 'faculty' || role === 'admin') {
        const tId = teacherId || user.teacherId;
        if (!tId) {
          return res.status(400).json({
            success: false,
            message: `Teacher ID is required for ${role} role`,
          });
        }
      }
    }

    // TASK 6: DEBUG LOGGING
    console.log('[UPDATE USER] VALIDATION PASSED FOR ROLE:', finalRole);
    console.log('[ROLE CHANGE DETECTION] Old role:', user.role, '| New role:', finalRole);

    const roleChanged = user.role !== finalRole;
    if (roleChanged) {
      console.log('[ROLE CHANGE] User is switching from', user.role, 'to', finalRole);
    }

    // TASK 4: BUILD UPDATE OBJECT DYNAMICALLY BASED ON ROLE
    const updateData = {};

    // Common fields (always updatable)
    if (name !== undefined && name !== '') updateData.name = name;
    if (email !== undefined && email !== '') updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined) updateData.role = role;

    // TASK 1: ONLY validate and update fields relevant to the FINAL role
    if (finalRole === 'student') {
      // Student fields ONLY
      console.log('[UPDATE USER] UPDATING STUDENT FIELDS');
      
      if (registrationNumber !== undefined && registrationNumber !== '') {
        updateData.registrationNumber = registrationNumber;
      }
      // TASK 4: Force ObjectId conversion for classroomId
      if (classroomId !== undefined && classroomId !== '') {
        // TASK 6: Validate ObjectId before converting
        if (!mongoose.Types.ObjectId.isValid(classroomId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid classroom ID format',
          });
        }
        // TASK 3: Debug logging
        console.log('[UPDATE USER] Incoming classroomId:', classroomId, '| Type:', typeof classroomId);
        const convertedClassroomId = new mongoose.Types.ObjectId(classroomId);
        updateData.classroomId = convertedClassroomId;
        console.log('[UPDATE USER] Converted classroomId:', convertedClassroomId, '| Type:', typeof convertedClassroomId);
      }
      if (courseType !== undefined && courseType !== '') {
        updateData.courseType = courseType;
      }
      if (specialization !== undefined && specialization !== '') {
        updateData.specialization = specialization;
      } else if (specialization === '') {
        updateData.specialization = null;
      }

      // Validate courseType and specialization for MTech students
      const newCourseType = courseType !== undefined ? courseType : user.courseType;
      const newSpecialization = specialization !== undefined ? specialization : user.specialization;
      
      if (newCourseType === 'MTech' && !newSpecialization) {
        return res.status(400).json({
          success: false,
          message: 'Specialization is required for MTech students',
        });
      }

      // Clean up specialization if courseType is BTech
      if (newCourseType === 'BTech') {
        updateData.specialization = null;
      }

      // TASK 3: REMOVE INVALID CHECKS - Don't validate/set teacherId for students
      // Will use $unset operator in the update query to remove it cleanly
      
      // Set default classroom if not provided
      if (!updateData.classroomId && !user.classroomId) {
        // User already has classroom, don't change it
      } else if (updateData.classroomId) {
        // User provided new classroom
      }
      
      // Ensure registrationNumber is set from update or existing
      if (!updateData.registrationNumber && user.registrationNumber) {
        updateData.registrationNumber = user.registrationNumber;
      }

      // ============================================================================
      // TASK 3: PREVENT INVALID MIXED DATA - Students must NOT have teacherId
      // ============================================================================
      if (updateData.teacherId || user.teacherId) {
        console.error('[DATA INTEGRITY] ❌ PREVENTED: Student has teacherId field!');
        return res.status(400).json({
          success: false,
          message: 'Data integrity error: Students cannot have a teacher ID',
        });
      }
      
    } else if (finalRole === 'faculty' || finalRole === 'admin') {
      // Faculty/Admin fields ONLY
      console.log('[UPDATE USER] UPDATING FACULTY/ADMIN FIELDS');
      
      if (teacherId !== undefined && teacherId !== '') {
        // TASK 2: FIX UNIQUE CHECK - Exclude current user from uniqueness check
        const existingTeacherId = await User.findOne({
          teacherId,
          _id: { $ne: req.params.id } // Exclude current user
        });

        if (existingTeacherId) {
          return res.status(409).json({
            success: false,
            message: `Teacher ID "${teacherId}" is already in use by another user`,
          });
        }

        updateData.teacherId = teacherId;
      }

      // ============================================================================
      // TASK 3: PREVENT INVALID MIXED DATA - Faculty/Admin must NOT have registrationNumber or classroomId
      // ============================================================================
      if (updateData.registrationNumber || updateData.classroomId || user.registrationNumber || user.classroomId) {
        console.error('[DATA INTEGRITY] ❌ PREVENTED: Faculty/Admin has student fields!');
        return res.status(400).json({
          success: false,
          message: 'Data integrity error: Faculty/Admin users cannot have registration number or classroom ID',
        });
      }
    }

    // Validate email uniqueness (for all roles)
    if (email !== undefined && email !== user.email) {
      const existingEmail = await User.findOne({
        email,
        _id: { $ne: req.params.id }
      });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use by another user',
        });
      }
    }

    // Validate registrationNumber uniqueness for students
    if (finalRole === 'student' && registrationNumber !== undefined && registrationNumber !== '' && registrationNumber !== user.registrationNumber) {
      const existingRegNum = await User.findOne({
        registrationNumber,
        _id: { $ne: req.params.id }
      });
      if (existingRegNum) {
        return res.status(409).json({
          success: false,
          message: `Registration number "${registrationNumber}" is already in use by another user`,
        });
      }
    }

    // ============================================================================
    // TASK 1: CLEAN DATA ON ROLE CHANGE
    // ============================================================================
    // Build unset object for fields that should be removed based on ROLE CHANGE
    const unsetData = {};
    
    if (finalRole === 'student') {
      // For students: REMOVE all faculty/admin fields
      console.log('[TASK 1] Cleaning student role: removing teacherId');
      unsetData.teacherId = 1;
    } else if (finalRole === 'faculty' || finalRole === 'admin') {
      // For faculty/admin: REMOVE all student fields
      console.log('[TASK 1] Cleaning faculty/admin role: removing student fields');
      unsetData.registrationNumber = 1;
      unsetData.classroomId = 1;
      unsetData.courseType = 1;
      unsetData.specialization = 1;
    }

    // ============================================================================
    // TASK 2: ENFORCE ROLE STRUCTURE - Validate required fields exist BEFORE saving
    // ============================================================================
    if (finalRole === 'student') {
      const finalRegNum = updateData.registrationNumber || user.registrationNumber;
      const finalClassroom = updateData.classroomId || user.classroomId;

      if (!finalRegNum) {
        return res.status(400).json({
          success: false,
          message: 'Data integrity check failed: Student must have a registration number',
        });
      }
      if (!finalClassroom) {
        return res.status(400).json({
          success: false,
          message: 'Data integrity check failed: Student must have a classroom assignment',
        });
      }
      console.log('[TASK 2] ✓ Student role enforced: registrationNumber and classroomId present');
    } else if (finalRole === 'faculty' || finalRole === 'admin') {
      const finalTeacherId = updateData.teacherId || user.teacherId;

      if (!finalTeacherId) {
        return res.status(400).json({
          success: false,
          message: `Data integrity check failed: ${finalRole} must have a teacher ID`,
        });
      }
      console.log('[TASK 2] ✓ Faculty/Admin role enforced: teacherId present');
    }

    console.log('[UPDATE USER] UNSET DATA:', JSON.stringify(unsetData, null, 2));

    // Use findByIdAndUpdate with both $set and $unset operators
    // This properly handles the MongoDB $unset operator to avoid E11000 errors
    const updateQuery = { $set: updateData };
    if (Object.keys(unsetData).length > 0) {
      updateQuery.$unset = unsetData;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true, runValidators: true }
    );

    console.log('[UPDATE USER] SUCCESS - User saved:', {
      _id: updatedUser._id,
      name: updatedUser.name,
      role: updatedUser.role,
      registrationNumber: updatedUser.registrationNumber,
      teacherId: updatedUser.teacherId,
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        registrationNumber: updatedUser.registrationNumber,
        teacherId: updatedUser.teacherId,
        classroomId: updatedUser.classroomId,
        courseType: updatedUser.courseType,
        specialization: updatedUser.specialization,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error('[UPDATE USER] ERROR:', error.message);
    next(error);
  }
};

/**
 * Get current user profile
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-passwordHash')
      .populate('classroomId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign HOD role to a faculty user — admin only
 * Only one user can have HOD role at a time
 * Removes HOD role from existing HOD if any
 */
exports.assignHOD = async (req, res, next) => {
  try {
    // Ensure only admin can assign HOD
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can assign HOD',
      });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId',
      });
    }

    // Fetch the user to be promoted to HOD
    const newHOD = await User.findById(userId);
    if (!newHOD) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent assigning HOD to non-faculty users (except already HOD)
    if (newHOD.role !== 'faculty' && newHOD.role !== 'hod') {
      return res.status(400).json({
        success: false,
        message: 'Only faculty members can be assigned as HOD',
      });
    }

    // If user is already HOD, no change needed
    if (newHOD.role === 'hod') {
      return res.status(200).json({
        success: true,
        message: 'User is already HOD',
        data: newHOD,
      });
    }

    // Find and remove HOD role from existing HOD user
    const existingHOD = await User.findOne({ role: 'hod' });
    if (existingHOD) {
      existingHOD.role = 'faculty'; // Demote existing HOD back to faculty
      await existingHOD.save();
    }

    // Assign HOD role to new user
    newHOD.role = 'hod';
    await newHOD.save();

    res.status(200).json({
      success: true,
      message: 'HOD assigned successfully',
      data: {
        _id: newHOD._id,
        name: newHOD.name,
        email: newHOD.email,
        role: newHOD.role,
        isActive: newHOD.isActive,
        previousHOD: existingHOD ? {
          _id: existingHOD._id,
          name: existingHOD.name,
          email: existingHOD.email,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user — admin only
 * Prevents deletion of HOD user
 */
exports.deleteUser = async (req, res, next) => {
  try {
    // Ensure only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete users',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting HOD user
    if (user.role === 'hod') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete HOD user. Assign HOD role to another user first.',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password — authenticated users only
 * User must verify current password before changing
 * Sets isFirstLogin to false after successful password change
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password, new password, and confirm password',
      });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if new password is same as current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    // Get user with password hash
    const user = await User.findById(req.user.userId).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isPasswordMatch = await user.matchPassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password and set isFirstLogin to false
    user.passwordHash = newPassword; // Pre-save hook will hash it
    user.isFirstLogin = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password to default — admin only
 * Sets password to a default value and marks isFirstLogin as true
 * Used by admins to reset user passwords
 */
exports.resetPassword = async (req, res, next) => {
  try {
    // Ensure only admin can reset passwords
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can reset passwords',
      });
    }

    const { userId } = req.body;
    const DEFAULT_PASSWORD = 'Welcome@123';

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent resetting admin's own password
    if (user._id.toString() === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reset your own password',
      });
    }

    // Reset password and set isFirstLogin to true
    user.passwordHash = DEFAULT_PASSWORD;
    user.isFirstLogin = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isFirstLogin: user.isFirstLogin,
        defaultPassword: DEFAULT_PASSWORD, // Send to admin only for display
      },
    });
  } catch (error) {
    next(error);
  }
};

