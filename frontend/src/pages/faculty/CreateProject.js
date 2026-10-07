import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI, classroomAPI } from '../../services/api';

const CreateProject = ({ onBack }) => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    projectTitle: '',
    subject: '',
    classroomId: '',
    deadline: '',
    maxTeamSize: 3,
  });

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getMyClassrooms();
      setClassrooms(response.data.data);
    } catch (err) {
      setError('Failed to fetch classrooms. Ensure you are assigned to classrooms.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await projectAPI.createProject(formData);
      setSuccess('✅ Project created successfully!');
      setFormData({
        projectTitle: '',
        subject: '',
        classroomId: '',
        deadline: '',
        maxTeamSize: 3,
      });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
        >
          ← Back to Dashboard
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">➕ Create New Project</h1>
          <p className="text-gray-500">Design a project for your classroom</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl animate-pulse">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Project Title <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                name="projectTitle"
                value={formData.projectTitle}
                onChange={handleChange}
                placeholder="e.g., Hospital Management System"
                minLength="5"
                required
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Subject <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Database Management"
                minLength="3"
                required
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Assign to Classroom <span className="text-blue-600">*</span>
                </label>
                <select
                  name="classroomId"
                  value={formData.classroomId}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Select Classroom</option>
                  {classrooms.map(classroom => (
                    <option key={classroom._id} value={classroom._id}>
                      {classroom.department} - Year {classroom.year} - Section {classroom.section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Max Team Size <span className="text-blue-600">*</span>
                </label>
                <input
                  type="number"
                  name="maxTeamSize"
                  value={formData.maxTeamSize}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  required
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Deadline <span className="text-blue-600">*</span>
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Creating...' : '🚀 Create Project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
