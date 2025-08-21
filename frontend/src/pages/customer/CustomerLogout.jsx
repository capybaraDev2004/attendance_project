import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Trang logout: tự động đăng xuất và điều hướng về login
const CustomerLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Xoá auth và quay về trang đăng nhập
    localStorage.removeItem('auth');
    const timer = setTimeout(() => navigate('/login', { replace: true }), 300);
    return () => clearTimeout(timer);
  }, [navigate]);

  return <div>Đang đăng xuất...</div>;
};

export default CustomerLogout;


