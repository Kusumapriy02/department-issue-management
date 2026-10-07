import React from 'react';

/**
 * Card - Consistent card component for dashboard sections
 * 
 * Props:
 * - title: Card title
 * - icon: Optional icon before title
 * - children: Card content
 * - onClick: Optional click handler
 * - className: Additional classes
 */
export const Card = ({ title, icon, children, onClick, className = '' }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 ${
      onClick ? 'cursor-pointer' : ''
    } ${className}`}
  >
    {title && (
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
        {icon && <span className="text-xl">{icon}</span>}
        <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

/**
 * StatCard - Simple stat display card
 * All stats use consistent white background with blue accent
 * Status indicators (success/warning/error) shown in label badges
 * 
 * Props:
 * - icon: Status icon
 * - label: Stat label
 * - value: The number/value to display
 */
export const StatCard = ({ icon, label, value }) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <span className="text-4xl opacity-15">{icon}</span>
      </div>
    </div>
  );
};

export default Card;
