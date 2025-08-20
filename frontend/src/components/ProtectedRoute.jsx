// attendance_project/frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Bảo vệ route theo role: nếu chưa đăng nhập => /login
// Nếu đăng nhập nhưng role không phù hợp => điều hướng đúng trang hợp lệ theo role
const ProtectedRoute = ({ allowedRoles }) => {
  // Lấy thông tin auth từ localStorage (được set sau khi đăng nhập)
  const raw = localStorage.getItem('auth');
  const auth = raw ? JSON.parse(raw) : null;

  if (!auth || !auth.role) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.includes(auth.role);

  if (hasAccess) {
    return <Outlet />;
  }

  // Điều hướng về trang đúng role
  return <Navigate to={auth.role === 'admin' ? '/admin' : '/'} replace />;
};

export default ProtectedRoute;
