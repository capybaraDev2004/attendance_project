import React from 'react';
import * as TablerIcons from '@tabler/icons-react';

/**
 * Component Sidebar cho Customer Dashboard
 * @param {Object} props - Các thuộc tính của component
 * @param {string} props.currentPath - Đường dẫn hiện tại để highlight menu active
 * @param {Function} props.onNavigate - Hàm xử lý khi click vào menu item
 * @param {Function} props.onLogout - Hàm xử lý khi logout
 */
export default function CustomerSidebar({ 
  currentPath = '/customer', 
  onNavigate, 
  onLogout,
  isCollapsed = false,
  onToggleCollapse 
}) {
  // Sử dụng prop isCollapsed thay vì state local
  const isCollapsedState = isCollapsed;

  // Danh sách menu items cho customer - chia thành 2 nhóm
  const mainMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: TablerIcons.IconLayoutDashboard,
      path: '/',
      description: 'Tổng quan cá nhân'
    },
    {
      id: 'face-scan',
      label: 'Quét khuôn mặt',
      icon: TablerIcons.IconFaceId,
      path: '/face-scan',
      description: 'Chấm công bằng khuôn mặt'
    },
    // Đã xóa menu Camera theo yêu cầu
  ];

  const secondaryMenuItems = [
    {
      id: 'history',
      label: 'Lịch sử chấm công',
      icon: TablerIcons.IconHistory,
      path: '/attendance',
      description: 'Xem lịch sử chấm công'
    },
    {
      id: 'users',
      label: 'Quản lý người dùng',
      icon: TablerIcons.IconUsers,
      path: '/users',
      description: 'Quản lý thông tin nhân viên'
    }
  ];

  // Xử lý khi click vào menu item
  const handleMenuClick = (item) => {
    if (onNavigate) {
      onNavigate(item.path);
    }
  };

  // Xử lý khi click logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Kiểm tra menu item có active không
  const isActive = (path) => {
    if (path === '/') {
      // Dashboard chỉ active khi path chính xác là /
      return currentPath === '/';
    }
    // Các menu khác active khi path bắt đầu bằng path của nó
    return currentPath.startsWith(path);
  };

  return (
    <div className={`customer-sidebar ${isCollapsedState ? 'collapsed' : ''}`}>
      {/* Header với logo và toggle button */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {!isCollapsedState && (
            <div className="logo-content">
              <span className="logo-text">CUSTOMER</span>
            </div>
          )}
          {isCollapsedState && (
            <div className="logo-collapsed">
              {/* Không hiển thị gì khi thu gọn */}
            </div>
          )}
        </div>
        
        <button 
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          title={isCollapsedState ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          <TablerIcons.IconMenu2 size={20} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div className="sidebar-items">
          {/* Main Menu Group */}
          <div className="sidebar-item-group">
            {mainMenuItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item)}
                  title={isCollapsedState ? item.label : ''}
                >
                  <IconComponent className="sidebar-item-icon" size={20} />
                  {!isCollapsedState && (
                    <span className="sidebar-item-label">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content Separator */}
          <div className="sidebar-separator">
            <span className="separator-text"></span>
          </div>

          {/* Secondary Menu Group */}
          <div className="sidebar-item-group">
            {secondaryMenuItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item)}
                  title={isCollapsedState ? item.label : ''}
                >
                  <IconComponent className="sidebar-item-icon" size={20} />
                  {!isCollapsedState && (
                    <span className="sidebar-item-label">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer với logout */}
      <div className="sidebar-footer">
        <button
          className="logout-button"
          onClick={handleLogout}
          title={isCollapsedState ? 'Đăng xuất' : ''}
        >
          <TablerIcons.IconLogout className="logout-icon" size={20} />
          {!isCollapsedState && <span className="logout-text">Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
}
