import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminButton from '../../components/AdminButton';
import { FaHistory, FaCalendarAlt, FaUsers, FaDesktop, FaSearch, FaFileExcel } from 'react-icons/fa';
import './AttendanceHistory.css';

// Lịch sử ra/vào với bộ lọc theo ngày, user, thiết bị
const AttendanceHistory = () => {
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Bộ lọc: giữ định dạng input chuẩn HTML; hiển thị ra bảng dùng vi-VN (dd/mm/yyyy)
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    selectedUser: 'all',
    selectedDevice: 'all'
  });

  useEffect(() => {
    // Tải users + devices ban đầu
    const load = async () => {
      setLoading(true);
      try {
        const [uRes, dRes] = await Promise.all([
          fetch('http://localhost:3001/api/users'),
          fetch('http://localhost:3001/api/devices')
        ]);
        const [uData, dData] = [await uRes.json(), await dRes.json()];
        if (uData.success) setUsers(uData.users);
        if (dData.success) setDevices(dData.devices);
      } catch (e) {
        console.error('Lỗi khi tải users/devices:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Gọi API lấy lịch sử theo filter hiện tại
  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: filters.startDate,
        end_date: filters.endDate,
        user_id: filters.selectedUser,
        device_id: filters.selectedDevice
      });
      const response = await fetch(`http://localhost:3001/api/attendance/history?${queryParams}`);
      const data = await response.json();
      if (data.success) {
        setAttendanceData(data.attendance);
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử attendance:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    // Có nút "Lọc dữ liệu" để người dùng chủ động áp dụng
    fetchAttendanceHistory();
  };

  // Badge trạng thái theo check-in/out
  const renderStatusBadge = (checkIn, checkOut) => {
    if (!checkIn) return <span className="status-pending">Chưa vào</span>;
    if (!checkOut) return <span className="status-working">Đang làm việc</span>;
    return <span className="status-complete">Hoàn thành</span>;
  };

  if (loading) {
    return (
      <AdminLayout
        title="Lịch sử truy cập người dùng"
        subtitle="Theo dõi lịch sử ra vào của nhân viên"
        icon={FaHistory}
      >
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Lịch sử truy cập người dùng"
      subtitle="Theo dõi lịch sử ra vào của nhân viên"
      icon={FaHistory}
    >
      <div className="attendance-history-container">
        {/* Filters Section */}
        <div className="filters-container">
          <div className="filters-card">
            <h3 className="filters-title">
              <FaSearch className="filters-icon" />
              Bộ lọc dữ liệu
            </h3>
            
            {/* Lọc theo ngày */}
            <div className="filter-group">
              <div className="filter-title">Lọc theo ngày</div>
              <div className="date-row">
                <div className="input-group">
                  <label className="input-label">Ngày bắt đầu:</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Ngày kết thúc:</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Lọc theo User và thiết bị */}
            <div className="filter-group">
              <div className="select-row">
                <div className="input-group">
                  <label className="input-label">Lọc theo User:</label>
                  <select
                    className="form-select"
                    value={filters.selectedUser}
                    onChange={(e) => handleFilterChange('selectedUser', e.target.value)}
                  >
                    <option value="all">Tất cả người dùng</option>
                    {users.map((user) => (
                      <option key={user.userID} value={user.userID}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Lọc theo thiết bị:</label>
                  <select
                    className="form-select"
                    value={filters.selectedDevice}
                    onChange={(e) => handleFilterChange('selectedDevice', e.target.value)}
                  >
                    <option value="all">Tất cả thiết bị</option>
                    {devices.map((device) => (
                      <option key={device.device_id} value={device.device_id}>
                        {device.device_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="filter-actions">
              <AdminButton
                variant="success"
                size="medium"
                onClick={handleFilter}
                icon={FaSearch}
              >
                Lọc dữ liệu
              </AdminButton>
              <AdminButton
                variant="outline"
                size="medium"
                onClick={() => alert('Tính năng xuất Excel sẽ được triển khai!')}
                icon={FaFileExcel}
              >
                Xuất File Excel
              </AdminButton>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">
              <FaHistory className="table-icon" />
              Dữ liệu lịch sử
            </h3>
            <p className="table-subtitle">
              Tổng cộng: {attendanceData.length} bản ghi
            </p>
          </div>

          {attendanceData.length === 0 ? (
            <div className="no-data-container">
              <div className="no-data-card">
                <FaHistory className="no-data-icon" />
                <h3>Chưa có dữ liệu lịch sử</h3>
                <p>Vui lòng chọn khoảng thời gian và nhấn "Lọc dữ liệu" để xem kết quả</p>
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead className="table-header-row">
                  <tr>
                    <th>ID</th>
                    <th>HỌ TÊN</th>
                    <th>NGÀY</th>
                    <th>THỜI GIAN VÀO</th>
                    <th>THIẾT BỊ VÀO</th>
                    <th>THỜI GIAN RA</th>
                    <th>THIẾT BỊ RA</th>
                    <th>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {attendanceData.map((record) => (
                    <tr key={record.attendance_id}>
                      <td className="record-id">{record.attendance_id}</td>
                      <td className="record-name">{record.fullName}</td>
                      <td className="record-date">
                        {new Date(record.work_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="record-time-in">
                        {record.check_in ? new Date(record.check_in).toLocaleTimeString('vi-VN') : '--'}
                      </td>
                      <td className="record-device-in">{record.device_in_name || '--'}</td>
                      <td className="record-time-out">
                        {record.check_out ? new Date(record.check_out).toLocaleTimeString('vi-VN') : '--'}
                      </td>
                      <td className="record-device-out">{record.device_out_name || '--'}</td>
                      <td className="record-status">
                        {renderStatusBadge(record.check_in, record.check_out)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AttendanceHistory;
