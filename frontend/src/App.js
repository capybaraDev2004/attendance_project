import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/Login';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Trang chủ cho customer */}
      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      {/* Trang quản lý cho admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* Điều hướng mặc định */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;