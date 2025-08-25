import React, { useState } from 'react';
import FaceScanModal from '../../components/FaceScanModal';
import './CustomerHomeStyles.css';

// Trang home với các thao tác nhanh và nút quét khuôn mặt
const CustomerHome = () => {
  const [faceScanModalOpen, setFaceScanModalOpen] = useState(false);
  return (
    <div>
      <div className="home-header">
        <div>
          <h2>Trang chủ</h2>
          <p>Chọn một chức năng ở thanh bên để bắt đầu.</p>
        </div>
        <button 
          className="face-scan-btn" 
          onClick={() => setFaceScanModalOpen(true)}
        >
          <span className="scan-icon">🔍</span>
          Quét Khuôn Mặt
        </button>
      </div>
      
      {/* Modal quét khuôn mặt */}
      <FaceScanModal 
        isOpen={faceScanModalOpen} 
        onClose={() => setFaceScanModalOpen(false)} 
      />
      <div className="quick-actions" style={{ marginTop: '20px' }}>
        <div className="qa-card">
          <h3 className="qa-title">Quản lý người dùng</h3>
          <p className="qa-desc">Xem và chỉnh sửa thông tin người dùng.</p>
          <a className="qa-btn" href="users">Mở</a>
        </div>
        <div className="qa-card">
          <h3 className="qa-title">Lịch sử ra vào</h3>
          <p className="qa-desc">Xem nhật ký ra/vào theo ngày.</p>
          <a className="qa-btn" href="attendance">Mở</a>
        </div>
        <div className="qa-card">
          <h3 className="qa-title">Tính công</h3>
          <p className="qa-desc">Tổng hợp công theo kỳ.</p>
          <a className="qa-btn" href="timekeeping">Mở</a>
        </div>
        <div className="qa-card highlight-card">
          <h3 className="qa-title">Quét khuôn mặt</h3>
          <p className="qa-desc">Điểm danh bằng nhận diện khuôn mặt.</p>
          <button className="qa-btn" onClick={() => setFaceScanModalOpen(true)}>Quét ngay</button>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;


