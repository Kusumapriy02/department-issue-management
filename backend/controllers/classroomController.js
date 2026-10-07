const Classroom = require('../models/Classroom');
const Room = require('../models/Room');
const User = require('../models/User');
const { getRoomsForBlock } = require('../config/roomsConfig');

/**
 * Create a new classroom
 * Admin only
 */
exports.createClassroom = async (req, res, next) => {
  try {
    const { course, specialization, year, section, block, room, department, cr, lr, facultyList } = req.body;

    // Validate required fields
    if (!course || !specialization || year === undefined || !section || !block || !room) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course, specialization, year, section, block, and room',
      });
    }

    // Validate course value
    if (!['BTech', 'MTech'].includes(course)) {
      return res.status(400).json({
        success: false,
        message: 'Course must be either BTech or MTech',
      });
    }

    // Validate year based on course
    const maxYear = course === 'MTech' ? 2 : 4;
    if (year < 1 || year > maxYear) {
      return res.status(400).json({
        success: false,
        message: `Year must be between 1 and ${maxYear} for ${course}`,
      });
    }

    // ==================== CHECK FOR DUPLICATES ====================
    // Ensure combination of course + specialization + year + section is unique
    const existingClassroom = await Classroom.findOne({
      course,
      specialization: specialization.toUpperCase(),
      year: parseInt(year),
      section: section.toUpperCase(),
    });

    if (existingClassroom) {
      return res.status(409).json({
        success: false,
        message: `Classroom already exists: ${course} - ${specialization.toUpperCase()} Year ${year} Section ${section.toUpperCase()}`,
      });
    }

    // ==================== VALIDATE ROOM ====================
    // MODIFIED: Room is now a string (e.g., 'A41', 'A02') instead of ObjectID
    // Simply validate that room is provided and is a string
    if (!room || typeof room !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Room must be a valid string (e.g., A41, GFCL1)',
      });
    }

    // Check if another classroom is already assigned to this room
    const existingRoomAssignment = await Classroom.findOne({
      block,
      room,
    });

    if (existingRoomAssignment) {
      return res.status(409).json({
        success: false,
        message: `Room ${room} in ${block} is already assigned to another classroom`,
      });
    }

    // Check if CR exists and is a valid user
    if (cr) {
      const crUser = await User.findById(cr);
      if (!crUser) {
        return res.status(404).json({
          success: false,
          message: 'CR user not found',
        });
      }
    }

    // Check if LR exists and is a valid user
    if (lr) {
      const lrUser = await User.findById(lr);
      if (!lrUser) {
        return res.status(404).json({
          success: false,
          message: 'LR user not found',
        });
      }
    }

    // Create classroom
    const classroom = await Classroom.create({
      course,
      specialization: specialization.toUpperCase(),
      year,
      section: section.toUpperCase(),
      block,
      room,
      department: department || specialization,
      cr: cr || null,
      lr: lr || null,
      facultyList: facultyList || [],
    });

    // MODIFIED: Room is stored as a string, no need to update Room document
    await classroom.populate(['cr', 'lr', 'facultyList']);

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      data: classroom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all classrooms
 * Admin only
 */
