// attendance_project/frontend/src/pages/HomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Trang chủ cho customer
const HomePage = () => {
  const navigate = useNavigate();
  const raw = localStorage.getItem('auth');
  const auth = raw ? JSON.parse(raw) : null;

  const logout = () => {
    localStorage.removeItem('auth');
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Trang chủ</h2>
      <div style={{ margin: '12px 0' }}>
        {auth?.user?.fullName ? (
          <div>Xin chào, <b>{auth.user.fullName}</b> ({auth.role})</div>
        ) : null}
      </div>
      <button onClick={logout}>Đăng xuất</button>
    </div>
  );
};

export default HomePage;
