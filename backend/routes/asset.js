const express = require('express');
const router = express.Router();
const {
  createAsset,
  getAllAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
} = require('../controllers/assetController');
const { authMiddleware, adminOnly, authorize } = require('../middleware/auth');

/**
 * POST /api/assets
 * Create a new asset. Admin only.
 */
router.post('/', authMiddleware, adminOnly, createAsset);

/**
 * GET /api/assets
 * Get all assets. Admin and HOD.
 * Filters: ?block=Department&room=A01&type=Fan
 */
router.get('/', authMiddleware, authorize('admin', 'hod'), getAllAssets);

/**
 * GET /api/assets/:id
 * Get a single asset. Authenticated users.
 */
router.get('/:id', authMiddleware, getAssetById);

/**
 * PUT /api/assets/:id
 * Update an asset. Admin only.
 */
router.put('/:id', authMiddleware, adminOnly, updateAsset);

/**
 * DELETE /api/assets/:id
 * Delete an asset. Admin only.
 */
router.delete('/:id', authMiddleware, adminOnly, deleteAsset);

module.exports = router;
