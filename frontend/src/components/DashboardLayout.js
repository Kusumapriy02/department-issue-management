import React from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

/**
 * DashboardLayout - Unified layout for all dashboards
 * Provides consistent sidebar, header, and content structure
 * 
 * Props:
 * - title: Dashboard title (Admin, Faculty, Student)
 * - icon: Title icon
 * - isReadOnly: Whether in read-only mode (HOD)
 * - menuItems: Array of { id, label, icon }
 * - activeTab: Current active tab
 * - onTabChange: Callback when tab changes
 * - onLogout: Callback for logout
 * - children: Main content
 */
const DashboardLayout = ({
  title,
  icon,
  isReadOnly = false,
  menuItems = [],
  activeTab = 'overview',
  onTabChange,
  onLogout,
  children,
}) => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ======================== SIDEBAR ======================== */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
              {icon}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer - Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 text-gray-700 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            ↵ Logout
          </button>
        </div>
      </aside>

      {/* ======================== MAIN CONTENT ======================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-3 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">College Management System</p>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user?.name || 'User'}
              </span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
