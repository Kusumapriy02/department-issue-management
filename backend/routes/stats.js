const express = require('express');
const router = express.Router();
const { getAdminStats, getFacultyStats, getStudentStats } = require('../controllers/statsController');
const { authMiddleware, adminOnly, facultyOnly, studentOnly, authorize } = require('../middleware/auth');

router.get('/admin', authMiddleware, authorize('admin', 'hod'), getAdminStats);
router.get('/faculty', authMiddleware, facultyOnly, getFacultyStats);
router.get('/student', authMiddleware, studentOnly, getStudentStats);

module.exports = router;
