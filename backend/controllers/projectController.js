const Project = require('../models/Project');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { checkAndUpdateProjectStatus, checkAndUpdateMultipleProjects } = require('../utils/deadlineUtils');

/**
 * Create a new project assignment
 * Faculty can create projects for their classes
 */
exports.createProject = async (req, res, next) => {
  try {
    const { projectTitle, subject, description, classroomId, teamMembers, deadline, maxTeamSize } = req.body;
    const { userId } = req.user;

    if (!projectTitle || !subject || !classroomId || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide projectTitle, subject, classroomId, and deadline',
      });
    }

    // Validate classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check if faculty is assigned to this classroom
const isAssigned = classroom.facultyList.some(
  (id) => id.toString() === userId.toString()
);

if (!isAssigned) {
  return res.status(403).json({
    success: false,
    message: 'You are not assigned to this classroom',
  });
}

    const project = await Project.create({
      projectTitle,
      subject,
      description: description || '',
      facultyId: userId,
      classroomId,
      teamMembers: teamMembers || [],
      deadline,
      maxTeamSize: maxTeamSize || 5,
    });

    await project.populate('classroomId facultyId');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get projects for a specific classroom
 * Faculty can get projects for their classrooms
 * Students can get projects for their classroom
 */
exports.getProjectsByClassroom = async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const { userId, role } = req.user;

    // Validate classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
      });
    }

    // Check permissions
    if (role === 'faculty') {
      if (!classroom.facultyList.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this classroom',
        });
      }
    } else if (role === 'student') {
      const user = await User.findById(userId);
      if (user.classroomId.toString() !== classroomId) {
        return res.status(403).json({
          success: false,
          message: 'You are not in this classroom',
        });
      }
    }

    const projects = await Project.find({ classroomId }).populate('facultyId classroomId').sort({ createdAt: -1 });

    // Check and update overdue status for all projects
    await checkAndUpdateMultipleProjects(projects);

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all projects assigned by logged-in faculty
 */
exports.getMyProjects = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const projects = await Project.find({ facultyId: userId })
      .populate('classroomId facultyId')
      .sort({ createdAt: -1 });

    // Check and update overdue status for all projects
    await checkAndUpdateMultipleProjects(projects);

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project by ID
 */
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('facultyId classroomId');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check and update overdue status
    await checkAndUpdateProjectStatus(project);

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project details
 * Faculty can update their own projects
 * When deadline is updated, creates notifications for team members
 */
exports.updateProject = async (req, res, next) => {
  try {
    const { projectTitle, subject, description, deadline, maxTeamSize, status } = req.body;
    const { userId } = req.user;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is the project creator
    if (project.facultyId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own projects',
      });
    }

    // Check if deadline is being changed
    const deadlineChanged = deadline && project.deadline.toString() !== new Date(deadline).toString();
    const oldDeadline = project.deadline;

    if (projectTitle) project.projectTitle = projectTitle;
    if (subject) project.subject = subject;
    if (description !== undefined) project.description = description;
    if (deadline) project.deadline = deadline;
    if (maxTeamSize) project.maxTeamSize = maxTeamSize;
    if (status) project.status = status;

    project.updatedAt = Date.now();
    await project.save();

    // Create notifications for team members if deadline was changed
    if (deadlineChanged && project.teamMembers && project.teamMembers.length > 0) {
      const newDeadlineFormatted = new Date(deadline).toLocaleDateString();
      const notificationMessage = `Project deadline extended to ${newDeadlineFormatted}`;

      // Create notification for each team member
      const notifications = project.teamMembers.map((member) => ({
        userId: member.userId,
        message: notificationMessage,
        type: 'deadline_update',
        projectId: project._id,
      }));

      await Notification.insertMany(notifications);
      console.log(`[DEADLINE] Created ${notifications.length} deadline extension notifications for project ${project._id}`);
    }

    await project.populate('facultyId classroomId');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project status with role-based validation
 * Students can: not_started → in_progress → submitted
 * Faculty can: submitted → evaluated
 * Faculty (creator) can also update status without restrictions
 */
