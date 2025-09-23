import React, { useState, useEffect, useCallback } from 'react';
import StandardTable from '../../../components/StandardTable';
import Card, { CardTitle, CardContent } from '../../../components/Card';
import Pagination from '../../../components/Pagination';
import { IconUsers, IconSearch, IconFilter, IconRefresh, IconAlertCircle } from '@tabler/icons-react';

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

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Bộ lọc hiển thị cột
  const [visibleColumns, setVisibleColumns] = useState({
    stt: true,
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
    // Reset về trang đầu khi lọc
    setCurrentPage(1);
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

  const handleColumnToggle = useCallback((columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  }, []);

  // Xử lý thay đổi trang
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Xử lý thay đổi số dòng hiển thị
  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset về trang đầu
  }, []);

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const getPaginatedData = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Tính tổng số trang
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Badge trạng thái người dùng
  const renderStatusBadge = useCallback((status) => {
    if (status === 'active') {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span>;
    }
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Không hoạt động</span>;
  }, []);

  // Badge vai trò người dùng
  const renderRoleBadge = useCallback((role) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Quản trị</span>;
      case 'employee':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Nhân viên</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{role || 'Chưa xác định'}</span>;
    }
  }, []);

  // Badge giới tính
  const renderGenderBadge = useCallback((gender) => {
    switch (gender) {
      case 'male':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Nam</span>;
      case 'female':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-pink-100 text-pink-800">Nữ</span>;
      case 'other':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Khác</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">--</span>;
    }
  }, []);

  // Format ngày sinh
  const formatDateOfBirth = useCallback((dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }, []);

  // Định nghĩa cột cho bảng
  const tableColumns = [
    {
      key: 'stt',
      label: 'STT',
      visible: visibleColumns.stt,
      render: (_, index) => (currentPage - 1) * itemsPerPage + index + 1
    },
    {
      key: 'userID',
      label: 'ID',
      visible: visibleColumns.userID,
      render: (user) => <span className="font-medium">{user.userID}</span>
    },
    {
      key: 'fullName',
      label: 'Họ và tên',
      visible: visibleColumns.fullName,
      render: (user) => user.fullName || '--'
    },
    {
      key: 'role',
      label: 'Vai trò',
      visible: visibleColumns.role,
      render: (user) => renderRoleBadge(user.role)
    },
    {
      key: 'email',
      label: 'Email',
      visible: visibleColumns.email,
      render: (user) => user.email || '--'
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      visible: visibleColumns.phone,
      render: (user) => user.phone || '--'
    },
    {
      key: 'dateOfBirth',
      label: 'Ngày sinh',
      visible: visibleColumns.dateOfBirth,
      render: (user) => formatDateOfBirth(user.dateOfBirth)
    },
    {
      key: 'gender',
      label: 'Giới tính',
      visible: visibleColumns.gender,
      render: (user) => renderGenderBadge(user.gender)
    },
    {
      key: 'position',
      label: 'Chức vụ',
      visible: visibleColumns.position,
      render: (user) => user.position || '--'
    },
    {
      key: 'status',
      label: 'Trạng thái',
      visible: visibleColumns.status,
      render: (user) => renderStatusBadge(user.status)
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <IconUsers className="text-gray-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Danh sách người dùng</h1>
              <p className="text-gray-600 mt-1">Xem danh sách người dùng trong hệ thống</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <IconUsers className="text-gray-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Danh sách người dùng</h1>
              <p className="text-gray-600 mt-1">Xem danh sách người dùng trong hệ thống</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <IconAlertCircle className="text-red-600 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-red-900">Có lỗi xảy ra</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <IconRefresh className="mr-2" size={16} />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconUsers className="text-blue-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                Danh sách người dùng
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Xem danh sách người dùng trong hệ thống
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <IconFilter className="mr-2 text-green-600" size={20} />
            Bộ lọc và tìm kiếm
          </h3>
        </div>
        
        <div className="p-6">
          {/* Tìm kiếm */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Tìm kiếm</h4>
            <div className="flex space-x-3">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Tìm theo tên, username hoặc email..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <IconSearch className="mr-2" size={16} />
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Bộ lọc */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Bộ lọc</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái:</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò:</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="admin">Quản trị</option>
                  <option value="employee">Nhân viên</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Cài đặt hiển thị cột */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <CardTitle level="h3" className="text-lg font-semibold text-gray-900">Cài đặt hiển thị cột</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Chọn các cột bạn muốn hiển thị trong bảng</p>
            </div>
          </div>
        </div>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(visibleColumns).map(([column, isVisible]) => (
              <div key={column} className="column-toggle-item">
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => handleColumnToggle(column)}
                      className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 transition-all duration-200"
                    />
                    {isVisible && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors duration-200">
                      {column === 'stt' && 'STT'}
                      {column === 'userID' && 'ID'}
                      {column === 'fullName' && 'Họ và tên'}
                      {column === 'role' && 'Vai trò'}
                      {column === 'email' && 'Email'}
                      {column === 'phone' && 'Số điện thoại'}
                      {column === 'dateOfBirth' && 'Ngày sinh'}
                      {column === 'gender' && 'Giới tính'}
                      {column === 'position' && 'Chức vụ'}
                      {column === 'status' && 'Trạng thái'}
                    </span>
                  </div>
                  <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    isVisible ? 'bg-green-400' : 'bg-gray-300'
                  }`}></div>
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <StandardTable
        title="Danh sách người dùng"
        subtitle={`Tổng cộng: ${filteredUsers.length} người dùng`}
        icon={IconUsers}
        columns={tableColumns}
        data={getPaginatedData()}
        onRefresh={fetchUsers}
        emptyState={
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <IconUsers size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy người dùng</h3>
            <p className="text-gray-600">Vui lòng thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        }
      />

      {/* Phân trang */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        totalItems={filteredUsers.length}
        itemsPerPageOptions={[5, 10, 20, 50]}
      />
    </div>
  );
};

export default CustomerUsers;


