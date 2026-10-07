import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { StatCard, Card } from '../components/CardComponents';
import ReportIssue from './student/ReportIssue';
import ViewMyIssues from './student/ViewMyIssues';
import ViewMyProjects from './student/ViewMyProjects';
import { statsAPI, authAPI, timetableAPI, projectAPI } from '../services/api';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [assignedProjects, setAssignedProjects] = useState([]);

  useEffect(() => {
    if (activeTab === 'overview') {
      statsAPI.getStudentStats()
        .then(res => setStats(res.data.data))
        .catch(() => {});
      // Fetch full user profile with populated classroom
      authAPI.getMe()
        .then(res => {
          setProfile(res.data.data);
          // If classroom assigned, fetch timetable
          if (res.data.data?.classroomId?._id) {
            fetchTimetable(res.data.data.classroomId._id);
          }
        })
        .catch(() => {});
    } else if (activeTab === 'projects') {
      projectAPI.getAssignedProjects()
        .then(res => setAssignedProjects(res.data.data || []))
        .catch(() => setAssignedProjects([]));
    }
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [location.search]);

  const fetchTimetable = async (classroomId) => {
    setTimetableLoading(true);
    try {
      const response = await timetableAPI.getTimetableByClassroom(classroomId);
      setTimetable(response.data.data);
    } catch (err) {
      setTimetable(null);
    } finally {
      setTimetableLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatClassroom = (c) =>
    c ? `${c.department} - Year ${c.year} - Section ${c.section}` : null;

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'projects', label: 'My Projects', icon: '📂' },
    { id: 'report', label: 'Report Issue', icon: '🚨' },
    { id: 'issues', label: 'My Issues', icon: '📋' },
    { id: 'timetable', label: 'Timetable', icon: '📅' },
  ];

  const renderContent = () => {
    if (activeTab === 'overview') {
      const classroomName = profile?.classroomId
        ? `${profile.classroomId.department} (Year ${profile.classroomId.year}, Section ${profile.classroomId.section})`
        : '';

      return (
        <div>
          {/* Page Title and Description */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Dashboard</h1>
            <p className="text-gray-500 text-base">Report issues, track submissions, and view your schedule</p>
            {classroomName && <p className="text-sm text-gray-500 mt-2">{classroomName}</p>}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setActiveTab('report')}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">🚨</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Report Issue</h3>
                <p className="text-xs text-gray-500">Report classroom problems</p>
              </button>
              <button
                onClick={() => setActiveTab('issues')}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">📋</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">My Issues</h3>
                <p className="text-xs text-gray-500">Track reported issues</p>
              </button>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon="📋" label="Total Issues" value={stats?.totalIssues ?? 0} />
              <StatCard icon="⚠️" label="Open" value={stats?.openIssues ?? 0} />
              <StatCard icon="⏳" label="In Progress" value={stats?.inProgressIssues ?? 0} />
              <StatCard icon="✓" label="Resolved" value={stats?.resolvedIssues ?? 0} />
            </div>
          </div>

          {/* Timetable Preview */}
          {profile?.classroomId && timetable && (
            <div className="mb-8">
              <Card title="Class Timetable">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <img
                    src={`${API_BASE}${timetable.imageURL}`}
                    alt="Timetable"
                    className="w-full max-h-60 object-contain rounded-lg bg-gray-50 border border-gray-200"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <button
                    onClick={() => setActiveTab('timetable')}
                    className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
                  >
                    View Full Timetable →
                  </button>
                </div>
              </div>
            </Card>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'projects') return <ViewMyProjects onBack={() => setActiveTab('overview')} />;
    if (activeTab === 'report') return <ReportIssue onBack={() => setActiveTab('overview')} />;
    if (activeTab === 'issues') return <ViewMyIssues onBack={() => setActiveTab('overview')} />;
    
    if (activeTab === 'timetable') {
      const classroomName = profile?.classroomId
        ? `${profile.classroomId.department} - Year ${profile.classroomId.year}, Section ${profile.classroomId.section}`
        : '';

      return (
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Timetable</h1>
            {classroomName && <p className="text-gray-500 text-sm">{classroomName}</p>}
          </div>

          <Card>
            {!profile?.classroomId ? (
              <p className="text-gray-600 text-center py-8">You are not assigned to a classroom</p>
            ) : timetableLoading ? (
              <p className="text-gray-600 text-center py-8">Loading timetable...</p>
            ) : timetable ? (
              <div>
                <img
                  src={`${API_BASE}${timetable.imageURL}`}
                  alt="Timetable"
                  className="w-full rounded-lg border border-gray-200"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.style.removeProperty('display'); }}
                />
                <p className="text-gray-500 text-xs mt-4 text-center" style={{ display: 'none' }}>
                  Failed to load image
                </p>
                <p className="text-gray-500 text-xs mt-4 text-center">
                  Uploaded {new Date(timetable.uploadedAt || timetable.createdAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No timetable available for your classroom</p>
            )}
          </Card>
        </div>
      );
    }
  };

  return (
    <DashboardLayout
      title={user?.name || 'Student'}
      icon="🎓"
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default StudentDashboard;