exports.updateProjectStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { userId, role, rollNumber } = req.user;

    // Validate status is provided
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status value',
      });
    }

    // Validate status value
    const validStatuses = ['not_started', 'in_progress', 'submitted', 'evaluated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const currentStatus = project.status;
    let isAuthorized = false;
    let updateReason = '';

    // FACULTY: Can update if they are the project creator
    if (role === 'faculty' && project.facultyId.toString() === userId.toString()) {
      isAuthorized = true;
      updateReason = 'Faculty creator: no restrictions';
    }

    // STUDENTS: Can only update if they are team members
    if (role === 'student') {
      const isTeamMember = project.teamMembers.some((m) => m.userId.toString() === userId.toString());
      
      if (!isTeamMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a team member of this project',
        });
      }

      // STUDENT TRANSITIONS: not_started → in_progress → submitted only
      const allowedTransitions = {
        'not_started': ['in_progress'],
        'in_progress': ['submitted'],
        'submitted': [], // Students cannot go back
        'evaluated': [], // Students cannot change evaluated status
      };

      if (!allowedTransitions[currentStatus].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Students cannot transition from '${currentStatus}' to '${status}'. Allowed transitions: ${(allowedTransitions[currentStatus].length > 0 ? allowedTransitions[currentStatus].join(', ') : 'none')}`,
        });
      }

      isAuthorized = true;
      updateReason = 'Student team member: transition validated';
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this project status',
      });
    }

    // Update status
    project.status = status;
    project.updatedAt = Date.now();
    await project.save();
    await project.populate('facultyId classroomId');

    // Create notification if student updates status
    if (role === 'student' && currentStatus !== status) {
      const statusChangeNotification = {
        userId: project.facultyId._id,
        message: `Project "${project.projectTitle}" status changed to "${status}" by a team member`,
        type: 'project_status',
        projectId: project._id,
      };
      await Notification.create(statusChangeNotification);
    }

    console.log(`[PROJECT STATUS UPDATE] Project: ${project._id}, Status: ${currentStatus} → ${status}, User: ${userId} (${role}), Reason: ${updateReason}`);

    res.status(200).json({
      success: true,
      message: `Project status updated from '${currentStatus}' to '${status}' successfully`,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add team member to project
 * Faculty can add members using roll numbers
 */
exports.addTeamMember = async (req, res, next) => {
  try {
    const { rollNumber } = req.body;
    const { userId } = req.user;

    if (!rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roll number',
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is the project creator
    if (project.facultyId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify your own projects',
      });
    }

    // Check team size limit
    if (project.teamMembers.length >= project.maxTeamSize) {
      return res.status(400).json({
        success: false,
        message: `Team size limit (${project.maxTeamSize}) reached`,
      });
    }

    // Find user by roll number
    const user = await User.findOne({ rollNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this roll number',
      });
    }

    // Validate user is a student
    if (user.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Only students can be added to team',
      });
    }

    // Validate student is in same classroom
    if (!user.classroomId || user.classroomId.toString() !== project.classroomId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Student must be in the same classroom as project',
      });
    }

    // Check if member already exists (by userId, not rollNumber)
    if (project.teamMembers.some((m) => m.userId.toString() === user._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Team member already added',
      });
    }

    project.teamMembers.push({
      rollNumber,
      userId: user._id,
    });

    await project.save();
    await project.populate('facultyId classroomId');

    res.status(200).json({
      success: true,
      message: 'Team member added successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete project
 * Faculty can delete their own projects
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is the project creator
    if (project.facultyId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own projects',
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get projects assigned to logged-in student
 * Students can see projects where they are team members
 */
exports.getAssignedProjects = async (req, res, next) => {
  try {
    const { rollNumber } = req.user;

    if (!rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Student roll number not found',
      });
    }

    // Find all projects where this student is a team member
    const projects = await Project.find({
      'teamMembers.rollNumber': rollNumber,
    })
      .populate('facultyId classroomId')
      .sort({ createdAt: -1 });

    // Check and update overdue status for all projects
    await checkAndUpdateMultipleProjects(projects);

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add project update/comment
 * Students and Faculty can add updates to projects
 */
exports.addProjectUpdate = async (req, res, next) => {
  try {
    const { userId, role, rollNumber } = req.user;
    const { message } = req.body;

    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Update message cannot be empty',
      });
    }

    // Find project
    const project = await Project.findById(req.params.id).populate('teamMembers.userId facultyId');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Authorization check
    let isAuthorized = false;
    if (role === 'faculty' && project.facultyId._id.toString() === userId.toString()) {
      isAuthorized = true;
    } else if (role === 'student') {
      isAuthorized = project.teamMembers.some(m => m.userId._id.toString() === userId.toString());
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to add updates to this project',
      });
    }

    // Add update to project
    project.updates.push({
      userId,
      role,
      message: message.trim(),
      createdAt: new Date(),
    });

    await project.save();
    await project.populate('teamMembers.userId facultyId');

    // Create notifications
    const notificationsToCreate = [];
    const projectTitle = project.projectTitle;

    if (role === 'student') {
      // If student posts, notify faculty
      notificationsToCreate.push({
        userId: project.facultyId._id,
        message: `New update on project "${projectTitle}" from a team member`,
        type: 'project_update',
        projectId: project._id,
      });
    } else if (role === 'faculty') {
      // If faculty posts, notify all team members
      const teamMemberNotifications = project.teamMembers
        .filter(m => m.userId)
        .map(m => ({
          userId: m.userId._id,
          message: `Faculty posted an update on project "${projectTitle}"`,
          type: 'project_update',
          projectId: project._id,
        }));
      notificationsToCreate.push(...teamMemberNotifications);
    }

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }

    // Return updated project with new update
    res.status(201).json({
      success: true,
      message: 'Update posted successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};
