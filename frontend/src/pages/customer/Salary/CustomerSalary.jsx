import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as TablerIcons from '@tabler/icons-react';

// Trang bảng lương cho customer - chỉ hiển thị lương cá nhân
export default function CustomerSalary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Tính API base
  const computeApiBase = () => {
    const envBase = process.env.REACT_APP_API_BASE_URL;
    if (envBase && envBase.trim()) return envBase.replace(/\/$/, '');
    const origin = window.location.origin;
    return origin.includes(':3000') ? origin.replace(':3000', ':3001') : origin;
  };

  // Lấy user hiện tại từ localStorage
  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('auth');
      const auth = raw ? JSON.parse(raw) : null;
      return auth?.user?.userID || auth?.user?.id || null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const fetchData = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      toast.error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }
    setLoading(true);
    try {
      const API_BASE = computeApiBase();
      const url = `${API_BASE}/api/attendance/payroll?month=${encodeURIComponent(selectedMonth)}&user_id=${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tải dữ liệu bảng lương');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Lỗi dữ liệu bảng lương');

      const item = (json.data || [])[0] || null;
      setData(item);
    } catch (err) {
      console.error(err);
      toast.error('Tải dữ liệu bảng lương thất bại');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div className="salary-management-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <TablerIcons.IconCurrencyDollar className="header-icon" size={32} />
            <div>
              <h1>Bảng lương cá nhân</h1>
              <p>Xem chi tiết lương theo tháng của bạn</p>
            </div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="month">Tháng:</label>
            <input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-input"
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : !data ? (
          <div className="p-6 text-gray-600">Không có dữ liệu trong tháng đã chọn.</div>
        ) : (
          <div className="table-wrapper">
            <table className="salary-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Phòng ban</th>
                  <th>Chức vụ</th>
                  <th>Lương cơ bản</th>
                  <th>Tổng công</th>
                  <th>Giờ làm thêm</th>
                  <th>Ngày đi muộn</th>
                  <th>Tiền phạt</th>
                  <th>Tổng lương</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{data.fullName}</td>
                  <td>{data.department || '—'}</td>
                  <td>{data.position || '—'}</td>
                  <td>{formatCurrency(data.salaryRank)}</td>
                  <td>{(data.totalWorkDays || 0).toFixed(2)} ngày</td>
                  <td>{(data.totalOvertimeHours || 0).toFixed(2)}h</td>
                  <td>{data.totalLateDays || 0}</td>
                  <td>{formatCurrency(data.totalPenaltyAmount)}</td>
                  <td>
                    <strong className={Number(data.totalSalary) < 0 ? 'text-red-600' : ''}>
                      {formatCurrency(data.totalSalary)}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


