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

  // Helpers format hiển thị
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }, []);

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
                  <td>{formatDate(record.date)}</td>
                  <td>{record.time}</td>
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
