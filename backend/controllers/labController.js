const Lab = require('../models/Lab');
const User = require('../models/User');

/**
 * Create a new lab
 * Admin only
 */
exports.createLab = async (req, res, next) => {
  try {
    const { labName, roomNumber, numberOfSystems, accessories, incharge, department } = req.body;

    if (!labName || !roomNumber || !numberOfSystems || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if lab already exists with given roomNumber
    const existingLab = await Lab.findOne({ roomNumber });
    if (existingLab) {
      return res.status(409).json({
        success: false,
        message: 'Lab with this room number already exists',
      });
    }

    // Validate incharge if provided
    if (incharge) {
      const user = await User.findById(incharge);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Incharge user not found',
        });
      }
    }

    const lab = await Lab.create({
      labName,
      roomNumber,
      numberOfSystems,
      accessories: accessories || [],
      incharge: incharge || null,
      department,
    });

    await lab.populate('incharge');

    res.status(201).json({
      success: true,
      message: 'Lab created successfully',
      data: lab,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all labs
 * Admin only - can filter by department
 */
exports.getAllLabs = async (req, res, next) => {
  try {
    const { department } = req.query;

    let filter = {};
    if (department) filter.department = department;

    const labs = await Lab.find(filter).populate('incharge').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: labs.length,
      data: labs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lab by ID
 */
exports.getLabById = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id).populate('incharge');

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found',
      });
    }

    res.status(200).json({
      success: true,
      data: lab,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update lab
 * Admin only
 */
exports.updateLab = async (req, res, next) => {
  try {
    const { labName, numberOfSystems, accessories, incharge, department } = req.body;

    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found',
      });
    }

    if (labName) lab.labName = labName;
    if (numberOfSystems !== undefined) lab.numberOfSystems = numberOfSystems;
    if (accessories) lab.accessories = accessories;
    if (incharge !== undefined) lab.incharge = incharge || null;
    if (department) lab.department = department;

    lab.updatedAt = Date.now();
    await lab.save();
    await lab.populate('incharge');

    res.status(200).json({
      success: true,
      message: 'Lab updated successfully',
      data: lab,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete lab
 * Admin only
 */
exports.deleteLab = async (req, res, next) => {
  try {
    const lab = await Lab.findByIdAndDelete(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lab deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
