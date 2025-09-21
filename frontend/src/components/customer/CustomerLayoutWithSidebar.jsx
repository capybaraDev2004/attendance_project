import React, { useState } from 'react';
import CustomerSidebar from './CustomerSidebar';
import './CustomerSidebar.css';

/**
 * Layout chính cho Customer Dashboard với Sidebar
 * @param {Object} props - Các thuộc tính của component
 * @param {React.ReactNode} props.children - Nội dung chính
 * @param {string} props.currentPath - Đường dẫn hiện tại
 * @param {Function} props.onNavigate - Hàm xử lý navigation
 * @param {Function} props.onLogout - Hàm xử lý logout
 */
export default function CustomerLayoutWithSidebar({ 
  children, 
  currentPath = '/customer',
  onNavigate,
  onLogout 
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Xử lý navigation
  const handleNavigate = (path) => {
    if (onNavigate) {
      onNavigate(path);
    }
    // Đóng mobile menu sau khi navigate
    setMobileMenuOpen(false);
  };

  // Xử lý logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Toggle sidebar collapse
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="customer-layout-container">
      {/* Sidebar */}
      <div className={`customer-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'open' : ''}`}>
        <CustomerSidebar
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </div>

      {/* Main Content Area */}
      <div className="customer-main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          
          <div className="mobile-header-title">
            <h1>Customer Dashboard</h1>
          </div>
        </div>

        {/* Content */}
        <div className="customer-content-wrapper">
          {children}
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
