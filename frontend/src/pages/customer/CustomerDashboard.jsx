import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import CustomerLayoutWithSidebar from '../../components/customer/CustomerLayoutWithSidebar';

/**
 * Layout tổng cho customer với sidebar đẹp mắt
 */
const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const raw = localStorage.getItem('auth');
  const auth = raw ? JSON.parse(raw) : null;

  // Xử lý navigation
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Xử lý logout
  const handleLogout = () => {
    // Đăng xuất an toàn: xoá auth và điều hướng
    localStorage.removeItem('auth');
    navigate('/login', { replace: true });
  };

  return (
    <CustomerLayoutWithSidebar
      currentPath={location.pathname}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {/* Hiển thị thông tin user ở đầu trang */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Chào mừng trở lại!</h2>
            {auth?.user?.fullName ? (
              <p className="text-gray-600 mt-1">
                Xin chào, <span className="font-medium text-green-600">{auth.user.fullName}</span>
              </p>
            ) : (
              <p className="text-gray-600 mt-1">Đang tải thông tin...</p>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* Outlet render trang con */}
      <Outlet />
    </CustomerLayoutWithSidebar>
  );
};

export default CustomerDashboard;


