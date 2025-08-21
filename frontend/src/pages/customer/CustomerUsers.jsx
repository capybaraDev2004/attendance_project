import React from 'react';

// Base trang quản lý người dùng (chưa gắn API)
const CustomerUsers = () => {
  return (
    <div>
      <h2>Quản lý người dùng</h2>
      <p>Đây là khung giao diện cơ bản. Tính năng sẽ được triển khai sau.</p>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <input placeholder="Tìm kiếm theo tên..." className="form-input" />
          <button className="qa-btn">Tìm</button>
          <button className="qa-btn">Thêm mới</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Tên đăng nhập</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody className="table-body">
              <tr>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>
                  <button className="qa-btn">Sửa</button>
                  <button className="qa-btn" style={{ marginLeft: 8 }}>Xoá</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerUsers;


