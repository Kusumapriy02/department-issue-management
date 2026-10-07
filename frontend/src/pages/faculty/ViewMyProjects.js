import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../../services/api';

const formatClassroom = (c) =>
  c ? `${c.department} - Year ${c.year} - Section ${c.section}` : '—';

const ViewMyProjects = ({ onBack }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState('');
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [filterStatus]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectAPI.getMyProjects();
      let filtered = response.data.data;
      
      if (filterStatus) {
        filtered = filtered.filter(p => p.status === filterStatus);
      }
      
      setProjects(filtered);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
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

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800 border-gray-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      submitted: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      evaluated: 'bg-green-100 text-green-800 border-green-300',
      overdue: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
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

  const filterButtons = [
    { label: 'All', value: '' },
    { label: 'Not Started', value: 'not_started' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Evaluated', value: 'evaluated' },
    { label: 'Overdue', value: 'overdue' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-700 mb-6 transition-colors font-medium"
      >
        <span className="text-2xl">←</span>
        <span className="font-semibold">Back to Dashboard</span>
      </button>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">📋 My Projects</h1>
        <div className="flex gap-2 flex-wrap">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filterStatus === btn.value
                  ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500 text-lg">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(project => (
            <div key={project._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-300">
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
                  <p className="text-gray-500">Team Members</p>
                  <p className="text-gray-900 font-medium">{project.teamMembers?.length || 0}/{project.maxTeamSize}</p>
                </div>
                <div>
                  <p className="text-gray-500">Deadline</p>
                  <p className="text-gray-900 font-medium">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                <p className="text-gray-600">
                  <strong>Class:</strong> {formatClassroom(project.classroomId)}
                </p>
              </div>

              <button
                onClick={() => setSelectedProject(project)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all transform hover:scale-105"
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
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              <strong>Subject:</strong> {selectedProject.subject}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="text-gray-700 text-xs">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border mt-1 ${getStatusColor(selectedProject.status)}`}>
                  {getStatusLabel(selectedProject.status)}
                </span>
              </div>
              <div>
                <p className="text-gray-700 text-xs">Max Team Size</p>
                <p className="text-gray-900 font-medium">{selectedProject.maxTeamSize}</p>
              </div>
              <div>
                <p className="text-gray-700 text-xs">Deadline</p>
                <p className="text-gray-900 font-medium">{new Date(selectedProject.deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-700 text-xs">Classroom</p>
                <p className="text-gray-900 font-medium text-sm">{formatClassroom(selectedProject.classroomId)}</p>
              </div>
            </div>

            {selectedProject.teamMembers && selectedProject.teamMembers.length > 0 && (
              <div className="mb-4 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Team Members ({selectedProject.teamMembers.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.teamMembers.map((member, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-200 flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      {member.rollNumber || member}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4 border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">💬 Updates ({selectedProject.updates?.length || 0})</h4>
              
              {updateError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {updateError}
                </div>
              )}

              <div className="mb-4 flex gap-2">
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  placeholder="Post an update for your team..."
                  className="flex-1 bg-white border border-gray-300 text-gray-900 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  rows="2"
                />
                <button
                  onClick={handlePostUpdate}
                  disabled={postingUpdate || !updateMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all self-start"
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
                  <p className="text-gray-400 text-sm text-center py-4">No updates yet. Be the first to post! 🚀</p>
                )}
              </div>
            </div>

            {statusUpdateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {statusUpdateError}
              </div>
            )}

            {statusUpdateSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {statusUpdateSuccess}
              </div>
            )}

            <div className="flex gap-3">
              {selectedProject.status === 'submitted' && (
                <button
                  onClick={() => handleUpdateStatus(selectedProject._id, 'evaluated')}
                  disabled={updatingStatus}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all"
                >
                  {updatingStatus ? '⏳ Updating...' : '✅ Mark as Evaluated'}
                </button>
              )}
              
              <button
                onClick={() => setSelectedProject(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
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
