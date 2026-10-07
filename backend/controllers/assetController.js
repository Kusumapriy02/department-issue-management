const Asset = require('../models/Asset');
const { aggregateAssetCounts, enrichAssetsWithCounts } = require('../services/issueService');

/**
 * POST /api/assets
 * Create a new asset. Admin only.
 */
exports.createAsset = async (req, res, next) => {
  try {
    const { type, block, room, total } = req.body;

    if (!type || !block || !room || total == null) {
      return res.status(400).json({
        success: false,
        message: 'All fields required: type, block, room, total',
      });
    }

    // Check for duplicate
    const existing = await Asset.findOne({
      type,
      block,
      room: room.toUpperCase(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Asset "${type}" already exists in ${block} block, room ${room.toUpperCase()}. Update the existing record instead.`,
      });
    }

    const asset = await Asset.create({
      type,
      block,
      room: room.toUpperCase(),
      total: Number(total),
    });

    // Return with computed counts (will be 0 for new asset)
    const enriched = enrichAssetsWithCounts([asset.toObject()], new Map());

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: enriched[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/assets
 * Get all assets with dynamically computed damaged/maintenance/working.
 * Supports filters: ?block=Department&room=A01&type=Fan
 */
exports.getAllAssets = async (req, res, next) => {
  try {
    const { block, room, type } = req.query;

    const filter = {};
    if (block) filter.block = block;
    if (room) filter.room = room.toUpperCase();
    if (type) filter.type = type;

    const assets = await Asset.find(filter)
      .sort({ block: 1, room: 1, type: 1 })
      .lean();

    const aggregationFilter = {};
    if (block) aggregationFilter.block = block;
    if (room) aggregationFilter.room = room.toUpperCase();
    if (type) aggregationFilter.type = type;

    const countsMap = await aggregateAssetCounts(aggregationFilter);

    // Enrich every asset with computed damaged/maintenance/working
    const enrichedAssets = enrichAssetsWithCounts(assets, countsMap);

    res.status(200).json({
      success: true,
      count: enrichedAssets.length,
      data: enrichedAssets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/assets/:id
 * Get a single asset by ID with computed counts.
 */
exports.getAssetById = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id).lean();

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    const countsMap = await aggregateAssetCounts({
      type: asset.type,
      block: asset.block,
      room: asset.room,
    });

    const enriched = enrichAssetsWithCounts([asset], countsMap);

    res.status(200).json({
      success: true,
      data: enriched[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/assets/:id
 * Update an asset (type, block, room, total).
 * Validates that new total >= current active usage from issues.
 */
exports.updateAsset = async (req, res, next) => {
  try {
    const { type, block, room, total } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    if (type) asset.type = type;
    if (block) asset.block = block;
    if (room) asset.room = room.toUpperCase();

    if (total != null) {
      const newTotal = Number(total);

      const countsMap = await aggregateAssetCounts({
        type: asset.type,
        block: asset.block,
        room: asset.room,
      });
      const key = `${asset.type.toString().trim().toUpperCase()}|${asset.block.toString().trim().toUpperCase()}|${asset.room.toString().trim().toUpperCase()}`;
      const counts = countsMap.get(key) || { damaged: 0 };
      const activeUsage = counts.damaged;

      if (newTotal < activeUsage) {
        return res.status(400).json({
          success: false,
          message: `Total cannot be less than active usage: ${counts.damaged} damaged = ${activeUsage}`,
        });
      }

      asset.total = newTotal;
    }

    await asset.save();

    const countsMap = await aggregateAssetCounts({
      type: asset.type,
      block: asset.block,
      room: asset.room,
    });
    const enriched = enrichAssetsWithCounts([asset.toObject()], countsMap);

    res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      data: enriched[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/assets/:id
 * Delete an asset. Admin only.
 */
exports.deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
