/**
 * Utility functions for project deadline handling
 */

/**
 * Check if a project is overdue and update status if needed
 * SAFE: Only updates projects that are not 'submitted' or 'evaluated'
 * RETURNS: Updated project (modified if overdue, original if not)
 */
const checkAndUpdateProjectStatus = async (project) => {
  // Don't modify submitted or evaluated projects
  if (project.status === 'submitted' || project.status === 'evaluated') {
    return project;
  }

  // Check if deadline has passed
  const now = new Date();
  const deadline = new Date(project.deadline);

  // If deadline has passed and status is not already overdue, update it
  if (deadline < now && project.status !== 'overdue') {
    project.status = 'overdue';
    await project.save();
    console.log(`[DEADLINE] Project ${project._id} marked as overdue`);
  }

  return project;
};

/**
 * Check and update multiple projects
 */
const checkAndUpdateMultipleProjects = async (projects) => {
  return Promise.all(
    projects.map((project) => checkAndUpdateProjectStatus(project))
  );
};

module.exports = {
  checkAndUpdateProjectStatus,
  checkAndUpdateMultipleProjects,
};
