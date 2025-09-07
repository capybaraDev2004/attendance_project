import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './CustomerDashboard.css';
import { 
  FaHome, 
  FaUsers, 
  FaCamera, 
  FaHistory, 
  FaClock, 
  FaSignOutAlt 
} from 'react-icons/fa';
// Layout tổng cho customer: sidebar + topbar + content
const CustomerDashboard = () => {
  const navigate = useNavigate();
  const raw = localStorage.getItem('auth');
  const auth = raw ? JSON.parse(raw) : null;

  const handleLogout = () => {
    // Đăng xuất an toàn: xoá auth và điều hướng
    localStorage.removeItem('auth');
    navigate('/login', { replace: true });
  };

  return (
    <div className="customer-layout">
      <aside className="customer-sidebar">
        <div className="customer-brand">Customer Portal</div>
        <nav className="customer-nav">
          <NavLink end to="" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <FaHome className="nav-icon" />
            <span>Trang chủ</span>
          </NavLink>
          <NavLink to="users" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <FaUsers className="nav-icon" />
            <span>Quản lý người dùng</span>
          </NavLink>
          <NavLink to="face-scan" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <FaCamera className="nav-icon" />
            <span>Quét Khuôn Mặt</span>
          </NavLink>
          <NavLink to="attendance" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <FaHistory className="nav-icon" />
            <span>Lịch sử ra vào</span>
          </NavLink>
          <NavLink to="timekeeping" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <FaClock className="nav-icon" />
            <span>Quản lý chấm công</span>
          </NavLink>
          <NavLink to="logout" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <FaSignOutAlt className="nav-icon" />
            <span>Đăng xuất</span>
          </NavLink>
        </nav>
      </aside>

      <section className="customer-content">
        <div className="customer-topbar">
          <div>Trang dành cho khách hàng</div>
          <div className="topbar-user">
            {auth?.user?.fullName ? (
              <span>
                Xin chào, <b>{auth.user.fullName}</b>
              </span>
            ) : (
              <span>Đang đăng nhập</span>
            )}
            <button style={{ marginLeft: 12 }} className="qa-btn" onClick={handleLogout}>Đăng xuất</button>
          </div>
        </div>

        <main className="customer-main">
          {/* Outlet render trang con */}
          <Outlet />
        </main>
      </section>
    </div>
  );
};

export default CustomerDashboard;


