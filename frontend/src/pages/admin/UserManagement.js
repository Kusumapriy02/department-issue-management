import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI, classroomAPI } from '../../services/api';

const UserManagement = ({ onBack }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [filterRole, setFilterRole] = useState('admin'); // Default: Show only Admin users
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState(''); // Search for students
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [hodUser, setHodUser] = useState(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState(null); // For Students view
  const [classroomStudents, setClassroomStudents] = useState([]); // Students from selected classroom
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [classroomStudentCounts, setClassroomStudentCounts] = useState({}); // Cache for student counts
  // Create form state - role-based
  const [formData, setFormData] = useState({
    role: '', // Must select role first
    name: '',
    email: '',
    password: '',
    // Student fields
    courseType: 'BTech',
    specialization: '',
    registrationNumber: '',
    classroomId: '',
    // Faculty/Admin fields
    teacherId: '',
  });

  // Edit form state - role-based
  const [editFormData, setEditFormData] = useState({
    role: '', // Will be set when editing
    name: '',
    email: '',
    // Student fields
    courseType: 'BTech',
    specialization: '',
    registrationNumber: '',
    classroomId: '',
    // Faculty/Admin fields
    teacherId: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchClassrooms();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (searchQuery) params.search = searchQuery;
      const response = await userAPI.getAllUsers(params);
      setUsers(response.data.data);
      
      // Find and set the current HOD
      const currentHod = response.data.data.find(user => user.role === 'hod');
      setHodUser(currentHod || null);
      
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getAllClassrooms();
      setClassrooms(response.data.data);
    } catch (err) {
      // Classrooms are optional for the form
    }
  };

  const preloadClassroomStudentCounts = async () => {
    try {
      const counts = {};
      for (const classroom of classrooms) {
        try {
          const response = await classroomAPI.getClassroomStudents(classroom._id);
          const students = response.data.data || [];
          counts[classroom._id] = students.length;
        } catch (err) {
          counts[classroom._id] = 0;
        }
      }
      setClassroomStudentCounts(counts);
    } catch (err) {
      console.error('Failed to preload classroom student counts:', err);
    }
  };

  // Preload student counts when entering Students view
  useEffect(() => {
    if (filterRole === 'student' && classrooms.length > 0) {
      preloadClassroomStudentCounts();
    }
  }, [filterRole, classrooms]);

  const fetchClassroomStudents = async (classroomId) => {
    setLoadingStudents(true);
    try {
      const response = await classroomAPI.getClassroomStudents(classroomId);
      const students = response.data.data || [];
      setClassroomStudents(students);
      // Cache the student count for the classroom card
      setClassroomStudentCounts(prev => ({
        ...prev,
        [classroomId]: students.length
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch classroom students');
      setClassroomStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    // When classroom is selected, fetch its students
    if (selectedClassroomId) {
      fetchClassroomStudents(selectedClassroomId);
    }
  }, [selectedClassroomId]);

  useEffect(() => {
    fetchUsers();
  }, [filterRole, searchQuery]);

  // Handle role change - reset form completely
  const handleRoleChange = (newRole) => {
    setFormData({
      role: newRole,
      name: '',
      email: '',
      password: '',
      courseType: 'BTech',
      specialization: '',
      registrationNumber: '',
      classroomId: '',
      teacherId: '',
    });
  };

  // TASK 5: Handle role change in edit form - reset unrelated fields
  const handleEditRoleChange = (newRole) => {
    console.log('[ROLE CHANGE] Edit form: switching from', editFormData.role, 'to', newRole);
    const newFormData = {
      ...editFormData,
      role: newRole,
    };

    // Reset role-specific fields when role changes
    if (newRole === 'student') {
      // Keep student fields, remove faculty/admin fields
      newFormData.teacherId = '';
    } else if (newRole === 'faculty' || newRole === 'admin') {
      // Keep faculty/admin fields, remove student fields
      newFormData.registrationNumber = '';
      newFormData.classroomId = '';
      newFormData.courseType = 'BTech';
      newFormData.specialization = '';
    }

    setEditFormData(newFormData);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = { ...formData };
      
      // Only include role-relevant fields
      if (formData.role !== 'student') {
        delete payload.courseType;
        delete payload.specialization;
        delete payload.registrationNumber;
        delete payload.classroomId;
      }
      if (formData.role === 'student') {
        delete payload.teacherId;
      }
      if (formData.role !== 'faculty' && formData.role !== 'admin') {
        delete payload.teacherId;
      }

      await authAPI.register(payload);
      setSuccess('User created successfully');
      
      // Reset form completely
      setFormData({
        role: '',
        name: '',
        email: '',
        password: '',
        courseType: 'BTech',
        specialization: '',
        registrationNumber: '',
        classroomId: '',
        teacherId: '',
      });
      setShowForm(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await userAPI.updateUser(userId, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleResetPassword = async (userId, userName) => {
    const confirmReset = window.confirm(
      `Are you sure you want to reset ${userName}'s password to the default value? They will need to change it on their next login.`
    );

    if (!confirmReset) return;

    try {
      setError('');
      setSuccess('');
      const response = await authAPI.resetPassword(userId);
      setSuccess(`Password reset successfully for ${userName}. Default password: ${response.data.data.defaultPassword}`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleOpenEditForm = (user) => {
    setShowEditForm(false);
    setEditingUserId(null);
    
    setTimeout(() => {
      setEditingUserId(user._id);
      setEditFormData({
        role: user.role,
        name: user.name,
        email: user.email,
        courseType: user.courseType || 'BTech',
        specialization: user.specialization || '',
        registrationNumber: user.registrationNumber || '',
        classroomId: user.classroomId ? user.classroomId._id : '',
        teacherId: user.teacherId || '',
      });
      setShowEditForm(true);
    }, 0);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdateLoading(true);

    try {
      // TASK 5: Clean payload - only send non-empty fields
      const payload = {};
      
      // Always send these if they have values
      if (editFormData.name && editFormData.name.trim()) payload.name = editFormData.name;
      if (editFormData.email && editFormData.email.trim()) payload.email = editFormData.email;
      
      // Only send role-relevant fields
      if (editFormData.role === 'student') {
        payload.role = editFormData.role;
        if (editFormData.registrationNumber && editFormData.registrationNumber.trim()) {
          payload.registrationNumber = editFormData.registrationNumber;
        }
        if (editFormData.classroomId && editFormData.classroomId.trim()) {
          payload.classroomId = editFormData.classroomId;
        }
        if (editFormData.courseType) payload.courseType = editFormData.courseType;
        if (editFormData.specialization && editFormData.specialization.trim()) {
          payload.specialization = editFormData.specialization;
        }
      } else if (editFormData.role === 'faculty' || editFormData.role === 'admin') {
        payload.role = editFormData.role;
        if (editFormData.teacherId && editFormData.teacherId.trim()) {
          payload.teacherId = editFormData.teacherId;
        }
      }

      console.log('[UPDATE USER] Frontend Payload:', payload);

      // TASK 1: Wrap API call with try-catch and detailed error handling
      try {
        const response = await userAPI.updateUser(editingUserId, payload);
        console.log('[UPDATE USER] API SUCCESS:', response.data);
        
        setShowEditForm(false);
        setEditingUserId(null);
        setEditFormData({
          role: '',
          name: '',
          email: '',
          courseType: 'BTech',
          specialization: '',
          registrationNumber: '',
          classroomId: '',
          teacherId: '',
        });
        
        await fetchUsers();
        
        // TASK 7: Show success message
        setSuccess('✅ User updated successfully');
        setTimeout(() => setSuccess(''), 4000);
      } catch (apiError) {
        // TASK 1: Show detailed error to user
        const errorMessage = apiError.response?.data?.message || 
                            apiError.response?.data?.error ||
                            apiError.message || 
                            'Failed to update user';
        
        console.error('[UPDATE USER] API ERROR:', {
          status: apiError.response?.status,
          message: errorMessage,
          fullError: apiError.response?.data
        });
        
        setError(`❌ Error: ${errorMessage}`);
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      console.error('[UPDATE USER] UNEXPECTED ERROR:', err);
      setError('❌ Unexpected error occurred while updating user');
      setTimeout(() => setError(''), 5000);
    } finally {
      // TASK 6: Always reset loading state
      setUpdateLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      faculty: 'bg-blue-100 text-blue-700',
      student: 'bg-green-100 text-green-700',
      hod: 'bg-blue-100 text-blue-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors font-medium">
        <span className="text-2xl">←</span>
        <span>Back to Dashboard</span>
      </button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-500">Manage all system users</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
        >
          {showForm ? '✕ Cancel' : '+ Create User'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Create User Form - Role-Based Architecture */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-6">
            {/* STEP 1: Role Selection - Always First */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Role * (Select First)</label>
              <select
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Role --</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Only show fields if role is selected */}
            {formData.role && (
              <div className="space-y-6 pt-4 border-t border-gray-200">
                {/* Common Fields for All Roles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Full name"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="user@college.edu"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength="6"
                      placeholder="Min 6 characters"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* STUDENT-SPECIFIC FIELDS */}
                {formData.role === 'student' && (
                  <div className="space-y-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-sm font-semibold text-green-900">Student Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Registration Number *</label>
                        <input
                          type="text"
                          value={formData.registrationNumber}
                          onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                          required
                          placeholder="e.g., CS2021001"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Course Type *</label>
                        <select
                          value={formData.courseType}
                          onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="BTech">BTech</option>
                          <option value="MTech">MTech</option>
                        </select>
                      </div>
                      {formData.courseType === 'MTech' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Specialization *</label>
                          <select
                            value={formData.specialization}
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Specialization</option>
                            <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning</option>
                            <option value="Computer Science & Technology">Computer Science & Technology</option>
                            <option value="Computer Networks and Information Security">Computer Networks and Information Security</option>
                          </select>
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Classroom *</label>
                        <select
                          value={formData.classroomId}
                          onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Select Classroom --</option>
                          {classrooms.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.department} - Year {c.year} Section {c.section}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* FACULTY-SPECIFIC FIELDS */}
                {formData.role === 'faculty' && (
                  <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900">Faculty Information</h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Teacher ID *</label>
                      <input
                        type="text"
                        value={formData.teacherId}
                        onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                        required
                        placeholder="e.g., FACULTY001"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* ADMIN-SPECIFIC FIELDS */}
                {formData.role === 'admin' && (
                  <div className="space-y-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="text-sm font-semibold text-purple-900">Admin Information</h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Teacher ID / Admin ID *</label>
                      <input
                        type="text"
                        value={formData.teacherId}
                        onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                        required
                        placeholder="e.g., ADMIN001"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  Create User
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Show search only for Admin and Faculty views */}
          {filterRole !== 'student' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Search Users</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          )}
          <div className={filterRole !== 'student' ? '' : 'sm:col-span-2'}>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setSelectedClassroomId(null); // Reset classroom selection when role changes
                setSearchQuery(''); // Reset search
                setStudentSearchQuery(''); // Reset student search
              }}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classroom Selection View - Only for Students */}
      {filterRole === 'student' && !selectedClassroomId && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Classroom</h2>
          <p className="text-gray-600 mb-6">Choose a classroom to view its students</p>
          
          {/* Search Bar for Classrooms */}
          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search classrooms by department, year, or section..."
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          
          {classrooms.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No classrooms available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classrooms.filter(classroom => {
                const query = searchQuery.toLowerCase();
                return (
                  classroom.department.toLowerCase().includes(query) ||
                  (classroom.year && classroom.year.toString().includes(query)) ||
                  (classroom.section && classroom.section.toLowerCase().includes(query))
                );
              }).length === 0 ? (
                <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No classrooms match your search</p>
                </div>
              ) : (
                classrooms.filter(classroom => {
                  const query = searchQuery.toLowerCase();
                  return (
                    classroom.department.toLowerCase().includes(query) ||
                    (classroom.year && classroom.year.toString().includes(query)) ||
                    (classroom.section && classroom.section.toLowerCase().includes(query))
                  );
                }).map(classroom => (
                  <button
                    key={classroom._id}
                    onClick={() => setSelectedClassroomId(classroom._id)}
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-left"
                  >
                    <h3 className="font-bold text-gray-900 mb-2">{classroom.department}</h3>
                    <div className="text-sm text-gray-600">
                      <p>Year {classroom.year}</p>
                      <p>Section {classroom.section}</p>
                      <p className="mt-2 text-xs font-semibold text-blue-600">
                        {classroomStudentCounts[classroom._id] ?? 0} students
                      </p>
                    </div>
                  </button>
                )))}
            </div>
          )}
        </div>
      )}

      {/* Back Button - For Students View */}
      {filterRole === 'student' && selectedClassroomId && (
        <button
          onClick={() => {
            setSelectedClassroomId(null);
            setStudentSearchQuery(''); // Reset student search when going back
          }}
          className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          <span className="text-xl">←</span>
          <span>Back to Classrooms</span>
        </button>
      )}

      {/* User List or Students List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">
            {filterRole === 'student' ? 'Loading students...' : 'Loading users...'}
          </p>
        </div>
      ) : filterRole === 'student' && selectedClassroomId ? (
        // STUDENTS VIEW - Show students from selected classroom
        <div>
          {/* Search Bar for Students */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Search Students</label>
            <input
              type="text"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              placeholder="Search by name, email, or registration number..."
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {loadingStudents ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 mt-4 font-medium">Loading students...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {classroomStudents.filter(student => {
                const query = studentSearchQuery.toLowerCase();
                return (
                  student.name.toLowerCase().includes(query) ||
                  student.email.toLowerCase().includes(query) ||
                  (student.registrationNumber && student.registrationNumber.toLowerCase().includes(query))
                );
              }).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-500 text-lg">
                    {classroomStudents.length === 0 
                      ? 'No students found in this classroom' 
                      : 'No students match your search'}
                  </p>
                </div>
              ) : (
                classroomStudents.filter(student => {
                  const query = studentSearchQuery.toLowerCase();
                  return (
                    student.name.toLowerCase().includes(query) ||
                    student.email.toLowerCase().includes(query) ||
                    (student.registrationNumber && student.registrationNumber.toLowerCase().includes(query))
                  );
                }).map(student => (
                  <div key={student._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{student.name}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs font-semibold">Email</p>
                            <p className="text-gray-900 font-medium">{student.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-semibold">Reg. Number</p>
                            <p className="text-gray-900 font-medium">{student.registrationNumber || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-semibold">Course</p>
                            <p className="text-gray-900 font-medium">{student.courseType || '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-semibold">Status</p>
                            <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                              student.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {student.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleOpenEditForm(student)}
                          className="px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => handleResetPassword(student._id, student.name)}
                          className="px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          🔄 Reset Password
                        </button>
                        <button
                          onClick={() => handleToggleActive(student._id, student.isActive)}
                          className={`px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 ${
                            student.isActive
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {student.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>

                    {/* Inline Edit Form */}
                    {editingUserId === student._id && showEditForm && (
                      <div className="mt-6 pt-6 border-t border-gray-300 bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Student Details</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
                              <input
                                type="text"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                required
                                placeholder="Full name"
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                              <input
                                type="email"
                                value={editFormData.email}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                required
                                placeholder="user@college.edu"
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">Registration Number *</label>
                              <input
                                type="text"
                                value={editFormData.registrationNumber}
                                onChange={(e) => setEditFormData({ ...editFormData, registrationNumber: e.target.value })}
                                required
                                placeholder="e.g., CS2021001"
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">Course Type</label>
                              <select
                                value={editFormData.courseType}
                                onChange={(e) => setEditFormData({ ...editFormData, courseType: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="BTech">BTech</option>
                                <option value="MTech">MTech</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button
                              type="submit"
                              disabled={updateLoading}
                              className={`flex-1 font-semibold py-2 px-4 rounded-lg shadow-sm transition-all duration-300 ${
                                updateLoading 
                                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                              }`}
                            >
                              {updateLoading ? '⏳ Saving...' : 'Save Changes'}
                            </button>
                            <button
                              type="button"
                              disabled={updateLoading}
                              onClick={() => {
                                setEditingUserId(null);
                                setShowEditForm(false);
                              }}
                              className={`flex-1 font-semibold py-2 px-4 rounded-lg shadow-sm transition-all duration-300 ${
                                updateLoading
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900 hover:shadow-md'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        // ADMIN/FACULTY VIEW - Show users list
        <div className="grid grid-cols-1 gap-4">
          {users.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-lg">No {filterRole === 'admin' ? 'admin' : 'faculty'} users found</p>
            </div>
          ) : (
            users.map(user => (
              <div key={user._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{user.name}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs font-semibold">Email</p>
                        <p className="text-gray-900 font-medium">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-semibold">Role</p>
                        <span className={`inline-block px-3 py-1 rounded text-xs font-semibold mt-1 ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-semibold">Teacher ID</p>
                        <p className="text-gray-900 font-medium">{user.teacherId || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-semibold">Status</p>
                        <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {user.role === 'hod' ? (
                      <button
                        onClick={() => handleOpenEditForm(user)}
                        className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        ✎ Edit Basic Info
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenEditForm(user)}
                          className="px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => handleResetPassword(user._id, user.name)}
                          className="px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          🔄 Reset Password
                        </button>
                        <button
                          onClick={() => handleToggleActive(user._id, user.isActive)}
                          className={`px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 ${
                            user.isActive
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Edit Form - Role-Based */}
                {editingUserId === user._id && showEditForm && (
                  <div className="mt-6 pt-6 border-t border-gray-300 bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      {user.role === 'hod' ? 'Edit HOD Information' : 'Edit User Details'}
                    </h3>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                      {user.role === 'hod' ? (
                        // Limited form for HOD
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                              required
                              placeholder="Full name"
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                            <input
                              type="email"
                              value={editFormData.email}
                              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                              required
                              placeholder="user@college.edu"
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ) : (
                        // Full role-based edit form for non-HOD
                        <div className="space-y-4">
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs font-semibold text-yellow-900 mb-2">⚠️ Warning: Changing role will remove unrelated fields</p>
                            <select
                              value={editFormData.role}
                              onChange={(e) => {
                                if (e.target.value !== editFormData.role) {
                                  handleEditRoleChange(e.target.value);
                                }
                              }}
                              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                            >
                              <option value="student">Student</option>
                              <option value="faculty">Faculty</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
                              <input
                                type="text"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                required
                                placeholder="Full name"
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                              <input
                                type="email"
                                value={editFormData.email}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                required
                                placeholder="user@college.edu"
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          {/* STUDENT EDIT FIELDS */}
                          {editFormData.role === 'student' && (
                            <div className="space-y-4 p-3 bg-green-50 rounded border border-green-200">
                              <h4 className="text-xs font-semibold text-green-900">Student Information</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-900 mb-2">Registration Number *</label>
                                  <input
                                    type="text"
                                    value={editFormData.registrationNumber}
                                    onChange={(e) => setEditFormData({ ...editFormData, registrationNumber: e.target.value })}
                                    required
                                    placeholder="e.g., CS2021001"
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-900 mb-2">Course Type</label>
                                  <select
                                    value={editFormData.courseType}
                                    onChange={(e) => setEditFormData({ ...editFormData, courseType: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="BTech">BTech</option>
                                    <option value="MTech">MTech</option>
                                  </select>
                                </div>
                                {editFormData.courseType === 'MTech' && (
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Specialization *</label>
                                    <select
                                      value={editFormData.specialization}
                                      onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                                      required
                                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="">Select Specialization</option>
                                      <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning</option>
                                      <option value="Computer Science & Technology">Computer Science & Technology</option>
                                      <option value="Computer Networks and Information Security">Computer Networks and Information Security</option>
                                    </select>
                                  </div>
                                )}
                                <div className="sm:col-span-2">
                                  <label className="block text-sm font-semibold text-gray-900 mb-2">Classroom</label>
                                  <select
                                    value={editFormData.classroomId}
                                    onChange={(e) => setEditFormData({ ...editFormData, classroomId: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">No Classroom</option>
                                    {classrooms.map(c => (
                                      <option key={c._id} value={c._id}>
                                        {c.department} - Y{c.year} S{c.section}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* FACULTY/ADMIN EDIT FIELDS */}
                          {(editFormData.role === 'faculty' || editFormData.role === 'admin') && (
                            <div className="space-y-4 p-3 bg-blue-50 rounded border border-blue-200">
                              <h4 className="text-xs font-semibold text-blue-900">{editFormData.role === 'faculty' ? 'Faculty' : 'Admin'} Information</h4>
                              <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Teacher ID / Admin ID *</label>
                                <input
                                  type="text"
                                  value={editFormData.teacherId}
                                  onChange={(e) => setEditFormData({ ...editFormData, teacherId: e.target.value })}
                                  required
                                  placeholder={editFormData.role === 'faculty' ? 'e.g., FACULTY001' : 'e.g., ADMIN001'}
                                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={updateLoading}
                          className={`flex-1 font-semibold py-2 px-4 rounded-lg shadow-sm transition-all duration-300 ${
                            updateLoading 
                              ? 'bg-gray-400 text-white cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                          }`}
                        >
                          {updateLoading ? '⏳ Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          disabled={updateLoading}
                          onClick={() => {
                            setEditingUserId(null);
                            setShowEditForm(false);
                          }}
                          className={`flex-1 font-semibold py-2 px-4 rounded-lg shadow-sm transition-all duration-300 ${
                            updateLoading
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-900 hover:shadow-md'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
