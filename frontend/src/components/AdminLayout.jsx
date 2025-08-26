import React from 'react';
import './AdminLayout.css';

const AdminLayout = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  headerActions 
}) => {
  return (
    <div className="admin-layout">
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <div className="header-title">
            {Icon && <Icon className="header-icon" />}
            <h1>{title}</h1>
          </div>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
        
        {headerActions && (
          <div className="header-actions">
            {headerActions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