exports.getAllClassrooms = async (req, res, next) => {
  try {
    const { course, specialization, year, section, block, department } = req.query;

    let filter = {};
    if (course) filter.course = course;
    if (specialization) filter.specialization = specialization.toUpperCase();
    if (year) filter.year = parseInt(year);
    if (section) filter.section = section.toUpperCase();
    if (block) filter.block = block;
    if (department) filter.department = department;

    const classrooms = await Classroom.find(filter)
      .populate(['cr', 'lr', 'facultyList'])
      .sort({ course: 1, specialization: 1, year: 1, section: 1 });

    res.status(200).json({
      success: true,
      count: classrooms.length,
      data: classrooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single classroom by ID
 */
exports.getClassroomById = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id).populate([
      'cr',
      'lr',
      'facultyList',
    ]);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    res.status(200).json({
      success: true,
      data: classroom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update classroom details
 * Admin only
 */
exports.updateClassroom = async (req, res, next) => {
  try {
    const { course, specialization, year, section, block, room, department, cr, lr, facultyList } = req.body;

    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // If course is being updated, validate it
    if (course && !['BTech', 'MTech'].includes(course)) {
      return res.status(400).json({
        success: false,
        message: 'Course must be either BTech or MTech',
      });
    }

    // If year is being updated, validate it based on course
    if (year !== undefined) {
      const courseToCheck = course || classroom.course;
      const maxYear = courseToCheck === 'MTech' ? 2 : 4;
      if (year < 1 || year > maxYear) {
        return res.status(400).json({
          success: false,
          message: `Year must be between 1 and ${maxYear} for ${courseToCheck}`,
        });
      }
    }

    // ==================== HANDLE ROOM CHANGE ====================
    // MODIFIED: Room is now a string instead of ObjectID
    if (room && room !== classroom.room) {
      // User is changing the room
      if (typeof room !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Room must be a valid string (e.g., A41, GFCL1)',
        });
      }

      // Check if new room is already assigned to another classroom
      const existingRoomAssignment = await Classroom.findOne({
        _id: { $ne: classroom._id },
        block: block || classroom.block,
        room,
      });

      if (existingRoomAssignment) {
        return res.status(409).json({
          success: false,
          message: `Room ${room} in ${block || classroom.block} is already assigned to another classroom`,
        });
      }
    }

    // Check if CR exists and is a valid user
    if (cr !== undefined) {
      if (cr && !classroom.cr?.equals(cr)) {
        const crUser = await User.findById(cr);
        if (!crUser) {
          return res.status(404).json({
            success: false,
            message: 'CR user not found',
          });
        }
      }
    }

    // Check if LR exists and is a valid user
    if (lr !== undefined) {
      if (lr && !classroom.lr?.equals(lr)) {
        const lrUser = await User.findById(lr);
        if (!lrUser) {
          return res.status(404).json({
            success: false,
            message: 'LR user not found',
          });
        }
      }
    }

    // Update fields if provided
    if (course) classroom.course = course;
    if (specialization) classroom.specialization = specialization.toUpperCase();
    if (year !== undefined) classroom.year = year;
    if (section) classroom.section = section.toUpperCase();
    if (block) classroom.block = block;
    if (room) classroom.room = room;
    if (department) classroom.department = department;
    if (cr !== undefined) classroom.cr = cr || null;
    if (lr !== undefined) classroom.lr = lr || null;
    if (facultyList) classroom.facultyList = facultyList;

    // MODIFIED: Room is stored as a string, no need to update Room document
    await classroom.save();
    await classroom.populate(['cr', 'lr', 'facultyList']);

    res.status(200).json({
      success: true,
      message: 'Classroom updated successfully',
      data: classroom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get classrooms assigned to the logged-in faculty
 * Faculty only
 */
exports.getMyClassrooms = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const classrooms = await Classroom.find({ facultyList: userId })
      .populate(['cr', 'lr', 'facultyList'])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: classrooms.length,
      data: classrooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a classroom
 * Admin only
 */
exports.deleteClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // MODIFIED: Room is stored as a string, no need to clear Room document assignment
    await Classroom.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Classroom deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available rooms by block
 * Shows unassigned rooms, or assigned room if editing that classroom
 * Admin only
 */
exports.getAvailableRooms = async (req, res, next) => {
  try {
    const { block } = req.params;
    const { excludeClassroomId } = req.query;

    if (!block) {
      return res.status(400).json({
        success: false,
        message: 'Please provide block parameter',
      });
    }

    // Validate block
    if (!['Main Block', 'Algorithm Block'].includes(block)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid block. Must be "Main Block" or "Algorithm Block"',
      });
    }

    // MODIFIED: Use predefined room config instead of Room model
    // Get all predefined rooms for this block
    const allRoomsForBlock = getRoomsForBlock(block);
    
    if (!allRoomsForBlock || allRoomsForBlock.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No rooms defined for this block',
      });
    }

    // Find classrooms that already have rooms assigned in this block
    const assignedRooms = await Classroom.find(
      {
        block,
        room: { $in: allRoomsForBlock },
        ...(excludeClassroomId && { _id: { $ne: excludeClassroomId } }),
      },
      { room: 1 }
    );

    // Get list of already-assigned room strings
    const assignedRoomSet = new Set(assignedRooms.map(c => c.room));

    // Return available rooms (predefined rooms minus assigned ones)
    const availableRooms = allRoomsForBlock.filter(room => !assignedRoomSet.has(room));

    res.status(200).json({
      success: true,
      count: availableRooms.length,
      data: availableRooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get students for a specific classroom.
 * Classroom schema has no students array — students reference their classroom
 * via User.classroomId (ObjectId ref to Classroom).
 * Query: User.find({ classroomId: classroom._id, role: 'student' })
 * Admin only.
 */
exports.getClassroomStudents = async (req, res, next) => {
  try {
    // 1. Verify classroom exists
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // 2. Query students assigned to this classroom
    const students = await User.find({
      classroomId: classroom._id,
      role: 'student',
    })
      .select('name email registrationNumber')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};
