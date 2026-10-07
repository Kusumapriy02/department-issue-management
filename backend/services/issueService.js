const Asset = require('../models/Asset');
const Issue = require('../models/Issue');

const normalize = (val) => (val || '').toString().trim().toUpperCase();

// ═══════════════════════════════════════════════════════════
//  AGGREGATION: Compute damaged from ACTIVE issues only
// ═══════════════════════════════════════════════════════════

/**
 * Aggregate damaged counts per asset from ACTIVE issues.
 * ACTIVE = status !== 'resolved'.
 *
 * Groups by (assetType + block + room) and sums quantity.
 * Only counts issueType === 'damaged'.
 *
 * @param {Object} [filter] - optional narrowing { type, block, room }
 * @returns {Map<string, { damaged: number }>}
 *   Key = "assetType|block|room"
 */
const aggregateAssetCounts = async (filter = {}) => {
  const matchStage = {
    category: 'asset',
    issueType: 'damaged',
    status: { $ne: 'resolved' },
  };
  if (filter.type) matchStage.assetType = normalize(filter.type);
  if (filter.block) matchStage.block = normalize(filter.block);
  if (filter.room) matchStage.room = normalize(filter.room);

  const pipeline = [
    { $match: matchStage },
    {
      $addFields: {
        _normAssetType: { $toUpper: { $trim: { input: '$assetType' } } },
        _normBlock: { $toUpper: { $trim: { input: '$block' } } },
        _normRoom: { $toUpper: { $trim: { input: '$room' } } },
      },
    },
    {
      $group: {
        _id: {
          assetType: '$_normAssetType',
          block: '$_normBlock',
          room: '$_normRoom',
        },
        damaged: { $sum: '$quantity' },
      },
    },
  ];

  const results = await Issue.aggregate(pipeline);

  const countsMap = new Map();

  for (const row of results) {
    const key = `${normalize(row._id.assetType)}|${normalize(row._id.block)}|${normalize(row._id.room)}`;
    countsMap.set(key, { damaged: row.damaged });
  }

  return countsMap;
};

const enrichAssetsWithCounts = (assets, countsMap) => {
  return assets.map((asset) => {
    const key = `${normalize(asset.type)}|${normalize(asset.block)}|${normalize(asset.room)}`;
    const counts = countsMap.get(key) || { damaged: 0 };
    const damaged = counts.damaged;
    const working = asset.total - damaged;

    return {
      ...asset,
      damaged,
      maintenance: 0,
      working: Math.max(0, working),
    };
  });
};

// ═══════════════════════════════════════════════════════════
//  ISSUE CREATION with Asset validation
// ═══════════════════════════════════════════════════════════

/**
 * Create an issue. If category === "asset", validate that the
 * matching asset exists and that the new issue won't exceed
 * available working units.
 *
 * No $inc on Asset — counts are purely aggregated at read time.
 *
 * @param {Object} issueData
 * @returns {Object} populated Issue document
 */
const createIssueWithSync = async (issueData) => {
  if (issueData.category === 'asset') {
    const { assetType, block, room, quantity } = issueData;

    // 1. Asset must exist
    const asset = await Asset.findOne({
      type: assetType,
      block,
      room: room.toUpperCase(),
    });

    if (!asset) {
      const error = new Error(
        `Asset not found: ${assetType} in ${block} block, room ${room.toUpperCase()}`
      );
      error.statusCode = 404;
      throw error;
    }

    const countsMap = await aggregateAssetCounts({
      type: normalize(assetType),
      block: normalize(block),
      room: normalize(room),
    });

    const key = `${normalize(assetType)}|${normalize(block)}|${normalize(room)}`;
    const current = countsMap.get(key) || { damaged: 0 };
    const currentUsed = current.damaged;
    const remaining = asset.total - currentUsed;

    if (quantity > remaining) {
      const error = new Error(
        `Cannot mark ${quantity} ${assetType}(s) as ${issueData.issueType}. ` +
        `Only ${remaining} working unit(s) available ` +
        `(total: ${asset.total}, damaged: ${current.damaged})`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const issue = await Issue.create(issueData);
  await issue.populate(['createdBy', 'assignedTo']);
  return issue;
};

// ═══════════════════════════════════════════════════════════
//  STATUS UPDATE with lifecycle enforcement
// ═══════════════════════════════════════════════════════════

/**
 * Transition issue status with lifecycle enforcement.
 *
 * Since counts are aggregated dynamically, resolving an asset issue
 * automatically removes it from the aggregation (status becomes "resolved").
 * No manual decrement needed.
 *
 * @param {string} issueId
 * @param {Object} updateFields - { status, priority, assignedTo }
 * @param {Object} requestingUser - { userId, role }
 * @returns {Object} updated, populated Issue document
 */
const updateIssueStatus = async (issueId, updateFields, requestingUser) => {
  const issue = await Issue.findById(issueId);

  if (!issue) {
    const error = new Error('Issue not found');
    error.statusCode = 404;
    throw error;
  }

  const { status, priority, assignedTo } = updateFields;

  // ──── Status lifecycle enforcement ────
  if (status) {
    const validTransitions = {
      'open': ['in-progress', 'resolved'],
      'in-progress': ['resolved'],
      'resolved': [], // terminal state
    };

    const allowed = validTransitions[issue.status] || [];
    if (!allowed.includes(status)) {
      const error = new Error(
        `Cannot transition from "${issue.status}" to "${status}". ` +
        `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (already resolved)'}`
      );
      error.statusCode = 400;
      throw error;
    }

    issue.status = status;
    if (status === 'resolved') {
      issue.resolvedAt = new Date();
    }
  }

  if (priority) issue.priority = priority;
  if (assignedTo !== undefined) issue.assignedTo = assignedTo || null;

  await issue.save();
  await issue.populate(['createdBy', 'assignedTo', 'comments.user']);

  return issue;
};

// ═══════════════════════════════════════════════════════════
//  FILTER BUILDER
// ═══════════════════════════════════════════════════════════

/**
 * Build a MongoDB filter based on user role and query params.
 *
 * @param {Object} user - { userId, role }
 * @param {Object} query - { status, priority, category }
 * @returns {Object} MongoDB filter
 */
const buildIssueFilter = (user, query) => {
  const filter = {};

  // Role-based scoping
  if (user.role === 'student') {
    filter.createdBy = user.userId;
  }

  // Query param filters
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;

  return filter;
};

module.exports = {
  aggregateAssetCounts,
  enrichAssetsWithCounts,
  createIssueWithSync,
  updateIssueStatus,
  buildIssueFilter,
};
