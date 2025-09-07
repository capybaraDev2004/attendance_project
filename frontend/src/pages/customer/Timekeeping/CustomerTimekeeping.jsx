import React, { useState, useEffect, useCallback } from 'react';
import './CustomerTimekeeping.css';

// Sử dụng cùng API_URL như Login.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CustomerTimekeeping = () => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [actualRecordCount, setActualRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy thông tin user từ localStorage
  const getUserInfo = useCallback(() => {
    try {
      // Lấy auth object từ localStorage
      const authData = localStorage.getItem('auth');
      console.log('🔍 Raw auth data:', authData);
      
      if (authData) {
        const auth = JSON.parse(authData);
        console.log('🔍 Parsed auth data:', auth);
        
        // Trả về user info từ auth object
        if (auth.user) {
          console.log('✅ Tìm thấy user từ auth.user:', auth.user);
          return auth.user;
        }
        
        // Nếu không có user object, thử decode token
        if (auth.token) {
          const payload = JSON.parse(atob(auth.token));
          console.log('✅ Tìm thấy user từ token:', payload);
          return payload;
        }
      }
      
      console.warn('⚠️ Không tìm thấy auth data trong localStorage');
      return null;
    } catch (error) {
      console.error('❌ Lỗi khi lấy thông tin user:', error);
      return null;
    }
  }, []);

  // Fetch dữ liệu lịch sử chấm công từ API
  const fetchAttendanceHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userInfo = getUserInfo();
      console.log('👤 User info:', userInfo);
      
      if (!userInfo || !userInfo.userID) {
        console.error('❌ Không có userID:', userInfo);
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      console.log('🌐 Đang gọi API với userID:', userInfo.userID);
      const apiUrl = `${API_URL}/api/attendance/user-history/${userInfo.userID}`;
      console.log('🔗 API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        setError(`Lỗi API: ${response.status} - ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log('📊 API Response:', result);
      
      if (result.success) {
        setAttendanceHistory(result.data || []);
        setActualRecordCount(result.count || 0); // Sử dụng count từ API
        console.log('✅ Dữ liệu attendance:', result.data);
        console.log('📊 Số bản ghi thực tế:', result.count);
      } else {
        setError('Không thể tải dữ liệu lịch sử chấm công');
      }
    } catch (err) {
      console.error('❌ Lỗi khi fetch dữ liệu:', err);
      setError(`Có lỗi xảy ra khi tải dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [getUserInfo]);

  // Load dữ liệu khi component mount
  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);

  // Format ngày theo định dạng dd/mm/yyyy
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // Xác định class CSS cho status badge
  const getStatusClass = useCallback((status) => {
    if (status.includes('Muộn')) {
      return 'late';
    } else if (status.includes('Sớm')) {
      return 'early';
    } else if (status.includes('Tăng ca')) {
      return 'overtime';
    }
    return 'on-time';
  }, []);

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
          <button onClick={fetchAttendanceHistory} className="retry-button">
            Thử lại
          </button>
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

      {/* Bảng lịch sử chấm công */}
      <div className="attendance-table-container">
        <div className="table-header">
          <h3>📊 Lịch sử chấm công</h3>
          <div className="table-actions">
            <span className="total-records">Tổng: {actualRecordCount} bản ghi</span>
            <button onClick={fetchAttendanceHistory} className="refresh-button">
              🔄 Làm mới
            </button>
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
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((record) => (
                <tr key={record.id} className={`attendance-row ${record.isDateHeader ? 'date-header-row' : ''}`}>
                  <td className="date-cell">
                    <span className="date-text">
                      {record.isDateHeader ? formatDate(record.date) : formatDate(record.date)}
                    </span>
                  </td>
                  <td className="time-cell">
                    <span className="time-text">{record.time}</span>
                  </td>
                  <td className="type-cell">
                    {record.isDateHeader ? (
                      <span className="date-header-text">📅</span>
                    ) : (
                      <span className={`type-badge ${record.type.toLowerCase().replace('-', '-')}`}>
                        {record.type}
                      </span>
                    )}
                  </td>
                  <td className="status-cell">
                    {record.isDateHeader ? (
                      <span className="date-header-text"></span>
                    ) : (
                      <span className={`status-badge ${getStatusClass(record.status)}`}>
                        {record.status}
                      </span>
                    )}
                  </td>
                  <td className="location-cell">
                    <span className="location-text">{record.location}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Thông báo khi không có dữ liệu */}
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
