import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import Card, { CardTitle, CardContent, CardActions } from '../components/Card';
import Button from '../components/Button';
import { FaUsers } from 'react-icons/fa';

// Trang quản lý người dùng - lấy dữ liệu từ database
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // State cho việc bật/tắt cột - cập nhật để khớp với dữ liệu thực tế
  const [visibleColumns, setVisibleColumns] = useState({
    stt: true,
    id: true,
    fullName: true,
    email: false,  // Bật email vì API có dữ liệu
    phone: false,
    dateOfBirth: false,  // Bật ngày sinh vì API có dữ liệu
    gender: false,
    address: true,
    position: true,
    role: true,
    status: true,
    created_at: false  // Bật ngày tạo vì API có dữ liệu
  });

  // Định nghĩa các cột có thể ẩn/hiện - thứ tự cột cố định
  const columnDefinitions = [
    { key: 'stt', label: 'STT', width: '60px' },
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'fullName', label: 'Họ tên', width: '150px' },
    { key: 'email', label: 'Email', width: '180px' },
    { key: 'phone', label: 'Số điện thoại', width: '130px' },
    { key: 'dateOfBirth', label: 'Ngày sinh', width: '110px' },
    { key: 'gender', label: 'Giới tính', width: '110px' },
    { key: 'address', label: 'Địa chỉ', width: '200px' },
    { key: 'position', label: 'Chức vụ', width: '140px' },
    { key: 'role', label: 'Vai trò', width: '160px' },
    { key: 'status', label: 'Trạng thái', width: '150px' },
    { key: 'created_at', label: 'Ngày tạo', width: '110px' }
  ];

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
        // Đảm bảo mỗi user có đầy đủ các trường cần thiết
        const processedUsers = data.users.map(user => ({
          ...user,
          status: user.status || 'active', // Mặc định là active nếu không có
          role: user.role || 'employee',   // Mặc định là employee nếu không có
          gender: user.gender || 'male'    // Mặc định là male nếu không có
        }));
        
        setUsers(processedUsers);
        console.log(`Đã tải ${processedUsers.length} người dùng`);
        console.log('Dữ liệu users đã xử lý:', processedUsers);
        // Log từng user để kiểm tra cấu trúc dữ liệu
        processedUsers.forEach((user, index) => {
          console.log(`User ${index + 1}:`, {
            userID: user.userID,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            address: user.address,
            position: user.position,
            role: user.role,
            status: user.status,
            created_at: user.created_at
          });
        });
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
    // Ưu tiên: active > inactive
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    
    // Thứ tự thứ 2: admin > employee
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    
    // Cuối cùng: sắp xếp theo tên
    return a.fullName.localeCompare(b.fullName);
  });



  // Hiện tất cả cột
  const showAllColumns = () => {
    const allVisible = {};
    columnDefinitions.forEach(column => {
      allVisible[column.key] = true;
    });
    setVisibleColumns(allVisible);
  };

  // Toggle hiển thị cột
  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  // Hàm format status
  const formatStatus = (status) => {
    // Kiểm tra nếu status không tồn tại hoặc null/undefined
    if (!status || status === '') {
      return 'Chưa xác định';
    }
    return status === 'active' ? 'Hoạt động' : 'Không hoạt động';
  };

  // Hàm format role
  const formatRole = (role) => {
    if (!role || role === '') {
      return 'Chưa xác định';
    }
    return role === 'admin' ? 'QUẢN TRỊ VIÊN' : 'NHÂN VIÊN';
  };

  // Hàm format gender
  const formatGender = (gender) => {
    if (!gender || gender === '') {
      return '--';
    }
    switch (gender) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      case 'other': return 'Khác';
      default: return '--';
    }
  };

  // Hàm format ngày tháng theo định dạng dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <AdminLayout
        title="Quản lý người dùng"
        subtitle="Quản lý thông tin và quyền hạn của người dùng trong hệ thống"
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
        title="Quản lý người dùng"
        subtitle="Quản lý thông tin và quyền hạn của người dùng trong hệ thống"
        icon={FaUsers}
      >
        <div className="error-container">
          <div className="error-card">
            <h3>Lỗi khi tải dữ liệu</h3>
            <p>{error}</p>
            <Button onClick={fetchUsers} variant="primary">
              Thử lại
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
              <div>
                <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                  Quản lý người dùng
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Quản lý thông tin và quyền hạn của người dùng trong hệ thống
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Bộ lọc và tìm kiếm */}
        <Card>
          <CardTitle level="h2" className="text-lg mb-4">Bộ lọc và tìm kiếm</CardTitle>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:w-48">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="admin">Quản trị viên</option>
                  <option value="employee">Nhân viên</option>
                </select>
              </div>
              <div className="md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
            </div>
          </CardContent>
          <CardActions>
            <Button onClick={fetchUsers} variant="outline" size="sm">
              Làm mới
            </Button>
          </CardActions>
        </Card>

        {/* Thống kê */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{users.length}</div>
              <div className="text-sm text-gray-600">Tổng người dùng</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{users.filter(u => u.role === 'admin').length}</div>
              <div className="text-sm text-gray-600">Quản trị viên</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{users.filter(u => u.role === 'employee').length}</div>
              <div className="text-sm text-gray-600">Nhân viên</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{users.filter(u => u.status === 'active').length}</div>
              <div className="text-sm text-gray-600">Đang hoạt động</div>
            </CardContent>
          </Card>
        </div>

        {/* Cài đặt hiển thị cột */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <CardTitle level="h2" className="text-lg">Cài đặt hiển thị cột</CardTitle>
            <CardActions>
              <Button onClick={showAllColumns} variant="outline" size="sm">
                Hiện tất cả
              </Button>
            </CardActions>
          </div>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {columnDefinitions.map((column) => (
                <label key={column.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleColumns[column.key]}
                    onChange={() => toggleColumn(column.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{column.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bảng dữ liệu */}
        <Card>
          <CardTitle level="h2" className="text-lg mb-4">
            Danh sách người dùng ({sortedUsers.length})
          </CardTitle>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {columnDefinitions
                      .filter(column => visibleColumns[column.key])
                      .map((column) => (
                        <th key={column.key} className="text-left py-3 px-4 font-medium text-gray-700">
                          {column.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={columnDefinitions.filter(col => visibleColumns[col.key]).length} className="text-center py-8 text-gray-500">
                        Không tìm thấy người dùng nào
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((user, index) => (
                      <tr key={user.userID} className="border-b border-gray-100 hover:bg-gray-50">
                        {columnDefinitions
                          .filter(column => visibleColumns[column.key])
                          .map((column) => {
                            // Render cell content based on column type
                            switch (column.key) {
                              case 'stt':
                                return (
                                  <td key={column.key} className="py-3 px-4 text-gray-600">
                                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{index + 1}</span>
                                  </td>
                                );
                              case 'id':
                                return <td key={column.key} className="py-3 px-4 text-gray-700">{user.userID}</td>;
                              case 'fullName':
                                return <td key={column.key} className="py-3 px-4 font-medium text-gray-900">{user.fullName}</td>;
                              case 'email':
                                return <td key={column.key} className="py-3 px-4 text-gray-700">{user.email}</td>;
                              case 'phone':
                                return <td key={column.key} className="py-3 px-4 text-gray-700">{user.phone || '--'}</td>;
                              case 'dateOfBirth':
                                return <td key={column.key} className="py-3 px-4 text-gray-700">{formatDate(user.dateOfBirth)}</td>;
                              case 'gender':
                                return (
                                  <td key={column.key} className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      user.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                                      user.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {formatGender(user.gender)}
                                    </span>
                                  </td>
                                );
                              case 'address':
                                return <td key={column.key} className="py-3 px-4 text-gray-700">{user.address || '--'}</td>;
                              case 'position':
                                return <td key={column.key} className="py-3 px-4 text-gray-700">{user.position || '--'}</td>;
                              case 'role':
                                return (
                                  <td key={column.key} className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {formatRole(user.role)}
                                    </span>
                                  </td>
                                );
                              case 'status':
                                return (
                                  <td key={column.key} className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {formatStatus(user.status)}
                                    </span>
                                  </td>
                                );
                              case 'created_at':
                                return <td key={column.key} className="py-3 px-4 text-gray-700">{formatDate(user.created_at)}</td>;
                              default:
                                return null;
                            }
                          })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;