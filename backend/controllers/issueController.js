const Issue = require('../models/Issue');
const issueService = require('../services/issueService');

/**
 * POST /api/issues
 * Create a new issue. If category === "asset", syncs with Asset collection.
 */
exports.createIssue = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;
    const { userId } = req.user;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required',
      });
    }

    // Build issue data from request
    const issueData = {
      title,
      description,
      category,
      priority: priority || 'normal',
      createdBy: userId,
      proofImage: req.file ? `uploads/issues/${req.file.filename}` : null,
    };

    // Asset-specific fields
    if (category === 'asset') {
      const { assetType, block, room, quantity, issueType } = req.body;

      if (!assetType || !block || !room || !quantity || !issueType) {
        return res.status(400).json({
          success: false,
          message: 'Asset issues require: assetType, block, room, quantity, issueType',
        });
      }

      issueData.assetType = assetType;
      issueData.block = block;
      issueData.room = room;
      issueData.quantity = Number(quantity);
      issueData.issueType = issueType;
    }

    // Academic-specific fields
    if (category === 'academic') {
      const { subject, facultyName } = req.body;

      if (!subject) {
        return res.status(400).json({
          success: false,
          message: 'Academic issues require a subject',
        });
      }

      issueData.subject = subject;
      issueData.facultyName = facultyName || null;
    }

    const issue = await issueService.createIssueWithSync(issueData);

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: issue,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * GET /api/issues/my
 * Get issues for the logged-in user.
 * Students see only their own. Faculty/Admin/HOD see all.
 */
exports.getMyIssues = async (req, res, next) => {
  try {
    const filter = issueService.buildIssueFilter(req.user, req.query);

    const issues = await Issue.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/issues
 * Get all issues (Admin / HOD).
 * Supports filters: status, priority, category
 */
exports.getAllIssues = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.category = req.query.category;

    const issues = await Issue.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/issues/:id
 * Get a single issue by ID with full population.
 */
exports.getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id).populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'comments.user', select: 'name email role' },
    ]);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/issues/:id/status
 * Update issue status / priority / assignment.
 * On resolution of asset issues, reverses the asset count.
 */
exports.updateIssueStatus = async (req, res, next) => {
  try {
    const { status, priority, assignedTo } = req.body;

    if (!status && !priority && (assignedTo === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update: status, priority, or assignedTo',
      });
    }

    const issue = await issueService.updateIssueStatus(
      req.params.id,
      { status, priority, assignedTo },
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Issue updated successfully',
      data: issue,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * POST /api/issues/:id/resolution-proof
 * Upload resolution proof image.
 */
exports.uploadResolutionProof = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a proof image',
      });
    }

    issue.proofImage = `uploads/issues/${req.file.filename}`;
    await issue.save();
    await issue.populate(['createdBy', 'assignedTo', 'comments.user']);

    res.status(200).json({
      success: true,
      message: 'Resolution proof uploaded successfully',
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/issues/:id/comments
 * Add a comment to an issue.
 */
exports.addComment = async (req, res, next) => {
  try {
    const commentText = req.body.text || req.body.comment;
    const { userId } = req.user;

    if (!commentText) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    issue.comments.push({
      user: userId,
      text: commentText,
      createdAt: Date.now(),
    });

    await issue.save();
    await issue.populate(['createdBy', 'assignedTo', 'comments.user']);

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};
