// attendance_project/frontend/src/pages/AdminDashboard.js
import React, { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

// Lazy load các trang/khối chức năng
const UserManagement = lazy(() => import('./UserManagement'));
const FaceSetup = lazy(() => import('./admin/FaceSetup'));
const AttendanceHistory = lazy(() => import('./admin/AttendanceHistory'));
const UnderConstruction = lazy(() => import('./admin/UnderConstruction'));

// Trang quản lý dành cho admin với giao diện hiện đại
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manage-users');

  // Lấy thông tin auth từ localStorage
  const raw = localStorage.getItem('auth');
  const auth = raw ? JSON.parse(raw) : null;

  // Menu items cho sidebar
  const menuItems = [
    { id: 'manage-users', label: '👥 Quản lý người dùng', active: true },
    { id: 'face-setup', label: '🧠 Cài đặt nhận diện', active: false },
    { id: 'history', label: '📊 Lịch sử ra vào', active: false },
    { id: 'calculate', label: '📋 Tính công', active: false },
    { id: 'devices', label: '⚙️ Quản lý thiết bị', active: false },
    { id: 'work-hours', label: '⏰ Giờ làm việc', active: false },
    { id: 'positions', label: '👔 Chức vụ', active: false },
    { id: 'employee-status', label: '📈 Trang thái nhân viên', active: false }
  ];

  // Hàm đăng xuất
  const logout = () => {
    localStorage.removeItem('auth');
    navigate('/login', { replace: true });
  };

  // Render nội dung theo tab, chỉ tải component khi cần (lazy)
  const renderTabContent = () => {
    switch (activeTab) {
      case 'manage-users':
        return <UserManagement />;
      case 'face-setup':
        return <FaceSetup />;
      case 'history':
        return <AttendanceHistory />;
      case 'calculate':
        return <UnderConstruction title="TÍNH NĂNG TÍNH CÔNG ĐANG PHÁT TRIỂN" />;
      case 'devices':
        return <UnderConstruction title="TÍNH NĂNG QUẢN LÝ THIẾT BỊ ĐANG PHÁT TRIỂN" />;
      case 'work-hours':
        return <UnderConstruction title="TÍNH NĂNG GIỜ LÀM VIỆC ĐANG PHÁT TRIỂN" />;
      case 'positions':
        return <UnderConstruction title="TÍNH NĂNG CHỨC VỤ ĐANG PHÁT TRIỂN" />;
      case 'employee-status':
        return <UnderConstruction title="TÍNH NĂNG TRẠNG THÁI NHÂN VIÊN ĐANG PHÁT TRIỂN" />;
      default:
        return <UnderConstruction title="TÍNH NĂNG ĐANG PHÁT TRIỂN" />;
    }
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="admin-badge">ADMIN</div>
        </div>
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li key={item.id} className="menu-item">
                <a
                  href="#"
                  className={`menu-link ${item.id === activeTab ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(item.id);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
            {/* Menu đăng xuất */}
            <li className="menu-item">
              <a
                href="#"
                className="menu-link logout"
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                }}
              >
                🚪 Đăng xuất
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <Suspense fallback={<div className="loading">Đang tải thành phần...</div>}>
          {renderTabContent()}
        </Suspense>
      </div>
    </div>
  );
};

export default AdminDashboard;