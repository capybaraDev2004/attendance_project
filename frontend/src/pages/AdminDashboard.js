// attendance_project/frontend/src/pages/AdminDashboard.js
import React, { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

// Lazy load các trang/khối chức năng - chỉ tải khi cần thiết
const UserManagement = lazy(() => import('./UserManagement')); // Sửa đường dẫn import
const FaceSetup = lazy(() => import('./admin/FaceSetup'));
const AttendanceHistory = lazy(() => import('./admin/AttendanceHistory'));
const PayrollCalculation = lazy(() => import('./admin/PayrollCalculation'));
const DeviceManagement = lazy(() => import('./admin/DeviceManagement'));
const WorkHours = lazy(() => import('./admin/WorkHours'));
const Positions = lazy(() => import('./admin/Positions'));
const UnderConstruction = lazy(() => import('./admin/UnderConstruction'));

// Trang quản lý dành cho admin với giao diện hiện đại
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manage-users');

  // Lấy thông tin auth từ localStorage (có thể sử dụng sau này)
  // const raw = localStorage.getItem('auth');
  // const auth = raw ? JSON.parse(raw) : null;

  // Menu items cho sidebar - cấu trúc rõ ràng
  const menuItems = [
    { id: 'manage-users', label: 'Quản lý người dùng', icon: 'users', active: true },
    { id: 'face-setup', label: 'Cài đặt nhận diện', icon: 'face', active: false },
    { id: 'history', label: 'Lịch sử ra vào', icon: 'history', active: false },
    { id: 'calculate', label: 'Tính công', icon: 'calculate', active: false },
    { id: 'devices', label: 'Quản lý thiết bị', icon: 'devices', active: false },
    { id: 'work-hours', label: 'Giờ làm việc', icon: 'time', active: false },
    { id: 'positions', label: 'Chức vụ', icon: 'position', active: false },
  ];

  // Hàm đăng xuất - xóa auth và chuyển về trang login
  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/login', { replace: true });
  };

  // Hàm chuyển đổi tab - cập nhật state activeTab
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Render nội dung theo tab, chỉ tải component khi cần (lazy loading)
  const renderTabContent = () => {
    switch (activeTab) {
      case 'manage-users':
        return <UserManagement />;
      case 'face-setup':
        return <FaceSetup />;
      case 'history':
        return <AttendanceHistory />;
      case 'calculate':
        return <PayrollCalculation />;
      case 'devices':
        return <DeviceManagement />;
      case 'work-hours':
        return <WorkHours />;
      case 'positions':
        return <Positions />;
      default:
        return <UnderConstruction title="TÍNH NĂNG ĐANG PHÁT TRIỂN" />;
    }
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
                  className={`menu-link ${item.id === activeTab ? 'active' : ''}`}
                  onClick={() => handleTabChange(item.id)}
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
        <Suspense fallback={<div className="loading">Đang tải thành phần...</div>}>
          {renderTabContent()}
        </Suspense>
      </div>
    </div>
  );
};

export default AdminDashboard;