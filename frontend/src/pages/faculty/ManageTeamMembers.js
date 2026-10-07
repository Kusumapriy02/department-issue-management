import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../../services/api';

const ManageTeamMembers = ({ onBack }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [rollNumber, setRollNumber] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectAPI.getMyProjects();
      setProjects(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!selectedProject || !rollNumber.trim()) {
      setError('Please select a project and enter a roll number');
      return;
    }

    try {
      await projectAPI.addTeamMember(selectedProject._id, { rollNumber: rollNumber.trim() });
      setError('');
      setSuccess(`Added ${rollNumber.trim()} successfully`);
      setRollNumber('');
      fetchProjects();
      // Refresh selected project
      const response = await projectAPI.getProjectById(selectedProject._id);
      setSelectedProject(response.data.data);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add team member');
    }
  };

  const formatClassroom = (c) =>
    c ? `${c.department} - Year ${c.year} - Section ${c.section}` : '—';

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-700 mb-6 transition-colors font-medium"
        >
          <span className="text-2xl">←</span>
          <span className="font-semibold">Back to Dashboard</span>
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">👥 Manage Team Members</h1>
          <p className="text-gray-600">Add students to your project teams</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            ✅ {success}
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
            <p className="text-gray-400 text-sm mt-2">Create a project first to add team members</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {projects.map(project => (
              <div key={project._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{project.projectTitle}</h3>
                    <p className="text-gray-600 text-sm">Subject: {project.subject}</p>
                    <p className="text-gray-500 text-xs mt-1">{formatClassroom(project.classroomId)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-xs font-semibold">Team Members</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {project.teamMembers?.length || 0}/{project.maxTeamSize}
                    </p>
                  </div>
                </div>

                {project.teamMembers && project.teamMembers.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Current Members:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.teamMembers.map((member, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-300">
                          {member.rollNumber || member}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedProject(project);
                    setRollNumber('');
                    setError('');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all transform hover:scale-105"
                >
                  + Add Team Member
                </button>
              </div>
            ))}
          </div>
        )}}

        {selectedProject && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Add Team Member
              </h2>
              <p className="text-gray-600 text-sm mb-4">{selectedProject.projectTitle}</p>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <strong>Max team size:</strong> {selectedProject.maxTeamSize}<br/>
                  <strong>Current members:</strong> {selectedProject.teamMembers?.length || 0}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g., CS2021001"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTeamMember()}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddTeamMember}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all"
                >
                  Add Member
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTeamMembers;
