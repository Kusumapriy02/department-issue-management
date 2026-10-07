const express = require('express');
const router = express.Router();
const {
  createIssue,
  getMyIssues,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  uploadResolutionProof,
  addComment,
} = require('../controllers/issueController');
const { authMiddleware, authorize } = require('../middleware/auth');
const uploadIssueProof = require('../middleware/issueUpload');

/**
 * POST /api/issues
 * Create a new issue with optional proof image.
 * Students, Faculty, Admin, HOD can create issues.
 */
router.post('/', authMiddleware, authorize('student', 'faculty', 'admin', 'hod'), uploadIssueProof, createIssue);

/**
 * GET /api/issues
 * Get all issues (Admin and HOD only).
 * Filters: ?status=open&priority=high&category=asset
 */
router.get('/', authMiddleware, authorize('admin', 'hod'), getAllIssues);

/**
 * GET /api/issues/my
 * Get issues for the logged-in user.
 * Students see only their own. Faculty/Admin/HOD see all.
 */
router.get('/my', authMiddleware, getMyIssues);

/**
 * GET /api/issues/:id
 * Get a specific issue by ID.
 * All authenticated users.
 */
router.get('/:id', authMiddleware, getIssueById);

/**
 * PUT /api/issues/:id/status
 * PATCH /api/issues/:id/status
 * Update issue status, priority, or assignment.
 * Faculty, Admin, HOD only.
 */
router.put('/:id/status', authMiddleware, authorize('faculty', 'admin', 'hod'), updateIssueStatus);
router.patch('/:id/status', authMiddleware, authorize('faculty', 'admin', 'hod'), updateIssueStatus);

/**
 * POST /api/issues/:id/resolution-proof
 * Upload resolution proof image.
 * Faculty, Admin, HOD only.
 */
router.post('/:id/resolution-proof', authMiddleware, authorize('faculty', 'admin', 'hod'), uploadIssueProof, uploadResolutionProof);

/**
 * POST /api/issues/:id/comments
 * Add a comment to an issue.
 * All authenticated users.
 */
router.post('/:id/comments', authMiddleware, addComment);

module.exports = router;
