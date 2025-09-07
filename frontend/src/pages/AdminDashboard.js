// attendance_project/frontend/src/pages/AdminDashboard.js
import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import './AdminDashboard.css';

// Trang quản lý dành cho admin với giao diện hiện đại và URL routing
const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hàm đăng xuất - xóa auth và chuyển về trang login
  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/login', { replace: true });
  };

  // Hàm chuyển đổi tab - sử dụng navigate thay vì state
  const handleTabChange = (path) => {
    navigate(path);
  };

  // Menu items cho sidebar - cấu trúc rõ ràng với path
  const menuItems = [
    { id: 'users', label: 'Quản lý người dùng', icon: 'users', path: '/admin/users' },
    { id: 'face-setup', label: 'Cài đặt nhận diện', icon: 'face', path: '/admin/face-setup' },
    { id: 'history', label: 'Lịch sử ra vào', icon: 'history', path: '/admin/history' },
    { id: 'calculate', label: 'Tính công', icon: 'calculate', path: '/admin/calculate' },
    { id: 'devices', label: 'Quản lý thiết bị', icon: 'devices', path: '/admin/devices' },
    { id: 'work-hours', label: 'Giờ làm việc', icon: 'time', path: '/admin/work-hours' },
    { id: 'positions', label: 'Chức vụ', icon: 'position', path: '/admin/positions' },
    { id: 'shift-management', label: 'Quản lý ca làm việc', icon: 'schedule', path: '/admin/shift-management' },
  ];

  // Kiểm tra tab hiện tại dựa trên URL
  const isActiveTab = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-container">
      {/* Sidebar - Menu điều hướng chính */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="admin-badge">ADMIN</div>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {/* Menu chính */}
            {menuItems.map((item) => (
              <li key={item.id} className="menu-item">
                <button
                  type="button"
                  className={`menu-link ${isActiveTab(item.path) ? 'active' : ''}`}
                  onClick={() => handleTabChange(item.path)}
                >
                  <span className={`menu-icon icon-${item.icon}`}></span>
                  {item.label}
                </button>
              </li>
            ))}
            
            {/* Menu đăng xuất */}
            <li className="menu-item">
              <button
                type="button"
                className="menu-link logout"
                onClick={handleLogout}
              >
                <span className="menu-icon icon-logout"></span>
                Đăng xuất
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content - Nội dung chính của từng tab */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;