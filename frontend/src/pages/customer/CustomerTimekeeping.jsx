import React, { useState } from 'react';
import './CustomerTimekeeping.css';
import CameraApp from './CameraApp';

const CustomerTimekeeping = () => {
  // State để quản lý dữ liệu chấm công (mock data)
  const [attendanceHistory] = useState([
    {
      id: 1,
      date: '15/01/2025',
      time: '08:30',
      type: 'Check-in',
      status: 'Đúng giờ',
      location: 'Văn phòng chính'
    },
    {
      id: 2,
      date: '15/01/2025',
      time: '17:30',
      type: 'Check-out',
      status: 'Đúng giờ',
      location: 'Văn phòng chính'
    },
    {
      id: 3,
      date: '14/01/2025',
      time: '08:45',
      type: 'Check-in',
      status: 'Muộn 15 phút',
      location: 'Văn phòng chính'
    },
    {
      id: 4,
      date: '14/01/2025',
      time: '17:30',
      type: 'Check-out',
      status: 'Đúng giờ',
      location: 'Văn phòng chính'
    },
    {
      id: 5,
      date: '13/01/2025',
      time: '08:20',
      type: 'Check-in',
      status: 'Đúng giờ',
      location: 'Văn phòng chính'
    },
    {
      id: 6,
      date: '13/01/2025',
      time: '17:30',
      type: 'Check-out',
      status: 'Đúng giờ',
      location: 'Văn phòng chính'
    }
  ]);

  return (
    <div className="timekeeping-container">
      <div className="timekeeping-header">
        <h2>🕐 Quản lý chấm công</h2>
      </div>
      
      {/* Khu vực camera và chấm công */}
      <CameraApp />

      {/* Bảng lịch sử chấm công */}
      <div className="attendance-table-container">
        <div className="table-header">
          <h3>📊 Lịch sử chấm công</h3>
          <div className="table-actions">
            <span className="total-records">Tổng: {attendanceHistory.length} bản ghi</span>
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
                <tr key={record.id} className="attendance-row">
                  <td className="date-cell">
                    <span className="date-text">{record.date}</span>
                  </td>
                  <td className="time-cell">
                    <span className="time-text">{record.time}</span>
                  </td>
                  <td className="type-cell">
                    <span className={`type-badge ${record.type.toLowerCase()}`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${record.status.includes('Muộn') ? 'late' : 'on-time'}`}>
                      {record.status}
                    </span>
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
        {attendanceHistory.length === 0 && (
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
