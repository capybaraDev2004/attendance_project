import React, { useState, useEffect } from 'react';
import './UserManagement.css';

// Trang quản lý người dùng - lấy dữ liệu từ database
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // State cho việc bật/tắt cột
  const [visibleColumns, setVisibleColumns] = useState({
    stt: true,
    id: true,
    fullName: true,
    email: false,
    phone: true,
    dateOfBirth: false,
    gender: true,
    address: true,
    position: true,
    role: true,
    status: true,
    created_at: false
  });

  // Định nghĩa các cột có thể ẩn/hiện - thêm cột STT
  const columnDefinitions = {
    stt: { key: 'stt', label: 'STT', width: '60px' },
    id: { key: 'id', label: 'ID', width: '60px' },
    fullName: { key: 'fullName', label: 'Họ tên', width: '150px' },
    email: { key: 'email', label: 'Email', width: '180px' },
    phone: { key: 'phone', label: 'Số điện thoại', width: '130px' },
    dateOfBirth: { key: 'dateOfBirth', label: 'Ngày sinh', width: '110px' },
    gender: { key: 'gender', label: 'Giới tính', width: '110px' },
    address: { key: 'address', label: 'Địa chỉ', width: '200px' },
    position: { key: 'position', label: 'Chức vụ', width: '140px' },
    role: { key: 'role', label: 'Vai trò', width: '160px' },       // + rộng
    status: { key: 'status', label: 'Trạng thái', width: '150px' }, // + rộng
    created_at: { key: 'created_at', label: 'Ngày tạo', width: '110px' }
  };

  // Lấy danh sách người dùng từ API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Đang gọi API /api/users...');
      const response = await fetch('http://localhost:3001/api/users');
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API endpoint không tồn tại. Vui lòng kiểm tra backend.');
        } else if (response.status === 500) {
          throw new Error('Lỗi máy chủ. Vui lòng kiểm tra database.');
        } else {
          throw new Error(`Lỗi HTTP: ${response.status} - ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (data.success) {
        setUsers(data.users);
        console.log(`Đã tải ${data.users.length} người dùng`);
      } else {
        throw new Error(data.message || 'Lỗi khi lấy dữ liệu người dùng');
      }
    } catch (err) {
      console.error('Lỗi chi tiết:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lọc người dùng theo tìm kiếm và bộ lọc
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sắp xếp users: nhân viên đang hoạt động lên trên, còn lại ở dưới
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // Ưu tiên sắp xếp theo trạng thái: active trước, inactive sau
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    
    // Nếu cùng trạng thái thì sắp xếp theo tên
    return a.fullName.localeCompare(b.fullName, 'vi');
  });

  // Hàm xử lý thay đổi hiển thị cột
  const handleColumnToggle = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  // Hàm bật tất cả cột
  const showAllColumns = () => {
    const allVisible = {};
    Object.keys(columnDefinitions).forEach(key => {
      allVisible[key] = true;
    });
    setVisibleColumns(allVisible);
  };

  // Hàm ẩn tất cả cột (chỉ giữ lại STT, Họ tên, Vai trò, Trạng thái)
  const hideMostColumns = () => {
    setVisibleColumns({
      stt: true,
      id: false,
      fullName: true,
      email: false,
      phone: false,
      dateOfBirth: false,
      gender: false,
      address: false,
      position: false,
      role: true,
      status: true,
      created_at: false
    });
  };

  // Hàm format ngày tháng theo định dạng dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Hàm format role
  const formatRole = (role) => {
    return role === 'admin' ? 'Quản trị viên' : 'Nhân viên';
  };

  // Hàm format status
  const formatStatus = (status) => {
    return status === 'active' ? 'Hoạt động' : 'Không hoạt động';
  };

  // Hàm format gender
  const formatGender = (gender) => {
    switch (gender) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      case 'other': return 'Khác';
      default: return '--';
    }
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management-container">
        <div className="error-container">
          <h2>❌ Lỗi</h2>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchUsers}>
            🔄 Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">QUẢN LÝ NGƯỜI DÙNG</h1>
        <p className="page-subtitle">Quản lý thông tin tất cả người dùng trong hệ thống</p>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label className="filter-label">Vai trò:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="employee">Nhân viên</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Trạng thái:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
          
          <button className="btn-refresh" onClick={fetchUsers}>
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Thống kê */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Tổng người dùng</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.role === 'admin').length}</div>
          <div className="stat-label">Quản trị viên</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.role === 'employee').length}</div>
          <div className="stat-label">Nhân viên</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.status === 'active').length}</div>
          <div className="stat-label">Đang hoạt động</div>
        </div>
      </div>

      {/* Cài đặt hiển thị cột */}
      <div className="column-controls-section">
        <div className="column-controls-header">
          <h3>⚙️ Cài đặt hiển thị cột</h3>
          <div className="column-controls-actions">
            <button className="btn-column-control" onClick={showAllColumns}>
              👁️ Hiện tất cả
            </button>
          </div>
        </div>
        
        <div className="column-toggles">
          {Object.entries(columnDefinitions).map(([key, column]) => (
            <label key={key} className="column-toggle-item">
              <input
                type="checkbox"
                checked={visibleColumns[key]}
                onChange={() => handleColumnToggle(key)}
                className="column-checkbox"
              />
              <span className="column-toggle-label">{column.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="table-container">
        <table className="users-table">
          <thead className="table-header">
            <tr>
              {visibleColumns.stt && <th style={{ width: columnDefinitions.stt.width }}>STT</th>}
              {visibleColumns.id && <th style={{ width: columnDefinitions.id.width }}>ID</th>}
              {visibleColumns.fullName && <th style={{ width: columnDefinitions.fullName.width }}>Họ tên</th>}
              {visibleColumns.email && <th style={{ width: columnDefinitions.email.width }}>Email</th>}
              {visibleColumns.phone && <th style={{ width: columnDefinitions.phone.width }}>Số điện thoại</th>}
              {visibleColumns.dateOfBirth && <th style={{ width: columnDefinitions.dateOfBirth.width }}>Ngày sinh</th>}
              {visibleColumns.gender && <th style={{ width: columnDefinitions.gender.width }}>Giới tính</th>}
              {visibleColumns.address && <th style={{ width: columnDefinitions.address.width }}>Địa chỉ</th>}
              {visibleColumns.position && <th style={{ width: columnDefinitions.position.width }}>Chức vụ</th>}
              {visibleColumns.role && <th style={{ width: columnDefinitions.role.width }}>Vai trò</th>}
              {visibleColumns.status && <th style={{ width: columnDefinitions.status.width }}>Trạng thái</th>}
              {visibleColumns.created_at && <th style={{ width: columnDefinitions.created_at.width }}>Ngày tạo</th>}
            </tr>
          </thead>
          <tbody className="table-body">
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="no-data">
                  <div className="no-data-content">
                    <p>📭 Không tìm thấy người dùng nào</p>
                    <p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedUsers.map((user, index) => (
                <tr key={user.userID} className="user-row">
                  {visibleColumns.stt && (
                    <td className="user-stt">
                      <span className="stt-badge">{index + 1}</span>
                    </td>
                  )}
                  {visibleColumns.id && <td className="user-id">{user.userID}</td>}
                  {visibleColumns.fullName && <td className="user-name">{user.fullName}</td>}
                  {visibleColumns.email && <td className="user-email">{user.email}</td>}
                  {visibleColumns.phone && <td className="user-phone">{user.phone || '--'}</td>}
                  {visibleColumns.dateOfBirth && <td className="user-birth">{formatDate(user.dateOfBirth)}</td>}
                  {visibleColumns.gender && (
                    <td className="user-gender">
                      <span
                        className={`gender-badge ${
                          user.gender === 'female'
                            ? 'gender-female'
                            : user.gender === 'male'
                            ? 'gender-male'
                            : 'gender-other'
                        }`}
                      >
                        {formatGender(user.gender)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.address && <td className="user-address">{user.address || '--'}</td>}
                  {visibleColumns.position && <td className="user-position">{user.position || '--'}</td>}
                  {visibleColumns.role && (
                    <td className="user-role">
                      <span className={`role-badge role-${user.role}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="user-status">
                      <span className={`status-badge status-${user.status}`}>
                        {formatStatus(user.status)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.created_at && <td className="user-created">{formatDate(user.created_at)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
