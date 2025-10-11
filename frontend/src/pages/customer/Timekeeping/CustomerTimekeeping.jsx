import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import './CustomerTimekeeping.css';

const DEFAULT_HOST = typeof window !== 'undefined' && window.location && window.location.hostname
  ? window.location.hostname
  : 'localhost';
const API_URL = process.env.REACT_APP_API_URL || `http://${DEFAULT_HOST}:3001`;

const CustomerTimekeeping = () => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [actualRecordCount, setActualRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Lấy thông tin user từ localStorage
  const getUserInfo = useCallback(() => {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const auth = JSON.parse(authData);
        if (auth.user) return auth.user;
        if (auth.token) {
          const payload = JSON.parse(atob(auth.token.split('.')[1]));
          return payload;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Lỗi khi lấy thông tin user:', error);
      return null;
    }
  }, []);

  // 🔹 API fetch lịch sử chấm công
  const fetchAttendanceHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = getUserInfo();
      if (!userInfo || !userInfo.userID) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      const response = await fetch(`${API_URL}/api/attendance/user-history/${userInfo.userID}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        setAttendanceHistory(result.data || []);
        setActualRecordCount(result.count || 0);
      } else {
        setError('Không thể tải dữ liệu lịch sử chấm công');
      }
    } catch (err) {
      setError(`Có lỗi xảy ra khi tải dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [getUserInfo]);

  // 🔹 Kết nối WebSocket realtime
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on("attendanceUpdate", (data) => {
      console.log("📡 Nhận realtime:", data);

      // 👉 Cập nhật trực tiếp thay vì bắt reload toàn bộ
      setAttendanceHistory((prev) => {
        // Tránh trùng ID
        if (prev.some(r => r.id === data.id && r.type === data.type)) return prev;
        return [data, ...prev];
      });

      setActualRecordCount((prev) => prev + 1);
    });



    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });
    socket.on('connect_error', (err) => {
      console.error('⚠️ Socket connect_error:', err.message);
    });

    return () => socket.disconnect();
  }, []);

  // 🔹 Load dữ liệu ban đầu
  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);

  // Helpers format hiển thị (chống "Invalid Date" với nhiều định dạng khác nhau)
  const toDate = useCallback((value) => {
    if (!value && value !== 0) return null;

    // Nếu đã là Date
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    // Nếu là số/epoch
    if (typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }

    // Chuỗi thời gian HH:mm hoặc HH:mm:ss → không chuyển Date, xử lý ở formatTime
    if (typeof value === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(value.trim())) {
      return null;
    }

    if (typeof value === 'string') {
      const s = value.trim();

      // yyyy-MM-dd (chỉ ngày, không 'T') → parse LOCAL để tránh lệch ngày
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d0] = s.split('-').map(n => parseInt(n, 10));
        const d = new Date(y, m - 1, d0, 0, 0, 0, 0);
        return isNaN(d.getTime()) ? null : d;
      }

      // ISO hoặc yyyy-MM-dd... → để Date tự parse
      if (/^\d{4}[-\/]\d{2}[-\/]\d{2}/.test(s) || s.includes('T')) {
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
      }

      // dd/MM/yyyy hoặc dd-MM-yyyy (có thể kèm HH:mm[:ss])
      const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
      if (m) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1;
        const year = parseInt(m[3], 10);
        const hours = m[4] ? parseInt(m[4], 10) : 0;
        const minutes = m[5] ? parseInt(m[5], 10) : 0;
        const seconds = m[6] ? parseInt(m[6], 10) : 0;
        const d = new Date(year, month, day, hours, minutes, seconds);
        return isNaN(d.getTime()) ? null : d;
      }

      // Số dạng chuỗi (epoch)
      if (/^\d+$/.test(s)) {
        const d = new Date(parseInt(s, 10));
        return isNaN(d.getTime()) ? null : d;
      }
    }

    return null;
  }, []);

  const formatDate = useCallback((anyDate) => {
    const date = toDate(anyDate);
    if (!date) return '--';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, [toDate]);

  const formatTime = useCallback((anyTime, fallbackAnyDate = null) => {
    if (!anyTime && anyTime !== 0) {
      const d = toDate(fallbackAnyDate);
      if (!d) return '--';
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mi}`;
    }

    if (typeof anyTime === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(anyTime.trim())) {
      return anyTime.trim().slice(0, 5);
    }

    const d = toDate(anyTime);
    if (!d) {
      // thử dùng fallback
      const fd = toDate(fallbackAnyDate);
      if (!fd) return '--';
      const hh = String(fd.getHours()).padStart(2, '0');
      const mi = String(fd.getMinutes()).padStart(2, '0');
      return `${hh}:${mi}`;
    }
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mi}`;
  }, [toDate]);

  const getStatusClass = useCallback((status) => {
    if (!status) return '';
    if (status.includes('Muộn')) return 'late';
    if (status.includes('Sớm')) return 'early';
    if (status.includes('Tăng ca')) return 'overtime';
    return 'on-time';
  }, []);

  // UI render
  if (loading) {
    return (
      <div>
        <div className="timekeeping-header">
          <h2>🕐 Quản lý chấm công</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timekeeping-container">
        <div className="timekeeping-header">
          <h2>🕐 Quản lý chấm công</h2>
        </div>
        <div className="error-container">
          <div className="error-icon">❌</div>
          <p>{error}</p>
          <button onClick={fetchAttendanceHistory} className="retry-button">Thử lại</button>
          <button
            onClick={() => {
              localStorage.removeItem('auth');
              window.location.href = '/login';
            }}
            className="retry-button"
            style={{ marginLeft: '10px', background: '#ef4444' }}
          >
            Đăng nhập lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="timekeeping-container">
      <div className="timekeeping-header">
        <h2>🕐 Quản lý chấm công</h2>
      </div>

      <div className="attendance-table-container">
        <div className="table-header">
          <h3>📊 Lịch sử chấm công</h3>
          <div className="table-actions">
            <span className="total-records">Tổng: {actualRecordCount} bản ghi</span>
            <button onClick={fetchAttendanceHistory} className="refresh-button">🔄 Làm mới</button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>📅 Ngày</th>
                <th>🕐 Giờ</th>
                <th>🏷️ Loại</th>
                <th>📊 Trạng thái</th>
                <th>📍 Địa điểm</th>
                <th>👤 Nhân viên</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((record) => (
                <tr key={`${record.id}-${record.type}`} className={`attendance-row`}>
                  <td>{formatDate(record.date || record.dateIn || record.createdAt || record.timestamp)}</td>
                  <td>{formatTime(record.time || record.timeIn || record.datetime || record.timestamp, record.date || record.createdAt)}</td>
                  <td>
                    <span className={`type-badge ${record.type?.toLowerCase()}`}>{record.type}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(record.status)}`}>{record.status}</span>
                  </td>
                  <td>{record.location}</td>
                  <td>{record.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {actualRecordCount === 0 && (
          <div className="no-data">
            <div className="no-data-icon">📊</div>
            <p>Chưa có lịch sử chấm công</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerTimekeeping;
