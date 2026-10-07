const Timetable = require('../models/Timetable');
const Classroom = require('../models/Classroom');
const path = require('path');
const fs = require('fs');

/**
 * Upload timetable image for a classroom
 * Admin only
 * Uses multer middleware to handle file upload
 */
exports.uploadTimetable = async (req, res, next) => {
  try {
    const { classroomId } = req.body;
    const { userId } = req.user;

    if (!classroomId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classroom ID',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    // Validate classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check if timetable already exists for classroom
    const existingTimetable = await Timetable.findOne({ classroomId });

    const imageURL = `/uploads/timetables/${req.file.filename}`;

    let timetable;

    if (existingTimetable) {
      // Delete old file
      const oldFilePath = path.join(__dirname, '../uploads/timetables', existingTimetable.fileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      // Update existing timetable
      existingTimetable.imageURL = imageURL;
      existingTimetable.fileName = req.file.filename;
      existingTimetable.fileSize = req.file.size;
      existingTimetable.uploadedBy = userId;
      existingTimetable.uploadedAt = Date.now();

      await existingTimetable.save();
      timetable = existingTimetable;
    } else {
      // Create new timetable
      timetable = await Timetable.create({
        classroomId,
        imageURL,
        fileName: req.file.filename,
        fileSize: req.file.size,
        uploadedBy: userId,
      });
    }

    await timetable.populate(['classroomId', 'uploadedBy']);

    res.status(201).json({
      success: true,
      message: 'Timetable uploaded successfully',
      data: timetable,
    });
  } catch (error) {
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/timetables', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

/**
 * Get timetable for a classroom
 * Students can get timetable for their classroom
 * Faculty can get timetable for their classrooms
 */
exports.getTimetableByClassroom = async (req, res, next) => {
  try {
    const { classroomId } = req.params;

    const timetable = await Timetable.findOne({ classroomId }).populate([
      'classroomId',
      'uploadedBy',
    ]);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found for this classroom',
      });
    }

    res.status(200).json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all timetables
 * Admin only
 */
exports.getAllTimetables = async (req, res, next) => {
  try {
    const timetables = await Timetable.find().populate(['classroomId', 'uploadedBy']).sort({
      uploadedAt: -1,
    });

    res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete timetable
 * Admin only
 */
exports.deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found',
      });
    }

    // Delete file from server
    const filePath = path.join(__dirname, '../uploads/timetables', timetable.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await Timetable.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Timetable deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
