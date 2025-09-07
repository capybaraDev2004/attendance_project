import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './components/ToastStyles.css';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
// Import các trang customer
import CustomerUsers from './pages/customer/User/CustomerUsers';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerHome from './pages/customer/CustomerHome';
import CustomerAttendance from './pages/customer/History/CustomerAttendance';
import CustomerTimekeeping from './pages/customer/Timekeeping/CustomerTimekeeping';
import CustomerLogout from './pages/customer/CustomerLogout';
import FaceScan from './pages/customer/Face-scan/FaceScan';

// Import các trang admin
import AdminHome from './pages/admin/AdminHome';
import UserManagement from './pages/UserManagement';
import FaceSetup from './pages/admin/Face-setup/FaceSetup';
import AttendanceHistory from './pages/admin/History/AttendanceHistory';
import PayrollCalculation from './pages/admin/Calculate/PayrollCalculation';
import DeviceManagement from './pages/admin/Devices/DeviceManagement';
import WorkHours from './pages/admin/Work-hours/WorkHours';
import Positions from './pages/admin/Positions/Positions';
import ShiftManagement from './pages/admin/Shift-management/ShiftManagement';

function App() {
  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Khu vực customer: dùng layout và route lồng */}
        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
          <Route path="/" element={<CustomerDashboard />}>
            <Route index element={<CustomerHome />} />
            <Route path="users" element={<CustomerUsers />} />
            <Route path="face-scan" element={<FaceScan />} />
            <Route path="attendance" element={<CustomerAttendance />} />
            <Route path="timekeeping" element={<CustomerTimekeeping />} />
            <Route path="logout" element={<CustomerLogout />} />
          </Route>
        </Route>

        {/* Trang quản lý cho admin - sử dụng nested routes với URL riêng */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminHome />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="face-setup" element={<FaceSetup />} />
            <Route path="history" element={<AttendanceHistory />} />
            <Route path="calculate" element={<PayrollCalculation />} />
            <Route path="devices" element={<DeviceManagement />} />
            <Route path="work-hours" element={<WorkHours />} />
            <Route path="positions" element={<Positions />} />
            <Route path="shift-management" element={<ShiftManagement />} />
          </Route>
        </Route>

        {/* Điều hướng mặc định */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;