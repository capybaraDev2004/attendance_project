import React from 'react';

// Trang home rỗng: gợi ý thao tác nhanh
const CustomerHome = () => {
  return (
    <div>
      <h2>Trang chủ</h2>
      <p>Chọn một chức năng ở thanh bên để bắt đầu.</p>
      <div className="quick-actions">
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
      </div>
    </div>
  );
};

export default CustomerHome;


