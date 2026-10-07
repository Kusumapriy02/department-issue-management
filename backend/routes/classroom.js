const express = require('express');
const router = express.Router();
const {
  createClassroom,
  getAllClassrooms,
  getMyClassrooms,
  getClassroomById,
  getClassroomStudents,
  updateClassroom,
  deleteClassroom,
  getAvailableRooms,
} = require('../controllers/classroomController');
const { authMiddleware, adminOnly, authorize } = require('../middleware/auth');

/**
 * POST /api/classrooms
 * Create a new classroom
 * Admin only
 */
router.post('/', authMiddleware, adminOnly, createClassroom);

/**
 * GET /api/classrooms
 * Get all classrooms
 * Admin and HOD (read-only)
 */
router.get('/', authMiddleware, authorize('admin', 'hod'), getAllClassrooms);

/**
 * GET /api/classrooms/my
 * Get classrooms assigned to the logged-in faculty
 * Faculty and Admin
 */
router.get('/my', authMiddleware, getMyClassrooms);

/**
 * GET /api/classrooms/available-rooms?block=Main Block&excludeClassroomId=...
 * Get available rooms for a specific block
 * Admin only
 */
router.get('/available-rooms/:block', authMiddleware, adminOnly, getAvailableRooms);

/**
 * GET /api/classrooms/:id/students
 * Get ONLY students assigned to a specific classroom
 * Admin only
 * MUST come before /:id route to avoid catching it
 */
router.get('/:id/students', authMiddleware, authorize('admin', 'hod'), getClassroomStudents);

/**
 * GET /api/classrooms/:id
 * Get a specific classroom
 * Authenticated users
 */
router.get('/:id', authMiddleware, getClassroomById);

/**
 * PUT /api/classrooms/:id
 * Update a classroom
 * Admin only
 */
router.put('/:id', authMiddleware, adminOnly, updateClassroom);

/**
 * DELETE /api/classrooms/:id
 * Delete a classroom
 * Admin only
 */
router.delete('/:id', authMiddleware, adminOnly, deleteClassroom);

module.exports = router;
