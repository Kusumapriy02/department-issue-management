const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/fileUpload');
const {
  uploadTimetable,
  getTimetableByClassroom,
  getAllTimetables,
  deleteTimetable,
} = require('../controllers/timetableController');
const { authMiddleware, adminOnly, authorize } = require('../middleware/auth');

/**
 * POST /api/timetable/upload
 * Upload a timetable image for a classroom
 * Admin only
 * Expects multipart/form-data with 'timetable' file and 'classroomId' in body
 */
router.post('/upload', authMiddleware, adminOnly, uploadMiddleware, uploadTimetable);

/**
 * GET /api/timetable
 * Get all timetables
 * Admin and HOD (read-only)
 */
router.get('/', authMiddleware, authorize('admin', 'hod'), getAllTimetables);

/**
 * GET /api/timetable/:classroomId
 * Get timetable for a specific classroom
 * Authenticated users (restricted to their classroom if student)
 */
router.get('/:classroomId', authMiddleware, getTimetableByClassroom);

/**
 * DELETE /api/timetable/:id
 * Delete a timetable
 * Admin only
 */
router.delete('/:id', authMiddleware, adminOnly, deleteTimetable);

module.exports = router;
