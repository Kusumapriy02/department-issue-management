import React, { useState, useEffect } from 'react';
import { projectAPI } from '../../services/api';

const ViewMyProjects = ({ onBack }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState('');
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectAPI.getAssignedProjects();
      setProjects(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      submitted: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      evaluated: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      overdue: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getStatusLabel = (status) => {
    const labels = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      submitted: 'Submitted',
      evaluated: 'Evaluated',
      overdue: '⚠️ Overdue',
    };
    return labels[status] || status;
  };

  const getNextStatus = (currentStatus) => {
    const transitions = {
      'not_started': 'in_progress',
      'in_progress': 'submitted',
      'submitted': null, // Students cannot progress further
      'evaluated': null,
      'overdue': 'in_progress', // Allow overdue projects to progress to in_progress
    };
    return transitions[currentStatus];
  };

  const handleUpdateStatus = async (projectId, newStatus) => {
    setUpdatingStatus(true);
    setStatusUpdateError('');
    setStatusUpdateSuccess('');

    try {
      const response = await projectAPI.updateProjectStatus(projectId, { status: newStatus });

      // Update the selected project with the new status
      setSelectedProject(response.data.data);

      // Also update in the projects list
      setProjects(projects.map(p =>
        p._id === projectId ? response.data.data : p
      ));

      setStatusUpdateSuccess(`✅ Status updated to ${getStatusLabel(newStatus)}`);
      setTimeout(() => setStatusUpdateSuccess(''), 3000);
    } catch (err) {
      setStatusUpdateError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePostUpdate = async () => {
    if (!updateMessage.trim()) {
      setUpdateError('Please enter a message');
      return;
    }

    setPostingUpdate(true);
    setUpdateError('');

    try {
      const response = await projectAPI.addProjectUpdate(selectedProject._id, { message: updateMessage });
      setSelectedProject(response.data.data);
      setProjects(projects.map(p => p._id === selectedProject._id ? response.data.data : p));
      setUpdateMessage('');
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to post update');
    } finally {
      setPostingUpdate(false);
    }
  };

  const formatClassroom = (c) =>
    c ? `${c.department} - Year ${c.year} - Section ${c.section}` : '—';

  return (
    <div className="p-8 bg-white min-h-screen">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
      >
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">📂 My Projects</h1>
        <p className="text-gray-500">Manage your assigned projects</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-5xl mb-4">📂</div>
          <p className="text-gray-500 text-lg">No projects assigned to you yet</p>
          <p className="text-gray-500 text-sm mt-2">Faculty members will assign projects to your team</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(project => (
            <div
              key={project._id}
              className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600 border-r border-t border-b hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{project.projectTitle}</h3>
                  <p className="text-gray-600 text-sm">Subject: {project.subject}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
                <div>
                  <p className="text-gray-600">Team Members</p>
                  <p className="text-gray-900 font-medium">{project.teamMembers?.length || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Deadline</p>
                  <p className="text-gray-900 font-medium">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                <p className="text-gray-700">
                  <strong>Class:</strong> {formatClassroom(project.classroomId)}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProject(project);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedProject.projectTitle}</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-gray-700 mb-4">
              <strong>Subject:</strong> {selectedProject.subject}
            </p>

            {selectedProject.description && (
              <p className="text-gray-600 mb-4">
                <strong>Description:</strong> {selectedProject.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="text-gray-700 text-xs">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border mt-1 ${getStatusColor(selectedProject.status)}`}>
                  {getStatusLabel(selectedProject.status)}
                </span>
              </div>
              <div>
                <p className="text-gray-700 text-xs">Deadline</p>
                <p className="text-gray-900 font-medium">{new Date(selectedProject.deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-700 text-xs">Classroom</p>
                <p className="text-gray-900 font-medium text-sm">{formatClassroom(selectedProject.classroomId)}</p>
              </div>
              <div>
                <p className="text-gray-700 text-xs">Faculty</p>
                <p className="text-gray-900 font-medium text-sm">{selectedProject.facultyId?.name || '—'}</p>
              </div>
            </div>

            {selectedProject.teamMembers && selectedProject.teamMembers.length > 0 && (
              <div className="mb-4 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Team Members ({selectedProject.teamMembers.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.teamMembers.map((member, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-300 flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      {member.rollNumber || member}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4 border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">💬 Updates ({selectedProject.updates?.length || 0})</h4>
              
              {updateError && (
                <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                  {updateError}
                </div>
              )}

              <div className="mb-4 flex gap-2">
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  placeholder="Update your progress or ask faculty questions..."
                  className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                  rows="2"
                />
                <button
                  onClick={handlePostUpdate}
                  disabled={postingUpdate || !updateMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all self-start"
                >
                  {postingUpdate ? '⏳' : '📤'}
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {selectedProject.updates && selectedProject.updates.length > 0 ? (
                  selectedProject.updates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((update, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {update.role === 'faculty' ? '👨‍🏫' : '👤'} {update.role === 'faculty' ? 'Faculty' : 'Student'}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(update.createdAt).toLocaleDateString()} {new Date(update.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{update.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No updates yet. Start collaborating! 🚀</p>
                )}
              </div>
            </div>

            {statusUpdateError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg text-sm">
                {statusUpdateError}
              </div>
            )}

            {statusUpdateSuccess && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg text-sm">
                {statusUpdateSuccess}
              </div>
            )}

            <div className="flex gap-3">
              {getNextStatus(selectedProject.status) && (
                <button
                  onClick={() => handleUpdateStatus(selectedProject._id, getNextStatus(selectedProject.status))}
                  disabled={updatingStatus}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  {updatingStatus ? '⏳ Updating...' : `📝 Mark as ${getStatusLabel(getNextStatus(selectedProject.status))}`}
                </button>
              )}

              <button
                onClick={() => setSelectedProject(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewMyProjects;
