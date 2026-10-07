const Utility = require('../models/Utility');
const Classroom = require('../models/Classroom');

/**
 * Create a new utility
 * Admin only
 */
exports.createUtility = async (req, res, next) => {
  try {
    const { utilityName, category, location, quantity, description, classroomId, status } = req.body;

    if (!utilityName || !category || !location || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate category
    if (!['furniture', 'equipment', 'facilities'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    // Validate classroom if provided
    if (classroomId) {
      const classroom = await Classroom.findById(classroomId);
      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found',
        });
      }
    }

    const utility = await Utility.create({
      utilityName,
      category: category.toLowerCase(),
      location,
      quantity,
      description: description || '',
      classroomId: classroomId || null,
      status: status || 'working',
    });

    res.status(201).json({
      success: true,
      message: 'Utility created successfully',
      data: utility,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all utilities
 * Admin only - can filter by category or classroom
 */
exports.getAllUtilities = async (req, res, next) => {
  try {
    const { category, location, classroomId, status } = req.query;

    let filter = {};
    if (category) filter.category = category.toLowerCase();
    if (location) filter.location = new RegExp(location, 'i');
    if (classroomId) filter.classroomId = classroomId;
    if (status) filter.status = status;

    const utilities = await Utility.find(filter)
      .populate('classroomId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: utilities.length,
      data: utilities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get utility by ID
 */
exports.getUtilityById = async (req, res, next) => {
  try {
    const utility = await Utility.findById(req.params.id).populate('classroomId');

    if (!utility) {
      return res.status(404).json({
        success: false,
        message: 'Utility not found',
      });
    }

    res.status(200).json({
      success: true,
      data: utility,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update utility
 * Admin only
 */
exports.updateUtility = async (req, res, next) => {
  try {
    const { utilityName, category, location, quantity, description, status } = req.body;

    const utility = await Utility.findById(req.params.id);

    if (!utility) {
      return res.status(404).json({
        success: false,
        message: 'Utility not found',
      });
    }

    if (utilityName) utility.utilityName = utilityName;
    if (category) utility.category = category.toLowerCase();
    if (location) utility.location = location;
    if (quantity !== undefined) utility.quantity = quantity;
    if (description !== undefined) utility.description = description;
    if (status) utility.status = status;

    utility.updatedAt = Date.now();
    await utility.save();

    res.status(200).json({
      success: true,
      message: 'Utility updated successfully',
      data: utility,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete utility
 * Admin only
 */
exports.deleteUtility = async (req, res, next) => {
  try {
    const utility = await Utility.findByIdAndDelete(req.params.id);

    if (!utility) {
      return res.status(404).json({
        success: false,
        message: 'Utility not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Utility deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
