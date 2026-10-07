import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';


// Sub-pages (routed from dashboards but need dedicated URLs)
import Classrooms from './pages/admin/Classrooms';
import ManageIssues from './pages/admin/ManageIssues';
import UserManagement from './pages/admin/UserManagement';
import ReportIssue from './pages/student/ReportIssue';
import ViewMyIssues from './pages/student/ViewMyIssues';
import CreateProject from './pages/faculty/CreateProject';
import ViewClassroomIssues from './pages/faculty/ViewClassroomIssues';

/**
 * ProtectedRoute — uses AuthContext (single source of truth)
 */
const ProtectedRoute = ({ element, allowedRoles = [] }) => {
  const { user, token } = useAuth();

  console.log('[ROUTE] Protected route check:', {
    path: window.location.pathname,
    hasToken: !!token,
    user_role: user?.role,
    allowedRoles,
    hasUser: !!user,
  });

  if (!token) {
    console.warn('[ROUTE] No token - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    console.warn('[ROUTE] Role check failed:', {
      user_role: user?.role,
      allowedRoles,
      user_exists: !!user,
    });
    return <Navigate to="/" replace />;
  }

  return element;
};

/**
 * RoleRedirect — sends user to the right dashboard based on role
 */
const RoleRedirect = () => {
  const { user, token } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  switch (user?.role) {
    case 'admin':
    case 'hod':
      return <Navigate to="/admin/dashboard" replace />;
    case 'faculty':
      return <Navigate to="/faculty/dashboard" replace />;
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ProtectedRoute element={<ChangePassword isFirstLogin={true} />} />} />

      {/* Role-based root redirect */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Admin (and HOD in read-only mode) */}
      <Route path="/admin/dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin', 'hod']} />} />
      <Route path="/admin/classrooms" element={<ProtectedRoute element={<Classrooms />} allowedRoles={['admin']} />} />
      <Route path="/admin/issues" element={<ProtectedRoute element={<ManageIssues />} allowedRoles={['admin', 'hod']} />} />
      <Route path="/admin/users" element={<ProtectedRoute element={<UserManagement />} allowedRoles={['admin']} />} />

      {/* Faculty */}
      <Route path="/faculty/dashboard" element={<ProtectedRoute element={<FacultyDashboard />} allowedRoles={['faculty', 'admin']} />} />
      <Route path="/faculty/create-project" element={<ProtectedRoute element={<CreateProject />} allowedRoles={['faculty', 'admin']} />} />
      <Route path="/faculty/issues" element={<ProtectedRoute element={<ViewClassroomIssues />} allowedRoles={['faculty', 'admin']} />} />

      {/* Student */}
      <Route path="/student/dashboard" element={<ProtectedRoute element={<StudentDashboard />} allowedRoles={['student', 'admin']} />} />
      <Route path="/student/report-issue" element={<ProtectedRoute element={<ReportIssue />} allowedRoles={['student', 'admin']} />} />
      <Route path="/student/my-issues" element={<ProtectedRoute element={<ViewMyIssues />} allowedRoles={['student', 'admin']} />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
