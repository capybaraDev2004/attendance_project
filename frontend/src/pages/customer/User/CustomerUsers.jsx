import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import AdminButton from '../../../components/AdminButton';
import { FaUsers, FaSearch, FaFilter, FaEye, FaEyeSlash } from 'react-icons/fa';
import './CustomerUsers.css';

// Component quản lý người dùng cho customer - chỉ xem danh sách
const CustomerUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Bộ lọc và tìm kiếm
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all', // all, active, inactive
    role: 'all' // all, admin, employee
  });

  // Bộ lọc hiển thị cột
  const [visibleColumns, setVisibleColumns] = useState({
    userID: true,
    fullName: true,
    role: true,
    email: false,
    phone: true,
    dateOfBirth: true,
    gender: true,
    position: true,
    status: true
  });

  // Gọi API lấy danh sách người dùng
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi API: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      } else {
        setError('Không thể tải danh sách người dùng');
      }
    } catch (err) {
      console.error('Lỗi khi fetch danh sách users:', err);
      setError(`Có lỗi xảy ra khi tải dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lọc và tìm kiếm người dùng
  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // Tìm kiếm theo tên hoặc username hoặc email
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.userName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Lọc theo trạng thái
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    // Lọc theo vai trò
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    setFilteredUsers(filtered);
  }, [users, filters]);

  // Tự động lọc khi filters thay đổi
  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  // Load dữ liệu khi component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSearch = useCallback(() => {
    filterUsers();
  }, [filterUsers]);

  const handleResetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: 'all',
      role: 'all'
    });
  }, []);

  const handleColumnToggle = useCallback((column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  }, []);

  // Badge trạng thái người dùng
  const renderStatusBadge = useCallback((status) => {
    if (status === 'active') {
      return <span className="status-active">Hoạt động</span>;
    }
    return <span className="status-inactive">Không hoạt động</span>;
  }, []);

  // Badge vai trò người dùng
  const renderRoleBadge = useCallback((role) => {
    switch (role) {
      case 'admin':
        return <span className="role-admin2">Quản trị</span>;
      case 'employee':
        return <span className="role-employee2">Nhân viên</span>;
      default:
        return <span className="role-default">{role || 'Chưa xác định'}</span>;
    }
  }, []);

  // Badge giới tính
  const renderGenderBadge = useCallback((gender) => {
    switch (gender) {
      case 'male':
        return <span className="gender-male">Nam</span>;
      case 'female':
        return <span className="gender-female">Nữ</span>;
      case 'other':
        return <span className="gender-other">Khác</span>;
      default:
        return <span className="gender-default">--</span>;
    }
  }, []);

  // Format ngày sinh
  const formatDateOfBirth = useCallback((dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }, []);

  if (loading) {
    return (
      <AdminLayout
        title="Danh sách người dùng"
        subtitle="Xem danh sách người dùng trong hệ thống"
        icon={FaUsers}
      >
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout
        title="Danh sách người dùng"
        subtitle="Xem danh sách người dùng trong hệ thống"
        icon={FaUsers}
      >
        <div className="error-container">
          <div className="error-icon">❌</div>
          <p>{error}</p>
          <AdminButton
            variant="primary"
            size="medium"
            onClick={fetchUsers}
            icon={FaSearch}
          >
            Thử lại
          </AdminButton>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Danh sách người dùng"
      subtitle="Xem danh sách người dùng trong hệ thống"
      icon={FaUsers}
    >
      <div className="user-management-container2">
        {/* Filters Section */}
        <div className="filters-container">
          <div className="filters-card">
            <h3 className="filters-title">
              <FaFilter className="filters-icon" />
              Bộ lọc và tìm kiếm
            </h3>
            
            <div className="filter-group">
              <div className="filter-title">Tìm kiếm</div>
              <div className="search-row">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tìm theo tên, username hoặc email..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  />
                </div>
                <AdminButton
                  variant="success"
                  size="medium"
                  onClick={handleSearch}
                  icon={FaSearch}
                >
                  Tìm kiếm
                </AdminButton>
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-title">Bộ lọc</div>
              <div className="filter-row">
                <div className="input-group">
                  <label className="input-label">Trạng thái:</label>
                  <select
                    className="form-input"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Vai trò:</label>
                  <select
                    className="form-input"
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="admin">Quản trị</option>
                    <option value="employee">Nhân viên</option>
                  </select>
                </div>
                <div className="input-group">
                  <AdminButton
                    variant="outline"
                    size="medium"
                    onClick={handleResetFilters}
                  >
                    Đặt lại
                  </AdminButton>
                </div>
              </div>
            </div>

            {/* Bộ lọc hiển thị cột */}
            <div className="filter-group">
              <div className="filter-title">Hiển thị cột</div>
              <div className="column-toggle-grid">
                {Object.entries(visibleColumns).map(([column, isVisible]) => (
                  <label key={column} className="column-toggle-item">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => handleColumnToggle(column)}
                    />
                    <span className="column-toggle-label">
                      {isVisible ? <FaEye /> : <FaEyeSlash />}
                      {column === 'userID' && 'ID'}
                      {column === 'fullName' && 'Họ tên'}
                      {column === 'role' && 'Vai trò'}
                      {column === 'email' && 'Email'}
                      {column === 'phone' && 'Số điện thoại'}
                      {column === 'dateOfBirth' && 'Ngày sinh'}
                      {column === 'gender' && 'Giới tính'}
                      {column === 'position' && 'Chức vụ'}
                      {column === 'status' && 'Trạng thái'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">
              <FaUsers className="table-icon" />
              Danh sách người dùng
            </h3>
            <p className="table-subtitle">
              Tổng cộng: {filteredUsers.length} người dùng
            </p>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="no-data-container">
              <div className="no-data-card">
                <FaUsers className="no-data-icon" />
                <h3>Không tìm thấy người dùng</h3>
                <p>Vui lòng thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead className="table-header-row">
                  <tr>
                    {visibleColumns.userID && <th>STT</th>}
                    {visibleColumns.userID && <th>ID</th>}
                    {visibleColumns.fullName && <th>Họ và tên</th>}
                    {visibleColumns.role && <th>Vai trò</th>}
                    {visibleColumns.email && <th>Email</th>}
                    {visibleColumns.phone && <th>Số điện thoại</th>}
                    {visibleColumns.dateOfBirth && <th>Ngày sinh</th>}
                    {visibleColumns.gender && <th>Giới tính</th>}
                    {visibleColumns.position && <th>Chức vụ</th>}
                    {visibleColumns.status && <th>Trạng thái</th>}
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredUsers.map((user, index) => (
                    <tr key={user.userID}>
                      {visibleColumns.userID && <td className="record-stt">{index + 1}</td>}
                      {visibleColumns.userID && <td className="record-id">{user.userID}</td>}
                      {visibleColumns.fullName && <td className="record-name">{user.fullName || '--'}</td>}
                      {visibleColumns.role && <td className="record-role">{renderRoleBadge(user.role)}</td>}
                      {visibleColumns.email && <td className="record-email">{user.email || '--'}</td>}
                      {visibleColumns.phone && <td className="record-phone">{user.phone || '--'}</td>}
                      {visibleColumns.dateOfBirth && <td className="record-date">{formatDateOfBirth(user.dateOfBirth)}</td>}
                      {visibleColumns.gender && <td className="record-gender">{renderGenderBadge(user.gender)}</td>}
                      {visibleColumns.position && <td className="record-position">{user.position || '--'}</td>}
                      {visibleColumns.status && <td className="record-status">{renderStatusBadge(user.status)}</td>}
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

export default CustomerUsers;


