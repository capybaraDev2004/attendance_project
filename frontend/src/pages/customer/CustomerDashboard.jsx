import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './CustomerDashboard.css';

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
            🏠 Trang chủ
          </NavLink>
          <NavLink to="users" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            👥 Quản lý người dùng
          </NavLink>
          <NavLink to="face-scan" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            🔍 Quét Khuôn Mặt
          </NavLink>
          <NavLink to="attendance" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            🕒 Lịch sử ra vào
          </NavLink>
          <NavLink to="timekeeping" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            📅 Tính công
          </NavLink>
          <NavLink to="logout" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            🚪 Đăng xuất
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


