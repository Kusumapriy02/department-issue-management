import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { StatCard, Card } from '../components/CardComponents';
import CreateProject from './faculty/CreateProject';
import ViewMyProjects from './faculty/ViewMyProjects';
import ManageTeamMembers from './faculty/ManageTeamMembers';
import ViewClassroomIssues from './faculty/ViewClassroomIssues';
import { statsAPI, classroomAPI } from '../services/api';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    if (activeTab === 'overview') {
      statsAPI.getFacultyStats()
        .then(res => setStats(res.data.data))
        .catch(() => {});
      classroomAPI.getMyClassrooms()
        .then(res => setClassrooms(res.data.data || []))
        .catch(() => setClassrooms([]));
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
    { id: 'create', label: 'Create Project', icon: '➕' },
    { id: 'projects', label: 'My Projects', icon: '📋' },
    { id: 'team', label: 'Team Members', icon: '👥' },
    { id: 'issues', label: 'Student Issues', icon: '⚠️' },
  ];

  const renderContent = () => {
    if (activeTab === 'overview') {
      return (
        <div>
          {/* Page Title and Description */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Dashboard</h1>
            <p className="text-gray-500 text-base">Manage projects, teams, and student issues in your classrooms</p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'create', icon: '➕', label: 'Create Project', desc: 'Assign new projects' },
                { id: 'projects', icon: '📋', label: 'My Projects', desc: 'View your projects' },
                { id: 'issues', icon: '⚠️', label: 'Student Issues', desc: 'View issues' },
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
              <StatCard icon="📋" label="My Projects" value={stats?.totalProjects ?? 0} />
              <StatCard icon="⚠️" label="Open Issues" value={stats?.openIssues ?? 0} />
              <StatCard icon="✓" label="Resolved" value={stats?.resolvedIssues ?? 0} />
              <StatCard icon="🏫" label="Classrooms" value={stats?.totalClassrooms ?? 0} />
            </div>
          </div>

          {/* My Classrooms */}
          {classrooms && classrooms.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Classrooms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classrooms.map(classroom => (
                  <div key={classroom._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                    <h4 className="font-semibold text-gray-900 text-base mb-3">{classroom.department}</h4>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>Year:</span>
                        <span className="font-medium text-gray-900">{classroom.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Section:</span>
                        <span className="font-medium text-gray-900">{classroom.section}</span>
                      </div>
                      {classroom.facultyId?.name && (
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span>Faculty:</span>
                          <span className="font-medium text-gray-900">{classroom.facultyId.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'create') return <CreateProject onBack={() => setActiveTab('overview')} />;
    if (activeTab === 'projects') return <ViewMyProjects onBack={() => setActiveTab('overview')} />;
    if (activeTab === 'issues') return <ViewClassroomIssues onBack={() => setActiveTab('overview')} />;
    if (activeTab === 'team') return <ManageTeamMembers onBack={() => setActiveTab('overview')} />;
  };

  return (
    <DashboardLayout
      title={user?.name || 'Faculty'}
      icon="👨‍🏫"
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default FacultyDashboard;
