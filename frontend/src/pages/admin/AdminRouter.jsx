import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminLayoutWithSidebar } from '../../components/admin';
import AdminHome from './AdminHome';
import DeviceManagement from './Devices/DeviceManagement';
import FaceSetup from './Face-setup/FaceSetup';
import AttendanceHistory from './History/AttendanceHistory';
import Positions from './Positions/Positions';
import ShiftManagement from './Shift-management/ShiftManagement';
import WorkHours from './Work-hours/WorkHours';
import PayrollCalculation from './Calculate/PayrollCalculation';
import SalaryManagement from './Salary/SalaryManagement';
import CardDemo from './CardDemo';
import RFIDManagement from './RFIDManagement';
// Đã bỏ trang Chấm công đang phát triển
import UserManagement from '../UserManagement';

/**
 * Component quản lý routing cho Admin Dashboard
 */
export default function AdminRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState(location.pathname);

  // Cập nhật currentPath khi URL thay đổi
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  // Xử lý navigation
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Xử lý logout
  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/login', { replace: true });
  };

  // Render component dựa trên path hiện tại
  const renderPage = () => {
    switch (currentPath) {
      case '/admin':
        return <AdminHome />;
      case '/admin/devices':
        return <DeviceManagement />;
      case '/admin/face-setup':
        return <FaceSetup />;
      case '/admin/history':
        return <AttendanceHistory />;
      case '/admin/positions':
        return <Positions />;
      case '/admin/shift-management':
        return <ShiftManagement />;
      case '/admin/work-hours':
        return <WorkHours />;
      case '/admin/calculate':
        return <PayrollCalculation />;
      case '/admin/salary-management':
        return <SalaryManagement />;
      case '/admin/card-demo':
        return <CardDemo />;
      case '/admin/rfid-management':
        return <RFIDManagement />;
      case '/admin/users':
        return <UserManagement />; 
      // Đã xóa route /admin/attendance
      default:
        return <AdminHome />;
    }
  };

  return (
    <AdminLayoutWithSidebar
      currentPath={currentPath}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AdminLayoutWithSidebar>
  );
}
