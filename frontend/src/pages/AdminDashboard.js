// attendance_project/frontend/src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
// Import trang quản lý người dùng
import UserManagement from './UserManagement';

// Trang quản lý dành cho admin với giao diện hiện đại
const AdminDashboard = () => {
  const navigate = useNavigate();
  // Cập nhật activeTab mặc định thành 'manage-users'
  const [activeTab, setActiveTab] = useState('manage-users');
  const [timeFilter, setTimeFilter] = useState('in'); // 'in' hoặc 'out'
  const [loading, setLoading] = useState(false);
  
  // State cho check in/out
  const [checkInData, setCheckInData] = useState({
    user_id: '',
    device_id: '',
    check_time: new Date().toISOString().slice(0, 16)
  });
  
  const [checkOutData, setCheckOutData] = useState({
    user_id: '',
    device_id: '',
    check_time: new Date().toISOString().slice(0, 16)
  });
  
  // State cho danh sách users và devices
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  
  // State cho các bộ lọc
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '12:00',
    endTime: '23:59',
    selectedUser: 'all',
    selectedDevice: 'all'
  });

  // Dữ liệu mẫu cho bảng lịch sử truy cập
  const [attendanceData, setAttendanceData] = useState([]);

  // Lấy thông tin auth từ localStorage
  const raw = localStorage.getItem('auth');
  const auth = raw ? JSON.parse(raw) : null;

  // Menu items cho sidebar - đưa quản lý người dùng lên đầu, check in/out xuống dòng 2
  const menuItems = [
    { id: 'manage-users', label: '👥 Quản lý người dùng', active: true },
    { id: 'check-in', label: '✅ Check In/Out', active: false },
    { id: 'history', label: '📊 Lịch sử ra vào', active: false },
    { id: 'calculate', label: '📋 Tính công', active: false },
    { id: 'devices', label: '⚙️ Quản lý thiết bị', active: false },
    { id: 'work-hours', label: '⏰ Giờ làm việc', active: false },
    { id: 'positions', label: '👔 Chức vụ', active: false },
    { id: 'employee-status', label: '📈 Trang thái nhân viên', active: false }
  ];

  // Fetch users và devices khi component mount
  useEffect(() => {
    fetchUsers();
    fetchDevices();
  }, []);

  // Fetch danh sách users
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách users:', error);
    }
  };

  // Fetch danh sách devices
  const fetchDevices = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/devices');
      const data = await response.json();
      if (data.success) {
        setDevices(data.devices);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách devices:', error);
    }
  };

  // Hàm check in
  const handleCheckIn = async () => {
    if (!checkInData.user_id || !checkInData.device_id) {
      alert('Vui lòng chọn nhân viên và thiết bị');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkInData),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Check in thành công cho ${data.data.user_name}`);
        setCheckInData({
          user_id: '',
          device_id: '',
          check_time: new Date().toISOString().slice(0, 16)
        });
        // Refresh lịch sử
        if (activeTab === 'history') {
          fetchAttendanceHistory();
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Lỗi check in:', error);
      alert('Lỗi khi check in');
    } finally {
      setLoading(false);
    }
  };

  // Hàm check out
  const handleCheckOut = async () => {
    if (!checkOutData.user_id || !checkOutData.device_id) {
      alert('Vui lòng chọn nhân viên và thiết bị');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkOutData),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Check out thành công cho ${data.data.user_name}`);
        setCheckOutData({
          user_id: '',
          device_id: '',
          check_time: new Date().toISOString().slice(0, 16)
        });
        // Refresh lịch sử
        if (activeTab === 'history') {
          fetchAttendanceHistory();
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Lỗi check out:', error);
      alert('Lỗi khi check out');
    } finally {
      setLoading(false);
    }
  };

  // Fetch lịch sử attendance
  const fetchAttendanceHistory = async () => {
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
      }
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử attendance:', error);
    }
  };

  // Hàm đăng xuất
  const logout = () => {
    localStorage.removeItem('auth');
    navigate('/login', { replace: true });
  };

  // Hàm xử lý thay đổi bộ lọc
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Hàm lọc dữ liệu
  const handleFilter = () => {
    fetchAttendanceHistory();
  };

  // Hàm xuất Excel
  const handleExportExcel = () => {
    console.log('Xuất file Excel');
    // Thêm logic xuất Excel ở đây
    alert('Tính năng xuất Excel sẽ được triển khai!');
  };

  // Hàm render status badge
  const renderStatusBadge = (checkIn, checkOut) => {
    if (!checkIn) return <span className="status-pending">Chưa vào</span>;
    if (!checkOut) return <span className="status-working">Đang làm việc</span>;
    return <span className="status-complete">Hoàn thành</span>;
  };

  // Hàm render nội dung theo tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'manage-users':
        return <UserManagement />;
      case 'check-in':
        return (
          <>
            {/* Page Header */}
            <div className="page-header">
              <h1 className="page-title">CHECK IN/OUT CHẤM CÔNG</h1>
            </div>

            {/* Check In Section */}
            <div className="check-section">
              <h2 className="section-title">✅ CHECK IN</h2>
              <div className="check-form">
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Chọn nhân viên:</label>
                    <select
                      className="form-select"
                      value={checkInData.user_id}
                      onChange={(e) => setCheckInData(prev => ({ ...prev, user_id: e.target.value }))}
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {users.map(user => (
                        <option key={user.userID} value={user.userID}>
                          {user.fullName} ({user.rfid_code || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Chọn thiết bị:</label>
                    <select
                      className="form-select"
                      value={checkInData.device_id}
                      onChange={(e) => setCheckInData(prev => ({ ...prev, device_id: e.target.value }))}
                    >
                      <option value="">-- Chọn thiết bị --</option>
                      {devices.map(device => (
                        <option key={device.device_id} value={device.device_id}>
                          {device.device_name} ({device.location})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Thời gian check in:</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={checkInData.check_time}
                      onChange={(e) => setCheckInData(prev => ({ ...prev, check_time: e.target.value }))}
                    />
                  </div>
                </div>
                <button 
                  className="btn-check-in" 
                  onClick={handleCheckIn}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : '✅ CHECK IN'}
                </button>
              </div>
            </div>

            {/* Check Out Section */}
            <div className="check-section">
              <h2 className="section-title">🚪 CHECK OUT</h2>
              <div className="check-form">
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Chọn nhân viên:</label>
                    <select
                      className="form-select"
                      value={checkOutData.user_id}
                      onChange={(e) => setCheckOutData(prev => ({ ...prev, user_id: e.target.value }))}
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {users.map(user => (
                        <option key={user.userID} value={user.userID}>
                          {user.fullName} ({user.rfid_code || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Chọn thiết bị:</label>
                    <select
                      className="form-select"
                      value={checkOutData.device_id}
                      onChange={(e) => setCheckOutData(prev => ({ ...prev, device_id: e.target.value }))}
                    >
                      <option value="">-- Chọn thiết bị --</option>
                      {devices.map(device => (
                        <option key={device.device_id} value={device.device_id}>
                          {device.device_name} ({device.location})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Thời gian check out:</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={checkOutData.check_time}
                      onChange={(e) => setCheckOutData(prev => ({ ...prev, check_time: e.target.value }))}
                    />
                  </div>
                </div>
                <button 
                  className="btn-check-out" 
                  onClick={handleCheckOut}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : '🚪 CHECK OUT'}
                </button>
              </div>
            </div>
          </>
        );
      case 'history':
        return (
          <>
            {/* Page Header */}
            <div className="page-header">
              <h1 className="page-title">LỊCH SỬ TRUY CẬP NGƯỜI DÙNG</h1>
            </div>

            {/* Filters Section */}
            <div className="filters-section">
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
                      {users.map(user => (
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
                      {devices.map(device => (
                        <option key={device.device_id} value={device.device_id}>
                          {device.device_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="btn-filter" onClick={handleFilter}>
                  🔍 Lọc dữ liệu
                </button>
                <button className="btn-export" onClick={handleExportExcel}>
                  📊 Xuất File Excel
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="table-container">
              {loading ? (
                <div className="loading">
                  Đang tải dữ liệu...
                </div>
              ) : (
                <table className="data-table">
                  <thead className="table-header">
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
                        <td>{record.attendance_id}</td>
                        <td>{record.fullName}</td>
                        <td>{new Date(record.work_date).toLocaleDateString('vi-VN')}</td>
                        <td>{record.check_in ? new Date(record.check_in).toLocaleTimeString('vi-VN') : '--'}</td>
                        <td>{record.device_in_name || '--'}</td>
                        <td>{record.check_out ? new Date(record.check_out).toLocaleTimeString('vi-VN') : '--'}</td>
                        <td>{record.device_out_name || '--'}</td>
                        <td>{renderStatusBadge(record.check_in, record.check_out)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        );
      default:
        return (
          <div className="page-header">
            <h1 className="page-title">Tính năng đang phát triển</h1>
          </div>
        );
    }
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="admin-badge">ADMIN</div>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li key={item.id} className="menu-item">
                <a
                  href="#"
                  className={`menu-link ${item.id === activeTab ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(item.id);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
            
            {/* Menu đăng xuất */}
            <li className="menu-item">
              <a
                href="#"
                className="menu-link logout"
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                }}
              >
                🚪 Đăng xuất
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
