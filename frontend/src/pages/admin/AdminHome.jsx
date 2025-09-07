import React from 'react';
import { FaUsers, FaHistory, FaDesktop, FaCalculator } from 'react-icons/fa';

// Trang chủ admin - hiển thị tổng quan và thống kê
const AdminHome = () => {
  return (
    <div className="admin-home">
      <div className="admin-welcome">
        <h1>Chào mừng đến với Admin Dashboard</h1>
        <p>Quản lý hệ thống chấm công và nhân sự</p>
      </div>

      <div className="admin-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaUsers />
            </div>
            <div className="stat-content">
              <h3>Tổng nhân viên</h3>
              <p className="stat-number">--</p>
              <span className="stat-label">người</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaHistory />
            </div>
            <div className="stat-content">
              <h3>Chấm công hôm nay</h3>
              <p className="stat-number">--</p>
              <span className="stat-label">lần</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaDesktop />
            </div>
            <div className="stat-content">
              <h3>Thiết bị hoạt động</h3>
              <p className="stat-number">--</p>
              <span className="stat-label">thiết bị</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaCalculator />
            </div>
            <div className="stat-content">
              <h3>Công chưa tính</h3>
              <p className="stat-number">--</p>
              <span className="stat-label">ngày</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-quick-actions">
        <h2>Các chức năng chính</h2>
        <div className="actions-grid">
          <div className="action-card">
            <h3>👥 Quản lý người dùng</h3>
            <p>Thêm, sửa, xóa thông tin nhân viên</p>
          </div>
          <div className="action-card">
            <h3>👁 Cài đặt nhận diện</h3>
            <p>Cấu hình hệ thống nhận diện khuôn mặt</p>
          </div>
          <div className="action-card">
            <h3>📜 Lịch sử ra vào</h3>
            <p>Xem và quản lý lịch sử chấm công</p>
          </div>
          <div className="action-card">
            <h3>💰 Tính công</h3>
            <p>Tính toán lương và công làm việc</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
