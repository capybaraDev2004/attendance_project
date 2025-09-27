import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/Login';
import AdminRouter from './pages/admin/AdminRouter';
import TailwindTest from './components/TailwindTest';
// Import các trang customer
import CustomerUsers from './pages/customer/User/CustomerUsers';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerHome from './pages/customer/CustomerHome';
import CustomerAttendance from './pages/customer/History/CustomerAttendance';
import CustomerTimekeeping from './pages/customer/Timekeeping/CustomerTimekeeping';
import CustomerLogout from './pages/customer/CustomerLogout';
import FaceScan from './pages/customer/Face-scan/FaceScan';

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
        <Route path="/test-tailwind" element={<TailwindTest />} />

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

        {/* Trang quản lý cho admin - sử dụng AdminRouter mới */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/*" element={<AdminRouter />} />
        </Route>

        {/* Điều hướng mặc định */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;