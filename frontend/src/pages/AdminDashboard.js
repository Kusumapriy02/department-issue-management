import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { StatCard, Card } from '../components/CardComponents';
import Classrooms from './admin/Classrooms';
import FacilityAssets from './admin/FacilityAssets';
import ManageIssues from './admin/ManageIssues';
import Labs from './admin/Labs';
import UploadTimetable from './admin/UploadTimetable';
import UserManagement from './admin/UserManagement';
import { statsAPI } from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);

  // Read-only mode for HOD
  const isReadOnly = user?.role === 'hod';

  useEffect(() => {
    if (activeTab === 'overview') {
      statsAPI.getAdminStats()
        .then(res => setStats(res.data.data))
        .catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [location.search]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'classrooms', label: 'Classrooms', icon: '🏫' },
    { id: 'assets', label: 'Facility Assets', icon: '📦' },
    { id: 'labs', label: 'Labs', icon: '🖥️' },
    { id: 'issues', label: 'Manage Issues', icon: '⚠️' },
    { id: 'timetable', label: 'Timetable', icon: '📅' },
    ...(isReadOnly ? [] : [{ id: 'users', label: 'Users', icon: '👥' }]),
  ];

  const dashboardTitle = isReadOnly ? 'HOD' : 'Admin';
  const dashboardIcon = isReadOnly ? '👨‍🏫' : '👨‍💼';

  const renderContent = () => {
    if (activeTab === 'overview') {
      return (
        <div>
          {/* Page Title and Description */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Dashboard</h1>
            <p className="text-gray-500 text-base">
              {isReadOnly ? 'View and manage department issues' : 'Manage your institution\'s resources and operations'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: 'issues', icon: '⚠️', label: 'Issues', desc: 'Manage and resolve issues' },
                { id: 'classrooms', icon: '🏫', label: 'Classrooms', desc: isReadOnly ? 'View classrooms' : 'Manage sections' },
                { id: 'labs', icon: '🖥️', label: 'Labs', desc: isReadOnly ? 'View labs' : 'Manage labs' },
                { id: 'assets', icon: '📦', label: 'Facility Assets', desc: isReadOnly ? 'View assets' : 'Manage assets' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all text-left"
                >
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-gray-900 text-sm">{item.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon="🏫" label="Classrooms" value={stats?.totalClassrooms ?? 0} />
              <StatCard icon="⚠️" label="Open Issues" value={stats?.openIssues ?? 0} />
              <StatCard icon="⏳" label="In Progress" value={stats?.inProgressIssues ?? 0} />
              <StatCard icon="✓" label="Resolved" value={stats?.resolvedIssues ?? 0} />
            </div>
          </div>

          {/* Additional Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card title="Users">
              <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers ?? 0}</p>
              <p className="text-sm text-gray-500 mt-2">Total users in system</p>
            </Card>
            <Card title="Labs">
              <p className="text-3xl font-bold text-gray-900">{stats?.totalLabs ?? 0}</p>
              <p className="text-sm text-gray-500 mt-2">Computer laboratories</p>
            </Card>
            <Card title="Facility Assets">
              <p className="text-3xl font-bold text-gray-900">{stats?.totalAssets ?? stats?.totalUtilities ?? 0}</p>
              <p className="text-sm text-gray-500 mt-2">Assets tracked</p>
            </Card>
          </div>

          {/* Recent Issues */}
          {stats?.recentIssues?.length > 0 && (
            <div className="mb-8">
              <Card title="Recent Issues">
              <div className="space-y-3">
                {stats.recentIssues.slice(0, 5).map(issue => (
                  <div
                    key={issue._id}
                    className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{issue.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{issue.createdBy?.name || 'Unknown'}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                        {issue.status}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-200 text-gray-700">
                        {issue.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            </div>
          )}
        </div>
      );
    }

    // Sub-pages
    if (activeTab === 'classrooms') return <Classrooms onBack={() => setActiveTab('overview')} isReadOnly={isReadOnly} />;
    if (activeTab === 'assets') return <FacilityAssets onBack={() => setActiveTab('overview')} isReadOnly={isReadOnly} />;
    if (activeTab === 'labs') return <Labs onBack={() => setActiveTab('overview')} isReadOnly={isReadOnly} />;
    if (activeTab === 'issues') return <ManageIssues onBack={() => setActiveTab('overview')} isReadOnly={isReadOnly} />;
    if (activeTab === 'timetable') return <UploadTimetable onBack={() => setActiveTab('overview')} isReadOnly={isReadOnly} />;
    if (activeTab === 'users') return <UserManagement onBack={() => setActiveTab('overview')} />;
  };

  return (
    <DashboardLayout
      title={dashboardTitle}
      icon={dashboardIcon}
      isReadOnly={isReadOnly}
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
