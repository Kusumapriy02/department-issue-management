import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log("API BASE URL:", API_BASE_URL);

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Remove Content-Type header for FormData requests
 * Let axios automatically set the correct multipart/form-data header with boundary
 */
apiClient.interceptors.request.use(
  (config) => {
    // If sending FormData, remove the default Content-Type header
    // so axios can set it to multipart/form-data with correct boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      console.log('[API] FormData detected - removed Content-Type header for proper multipart handling');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor to add JWT token to all requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // DEBUG: Log token being sent
      console.log('[API] Request to:', config.url, '- Token attached:', !!token);
    } else {
      console.log('[API] Request to:', config.url, '- No token available');
    }
    
    // Log FormData uploads for debugging
    if (config.data instanceof FormData) {
      console.log('[API] FormData upload to:', config.url, '- Content-Type will be multipart/form-data');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor to handle response errors
 * IMPORTANT: Be selective about when to logout
 * Only logout on actual auth failures, not on transient errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '';

    // DEBUG: Log auth-related errors
    if (status === 401 || status === 403) {
      console.warn('[AUTH DEBUG] API Error:', {
        status,
        message,
        path: error.config?.url,
        timestamp: new Date().toISOString(),
      });
    }

    // Only redirect to login if:
    // 1. User is NOT already on login page
    // 2. Token exists in localStorage (meaning we were authenticated)
    // 3. Error clearly indicates auth failure (not a transient error)
    if (status === 401 && window.location.pathname !== '/login') {
      const token = localStorage.getItem('token');
      
      // Only logout if we had a token and now it's invalid
      if (token) {
        console.warn('[AUTH] Token invalidated, logging out');
        localStorage.removeItem('token');
        
        // Redirect only if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ==================== Auth APIs ====================

export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data) =>
    apiClient.post('/auth/register', data),
  getMe: () =>
    apiClient.get('/auth/me'),
  changePassword: (currentPassword, newPassword, confirmPassword) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword, confirmPassword }),
  resetPassword: (userId) =>
    apiClient.post('/auth/reset-password', { userId }),
};

// ==================== User Management APIs ====================

export const userAPI = {
  getAllUsers: (params) =>
    apiClient.get('/auth/users', { params }),
  updateUser: (id, data) =>
    apiClient.put(`/auth/users/${id}`, data),
};

// ==================== Classroom APIs ====================

export const classroomAPI = {
  createClassroom: (data) =>
    apiClient.post('/classrooms', data),
  getAllClassrooms: (params) =>
    apiClient.get('/classrooms', { params }),
  getMyClassrooms: () =>
    apiClient.get('/classrooms/my'),
  getClassroomById: (id) =>
    apiClient.get(`/classrooms/${id}`),
  getClassroomStudents: (id) =>
    apiClient.get(`/classrooms/${id}/students`),
  updateClassroom: (id, data) =>
    apiClient.put(`/classrooms/${id}`, data),
  deleteClassroom: (id) =>
    apiClient.delete(`/classrooms/${id}`),
};

// ==================== Utility APIs ====================

export const utilityAPI = {
  createUtility: (data) =>
    apiClient.post('/utilities', data),
  getAllUtilities: (params) =>
    apiClient.get('/utilities', { params }),
  getUtilityById: (id) =>
    apiClient.get(`/utilities/${id}`),
  updateUtility: (id, data) =>
    apiClient.put(`/utilities/${id}`, data),
  deleteUtility: (id) =>
    apiClient.delete(`/utilities/${id}`),
};

// ==================== Facility Asset APIs ====================

export const assetAPI = {
  createAsset: (data) =>
    apiClient.post('/assets', data),
  getAllAssets: (params) =>
    apiClient.get('/assets', { params }),
  getAssetById: (id) =>
    apiClient.get(`/assets/${id}`),
  updateAsset: (id, data) =>
    apiClient.put(`/assets/${id}`, data),
  deleteAsset: (id) =>
    apiClient.delete(`/assets/${id}`),
};

// ==================== Lab APIs ====================

export const labAPI = {
  createLab: (data) =>
    apiClient.post('/labs', data),
  getAllLabs: (params) =>
    apiClient.get('/labs', { params }),
  getLabById: (id) =>
    apiClient.get(`/labs/${id}`),
  updateLab: (id, data) =>
    apiClient.put(`/labs/${id}`, data),
  deleteLab: (id) =>
    apiClient.delete(`/labs/${id}`),
};

// ==================== Issue APIs ====================

export const issueAPI = {
  createIssue: (data) =>
    apiClient.post('/issues', data),
  getAllIssues: (params) =>
    apiClient.get('/issues', { params }),
  getMyIssues: (params) =>
    apiClient.get('/issues/my', { params }),
  getIssueById: (id) =>
    apiClient.get(`/issues/${id}`),
  updateIssueStatus: (id, data) =>
    apiClient.put(`/issues/${id}/status`, data),
  uploadResolutionProof: (id, data) =>
    apiClient.post(`/issues/${id}/resolution-proof`, data),
  addComment: (id, data) =>
    apiClient.post(`/issues/${id}/comments`, data),
};

// ==================== Project APIs ====================

export const projectAPI = {
  createProject: (data) =>
    apiClient.post('/projects', data),
  getMyProjects: () =>
    apiClient.get('/projects/my'),
  getAssignedProjects: () =>
    apiClient.get('/projects/assigned'),
  getProjectsByClassroom: (classroomId) =>
    apiClient.get(`/projects/class/${classroomId}`),
  getProjectById: (id) =>
    apiClient.get(`/projects/${id}`),
  updateProject: (id, data) =>
    apiClient.put(`/projects/${id}`, data),
  updateProjectStatus: (id, data) =>
    apiClient.put(`/projects/${id}/status`, data),
  addTeamMember: (id, data) =>
    apiClient.post(`/projects/${id}/team-members`, data),
  addProjectUpdate: (id, data) =>
    apiClient.post(`/projects/${id}/update`, data),
  deleteProject: (id) =>
    apiClient.delete(`/projects/${id}`),
};

// ==================== Timetable APIs ====================

export const timetableAPI = {
  uploadTimetable: (formData) =>
    apiClient.post('/timetable/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAllTimetables: () =>
    apiClient.get('/timetable'),
  getTimetableByClassroom: (classroomId) =>
    apiClient.get(`/timetable/${classroomId}`),
  deleteTimetable: (id) =>
    apiClient.delete(`/timetable/${id}`),
};

// ==================== Stats APIs ====================

export const statsAPI = {
  getAdminStats: () =>
    apiClient.get('/stats/admin'),
  getFacultyStats: () =>
    apiClient.get('/stats/faculty'),
  getStudentStats: () =>
    apiClient.get('/stats/student'),
};

// ==================== Notification APIs ====================

export const notificationAPI = {
  getNotifications: () =>
    apiClient.get('/notifications'),
  markAsRead: (id) =>
    apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () =>
    apiClient.put('/notifications/read-all'),
  deleteNotification: (id) =>
    apiClient.delete(`/notifications/${id}`),
};

export default apiClient;
