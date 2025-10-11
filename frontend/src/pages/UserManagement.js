import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../components/AdminLayout';
import Card, { CardTitle, CardContent, CardActions } from '../components/Card';
import Button from '../components/Button';
import Pagination from '../components/Pagination';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaUserPlus, FaKey } from 'react-icons/fa';

// Trang quản lý người dùng - lấy dữ liệu từ database
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State cho modal và form
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',
    position: '',
    role: 'employee',
    status: 'active',
    salaryRank: ''
  });

  // Danh sách chức vụ từ API
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/positions');
        const data = await res.json();
        if (!res.ok) throw new Error('Không tải được chức vụ');
        // API trả mảng trực tiếp
        setPositions(Array.isArray(data) ? data : (data.data || []));
      } catch (e) {
        console.warn('Không thể tải danh sách chức vụ:', e.message);
      }
    };
    fetchPositions();
  }, []);

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
    actions: true,  // Thêm cột thao tác
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
    { key: 'salaryRank', label: 'Lương cơ bản', width: '140px' },
    { key: 'role', label: 'Vai trò', width: '160px' },
    { key: 'status', label: 'Trạng thái', width: '150px' },
    { key: 'actions', label: 'Thao tác', width: '200px' },
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

  // Kiểm tra người dùng đã có tài khoản đăng nhập chưa (ẩn nút tạo tài khoản)
  const hasAccount = (user) => {
    // Ưu tiên cờ từ backend (đảm bảo chính xác, không cần username/password)
    if (user.hasAccount === 1 || user.hasAccount === true) return true;
    if (user.hasAccount === 0 || user.hasAccount === false) return false;

    // Dự phòng: suy luận nếu backend cũ không gửi cờ hasAccount
    const username = user.userName || user.username || user.accountUsername;
    const password = user.password || user.hashedPassword || user.pass;
    return Boolean(username && String(username).trim() && password && String(password).trim());
  };

  // Xử lý thay đổi trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Xử lý thay đổi số dòng hiển thị
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset về trang đầu
  };

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedUsers.slice(startIndex, endIndex);
  };

  // Tính tổng số trang
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

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

  // Hàm format ngày tháng theo định dạng dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Hàm convert từ dd/mm/yyyy sang yyyy-mm-dd cho input date
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // Nếu đã là format yyyy-mm-dd thì return luôn
    if (dateString.includes('-') && dateString.length === 10) {
      return dateString;
    }
    
    // Nếu là format dd/mm/yyyy thì convert
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Nếu là Date object hoặc ISO string
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Error parsing date:', e);
    }
    
    return '';
  };

  // Hàm convert từ yyyy-mm-dd sang dd/mm/yyyy cho hiển thị
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      console.error('Error formatting date:', e);
    }
    
    return '';
  };

  // Chuyển từ dd/mm/yyyy sang yyyy-mm-dd
  const parseDisplayDate = (display) => {
    if (!display) return '';
    const parts = display.split('/');
    if (parts.length !== 3) return '';
    const [d, m, y] = parts;
    if (!d || !m || !y) return '';
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  };


  // ===== Inline Calendar Dropdown (đẹp, hiển thị ngay dưới ô input) =====
  const monthNamesVi = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const weekNamesVi = ['T2','T3','T4','T5','T6','T7','CN'];
  const getDaysMatrix = (year, month) => {
    // month: 0-11
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const today = new Date();
  const [addCalOpen, setAddCalOpen] = useState(false);
  const [addCalYear, setAddCalYear] = useState(today.getFullYear());
  const [addCalMonth, setAddCalMonth] = useState(today.getMonth());
  const [editCalOpen, setEditCalOpen] = useState(false);
  const [editCalYear, setEditCalYear] = useState(today.getFullYear());
  const [editCalMonth, setEditCalMonth] = useState(today.getMonth());

  const openCalendarFor = (mode) => {
    const iso = formData.dateOfBirth;
    let base = today;
    if (iso) {
      const d = new Date(iso);
      if (!isNaN(d.getTime())) base = d;
    }
    if (mode === 'add') {
      setAddCalYear(base.getFullYear());
      setAddCalMonth(base.getMonth());
      setAddCalOpen(true);
    } else {
      setEditCalYear(base.getFullYear());
      setEditCalMonth(base.getMonth());
      setEditCalOpen(true);
    }
  };

  const pickCalendarDate = (day, mode) => {
    if (!day) return;
    const y = mode === 'add' ? addCalYear : editCalYear;
    const m = mode === 'add' ? addCalMonth : editCalMonth; // 0-11
    const iso = `${y}-${String(m + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setFormData({ ...formData, dateOfBirth: iso });
    mode === 'add' ? setAddCalOpen(false) : setEditCalOpen(false);
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male',
      address: '',
      position: '',
      role: 'employee',
      status: 'active'
    });
  };

  // Mở modal thêm user
  const handleAddUser = () => {
    resetFormData();
    setShowAddModal(true);
  };

  // Mở modal sửa user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      dateOfBirth: formatDateForInput(user.dateOfBirth) || '',
      gender: user.gender || 'male',
      address: user.address || '',
      position: user.position || '',
      salaryRank: user.salaryRank ?? '',
      role: user.role || 'employee',
      status: user.status || 'active'
    });
    setShowEditModal(true);
  };

  // Mở modal tạo tài khoản
  const handleCreateAccount = (user) => {
    setSelectedUser(user);
    setShowAccountModal(true);
  };

  // Mở modal cấp lại mật khẩu
  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  // Xóa user
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.fullName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${user.userID}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Xóa người dùng thành công');
        fetchUsers(); // Refresh danh sách
      } else {
        toast.error(data.message || 'Lỗi khi xóa người dùng');
      }
    } catch (err) {
      console.error('Lỗi khi xóa user:', err);
      toast.error('Lỗi khi xóa người dùng');
    }
  };

  // Submit form thêm user
  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? formatDateForDisplay(formData.dateOfBirth) : null
      };

      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Thêm người dùng thành công');
        setShowAddModal(false);
        fetchUsers(); // Refresh danh sách
      } else {
        toast.error(data.message || 'Lỗi khi thêm người dùng');
      }
    } catch (err) {
      console.error('Lỗi khi thêm user:', err);
      toast.error('Lỗi khi thêm người dùng');
    }
  };

  // Submit form sửa user
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? formatDateForDisplay(formData.dateOfBirth) : null
      };

      const response = await fetch(`http://localhost:3001/api/users/${selectedUser.userID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cập nhật người dùng thành công');
        setShowEditModal(false);
        fetchUsers(); // Refresh danh sách
      } else {
        toast.error(data.message || 'Lỗi khi cập nhật người dùng');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật user:', err);
      toast.error('Lỗi khi cập nhật người dùng');
    }
  };

  // Submit form tạo tài khoản
  const handleSubmitAccount = async (e) => {
    e.preventDefault();
    
    const username = e.target.username.value;
    const password = e.target.password.value;

    if (!username || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${selectedUser.userID}/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Tạo tài khoản thành công');
        setShowAccountModal(false);
        fetchUsers(); // Refresh danh sách
      } else {
        toast.error(data.message || 'Lỗi khi tạo tài khoản');
      }
    } catch (err) {
      console.error('Lỗi khi tạo tài khoản:', err);
      toast.error('Lỗi khi tạo tài khoản');
    }
  };

  // Submit form cấp lại mật khẩu
  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    
    const password = e.target.password.value;

    if (!password) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${selectedUser.userID}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cấp lại mật khẩu thành công');
        setShowPasswordModal(false);
      } else {
        toast.error(data.message || 'Lỗi khi cấp lại mật khẩu');
      }
    } catch (err) {
      console.error('Lỗi khi cấp lại mật khẩu:', err);
      toast.error('Lỗi khi cấp lại mật khẩu');
    }
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

  // Định dạng tiền tệ VND cho lương cơ bản
  const formatCurrencyVND = (value) => {
    if (value === null || value === undefined || value === '') return '--';
    try {
      const num = Number(value);
      if (isNaN(num)) return '--';
      return num.toLocaleString('vi-VN');
    } catch (_) {
      return String(value);
    }
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
      <div className="stats-section">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Thống kê tổng quan</h2>
              <p className="text-sm text-gray-500 mt-1">Tổng hợp thông tin về người dùng trong hệ thống</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tổng người dùng */}
          <Card className="stat-card stat-card-primary">
            <CardContent className="p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">Tổng người dùng</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{users.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Tất cả người dùng</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-full mt-2 sm:mt-0 self-start">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quản trị viên */}
          <Card className="stat-card stat-card-success">
            <CardContent className="p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">Quản trị viên</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'admin').length}</p>
                  <p className="text-xs text-gray-500 mt-1">Người quản trị</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-full mt-2 sm:mt-0 self-start">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nhân viên */}
          <Card className="stat-card stat-card-info">
            <CardContent className="p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-indigo-600 mb-1">Nhân viên</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'employee').length}</p>
                  <p className="text-xs text-gray-500 mt-1">Người dùng thường</p>
                </div>
                <div className="p-2 sm:p-3 bg-indigo-100 rounded-full mt-2 sm:mt-0 self-start">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Đang hoạt động */}
          <Card className="stat-card stat-card-warning">
            <CardContent className="p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-orange-600 mb-1">Đang hoạt động</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{users.filter(u => u.status === 'active').length}</p>
                  <p className="text-xs text-gray-500 mt-1">Người dùng hoạt động</p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-100 rounded-full mt-2 sm:mt-0 self-start">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <CardTitle level="h2" className="text-lg font-semibold text-gray-900">Cài đặt hiển thị cột</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Chọn các cột bạn muốn hiển thị trong bảng</p>
            </div>
          </div>
          <Button onClick={showAllColumns} variant="outline" size="sm" className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Hiện tất cả</span>
          </Button>
        </div>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {columnDefinitions.map((column) => (
              <div key={column.key} className="column-toggle-item">
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={visibleColumns[column.key]}
                      onChange={() => toggleColumn(column.key)}
                      className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 transition-all duration-200"
                    />
                    {visibleColumns[column.key] && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors duration-200">
                      {column.label}
                    </span>
                  </div>
                  <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    visibleColumns[column.key] ? 'bg-green-400' : 'bg-gray-300'
                  }`}></div>
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bảng dữ liệu */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle level="h2" className="text-lg">
            Danh sách người dùng ({sortedUsers.length})
          </CardTitle>
          <Button onClick={handleAddUser} variant="primary" className="flex items-center space-x-2">
            <FaPlus className="w-4 h-4" />
            <span>Thêm người dùng</span>
          </Button>
        </div>
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
                  getPaginatedData().map((user, index) => (
                    <tr key={user.userID} className="border-b border-gray-100 hover:bg-gray-50">
                      {columnDefinitions
                        .filter(column => visibleColumns[column.key])
                        .map((column) => {
                          // Render cell content based on column type
                          switch (column.key) {
                            case 'stt':
                              return (
                                <td key={column.key} className="py-3 px-4 text-gray-600">
                                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</span>
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
                            case 'salaryRank':
                              return <td key={column.key} className="py-3 px-4 text-gray-700">{formatCurrencyVND(user.salaryRank)}</td>;
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
                            case 'actions':
                              return (
                                <td key={column.key} className="py-3 px-4">
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      onClick={() => handleEditUser(user)} 
                                      variant="outline" 
                                      size="sm"
                                      className="flex items-center justify-center w-10 h-10 p-0"
                                      title="Chỉnh sửa thông tin người dùng"
                                    >
                                      <FaEdit className="w-5 h-5" />
                                    </Button>
                                    {!hasAccount(user) && (
                                      <Button 
                                        onClick={() => handleCreateAccount(user)} 
                                        variant="primary" 
                                        size="sm"
                                        className="flex items-center justify-center w-10 h-10 p-0"
                                        title="Tạo tài khoản đăng nhập"
                                      >
                                        <FaUserPlus className="w-5 h-5" />
                                      </Button>
                                    )}
                                    {hasAccount(user) && (
                                      <Button 
                                        onClick={() => handleResetPassword(user)} 
                                        variant="outline" 
                                        size="sm"
                                        className="flex items-center justify-center w-10 h-10 p-0"
                                        title="Cấp lại mật khẩu"
                                      >
                                        <FaKey className="w-5 h-5" />
                                      </Button>
                                    )}
                                    {user.role !== 'admin' && (
                                      <Button 
                                        onClick={() => handleDeleteUser(user)} 
                                        variant="outline" 
                                        size="sm"
                                        className="flex items-center justify-center w-10 h-10 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                                        title="Xóa người dùng"
                                      >
                                        <FaTrash className="w-5 h-5" />
                                      </Button>
                                    )}
                                  </div>
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

      {/* Phân trang */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        totalItems={sortedUsers.length}
        itemsPerPageOptions={[5, 10, 20, 50]}
      />

      {/* Modal thêm người dùng */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onMouseDown={(e)=>{ if(e.target===e.currentTarget) setShowAddModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onMouseDown={(e)=>e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <FaUserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Thêm người dùng mới</h3>
                  <p className="text-blue-100 mt-1">Nhập thông tin chi tiết của người dùng</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAdd} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Họ tên */}
                <div className="space-y-2">
                  <label htmlFor="addFullName" className="block text-sm font-semibold text-gray-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="addFullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Nhập họ và tên đầy đủ"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="addEmail" className="block text-sm font-semibold text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="addEmail"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="example@company.com"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Số điện thoại */}
                <div className="space-y-2">
                  <label htmlFor="addPhone" className="block text-sm font-semibold text-gray-700">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="addPhone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="0123456789"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Ngày sinh */}
                <div className="space-y-2">
                  <label htmlFor="addDateOfBirth" className="block text-sm font-semibold text-gray-700">
                    Ngày sinh
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <input
                      type="text"
                      inputMode="numeric"
                      id="addDateOfBirth"
                      value={formData.dateOfBirth ? formatDateForDisplay(formData.dateOfBirth) : ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        // Chuẩn hóa dd/mm/yyyy khi gõ
                        const cleaned = v.replace(/[^0-9/]/g, '');
                        // Lưu tạm ở dạng yyyy-mm-dd cho backend
                        const iso = parseDisplayDate(cleaned);
                        setFormData({ ...formData, dateOfBirth: iso });
                      }}
                      onClick={() => openCalendarFor('add')}
                      onFocus={() => {
                        // Mở lịch và nếu đang trống thì gợi ý bằng hôm nay
                        openCalendarFor('add');
                        if (!formData.dateOfBirth) {
                          const today = new Date();
                          const dd = String(today.getDate()).padStart(2, '0');
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          const yyyy = today.getFullYear();
                          const iso = `${yyyy}-${mm}-${dd}`;
                          setFormData({ ...formData, dateOfBirth: iso });
                        }
                      }}
                      placeholder="dd/mm/yyyy"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      />
                      {/* Calendar dropdown for Add */}
                      <div className={`${addCalOpen ? 'block' : 'hidden'} absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg`}
                           onMouseDown={(e)=>e.preventDefault()}>
                        <div className="flex items-center justify-between px-3 py-2 border-b">
                          <button type="button" className="px-2 py-1 text-gray-600 hover:text-gray-900"
                            onClick={() => { let m=addCalMonth-1, y=addCalYear; if(m<0){m=11;y--;} setAddCalMonth(m); setAddCalYear(y); }}>&lt;</button>
                          <div className="text-sm font-semibold text-gray-800">{monthNamesVi[addCalMonth]} {addCalYear}</div>
                          <button type="button" className="px-2 py-1 text-gray-600 hover:text-gray-900"
                            onClick={() => { let m=addCalMonth+1, y=addCalYear; if(m>11){m=0;y++;} setAddCalMonth(m); setAddCalYear(y); }}>&gt;</button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 p-2 text-center text-xs text-gray-500">
                          {weekNamesVi.map(d => (<div key={d} className="py-1">{d}</div>))}
                          {getDaysMatrix(addCalYear, addCalMonth).map((d, idx) => (
                            <button key={idx} type="button" disabled={!d}
                              className={`py-2 rounded-md ${d? 'hover:bg-blue-50' : 'opacity-40 cursor-default'}`}
                              onClick={() => pickCalendarDate(d, 'add')}>{d || ''}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Đã bỏ dòng hiển thị để tránh trùng nội dung */}
                </div>

                {/* Giới tính */}
                <div className="space-y-2">
                  <label htmlFor="addGender" className="block text-sm font-semibold text-gray-700">
                    Giới tính
                  </label>
                  <div className="relative">
                    <select
                      id="addGender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Chức vụ - chọn từ danh sách có sẵn */}
                <div className="space-y-2">
                  <label htmlFor="addPosition" className="block text-sm font-semibold text-gray-700">
                    Chức vụ
                  </label>
                  <div className="relative">
                    <select
                      id="addPosition"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                    >
                      <option value="">-- Chọn chức vụ --</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.title}>{p.title}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Lương cơ bản (salaryRank) */}
                <div className="space-y-2">
                  <label htmlFor="addSalary" className="block text-sm font-semibold text-gray-700">
                    Lương cơ bản
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="addSalary"
                      value={formData.salaryRank}
                      onChange={(e) => setFormData({ ...formData, salaryRank: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Nhập lương cơ bản"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12V4m0 16v-2" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Vai trò */}
                <div className="space-y-2">
                  <label htmlFor="addRole" className="block text-sm font-semibold text-gray-700">
                    Vai trò
                  </label>
                  <div className="relative">
                    <select
                      id="addRole"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                    >
                      <option value="employee">Nhân viên</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Trạng thái: mặc định Hoạt động, ẩn chọn trong form thêm */}
                <input type="hidden" value={formData.status} readOnly />
              </div>

              {/* Địa chỉ */}
              <div className="mt-6 space-y-2">
                <label htmlFor="addAddress" className="block text-sm font-semibold text-gray-700">
                  Địa chỉ
                </label>
                <div className="relative">
                  <textarea
                    id="addAddress"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                    placeholder="Nhập địa chỉ chi tiết"
                  />
                  <div className="absolute top-3 right-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Thêm người dùng
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal sửa người dùng */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onMouseDown={(e)=>{ if(e.target===e.currentTarget) setShowEditModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onMouseDown={(e)=>e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <FaEdit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Chỉnh sửa thông tin</h3>
                  <p className="text-green-100 mt-1">Cập nhật thông tin cho {selectedUser?.fullName}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitEdit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Họ tên */}
                <div className="space-y-2">
                  <label htmlFor="editFullName" className="block text-sm font-semibold text-gray-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="editFullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Nhập họ và tên đầy đủ"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="editEmail" className="block text-sm font-semibold text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="editEmail"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="example@company.com"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Số điện thoại */}
                <div className="space-y-2">
                  <label htmlFor="editPhone" className="block text-sm font-semibold text-gray-700">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="editPhone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="0123456789"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Ngày sinh */}
                <div className="space-y-2">
                  <label htmlFor="editDateOfBirth" className="block text-sm font-semibold text-gray-700">
                    Ngày sinh
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <input
                      type="text"
                      inputMode="numeric"
                      id="editDateOfBirth"
                      value={formData.dateOfBirth ? formatDateForDisplay(formData.dateOfBirth) : ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        const cleaned = v.replace(/[^0-9/]/g, '');
                        const iso = parseDisplayDate(cleaned);
                        setFormData({ ...formData, dateOfBirth: iso });
                      }}
                      onFocus={() => openCalendarFor('edit')}
                      onClick={() => openCalendarFor('edit')}
                      placeholder="dd/mm/yyyy"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      />
                      {/* Calendar dropdown for Edit */}
                      <div className={`${editCalOpen ? 'block' : 'hidden'} absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg`}
                           onMouseDown={(e)=>e.preventDefault()}>
                        <div className="flex items-center justify-between px-3 py-2 border-b">
                          <button type="button" className="px-2 py-1 text-gray-600 hover:text-gray-900"
                            onClick={() => { let m=editCalMonth-1, y=editCalYear; if(m<0){m=11;y--;} setEditCalMonth(m); setEditCalYear(y); }}>&lt;</button>
                          <div className="text-sm font-semibold text-gray-800">{monthNamesVi[editCalMonth]} {editCalYear}</div>
                          <button type="button" className="px-2 py-1 text-gray-600 hover:text-gray-900"
                            onClick={() => { let m=editCalMonth+1, y=editCalYear; if(m>11){m=0;y++;} setEditCalMonth(m); setEditCalYear(y); }}>&gt;</button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 p-2 text-center text-xs text-gray-500">
                          {weekNamesVi.map(d => (<div key={d} className="py-1">{d}</div>))}
                          {getDaysMatrix(editCalYear, editCalMonth).map((d, idx) => (
                            <button key={idx} type="button" disabled={!d}
                              className={`py-2 rounded-md ${d? 'hover:bg-emerald-50' : 'opacity-40 cursor-default'}`}
                              onClick={() => pickCalendarDate(d, 'edit')}>{d || ''}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Đã bỏ dòng hiển thị để tránh trùng nội dung */}
                </div>

                {/* Giới tính */}
                <div className="space-y-2">
                  <label htmlFor="editGender" className="block text-sm font-semibold text-gray-700">
                    Giới tính
                  </label>
                  <div className="relative">
                    <select
                      id="editGender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Chức vụ - chuyển sang dropdown lấy từ API để tránh nhập sai */}
                <div className="space-y-2">
                  <label htmlFor="editPosition" className="block text-sm font-semibold text-gray-700">
                    Chức vụ
                  </label>
                  <div className="relative">
                    <select
                      id="editPosition"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                    >
                      <option value="">-- Chọn chức vụ --</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.title}>{p.title}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Lương cơ bản (salaryRank) */}
                <div className="space-y-2">
                  <label htmlFor="editSalary" className="block text-sm font-semibold text-gray-700">
                    Lương cơ bản
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="editSalary"
                      value={formData.salaryRank}
                      onChange={(e) => setFormData({ ...formData, salaryRank: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Nhập lương cơ bản"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12V4m0 16v-2" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Vai trò */}
                <div className="space-y-2">
                  <label htmlFor="editRole" className="block text-sm font-semibold text-gray-700">
                    Vai trò
                  </label>
                  <div className="relative">
                    <select
                      id="editRole"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                    >
                      <option value="employee">Nhân viên</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Trạng thái */}
                <div className="space-y-2">
                  <label htmlFor="editStatus" className="block text-sm font-semibold text-gray-700">
                    Trạng thái
                  </label>
                  <div className="relative">
                    <select
                      id="editStatus"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="mt-6 space-y-2">
                <label htmlFor="editAddress" className="block text-sm font-semibold text-gray-700">
                  Địa chỉ
                </label>
                <div className="relative">
                  <textarea
                    id="editAddress"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                    placeholder="Nhập địa chỉ chi tiết"
                  />
                  <div className="absolute top-3 right-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal tạo tài khoản */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onMouseDown={(e)=>{ if(e.target===e.currentTarget) setShowAccountModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onMouseDown={(e)=>e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <FaUserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Tạo tài khoản</h3>
                  <p className="text-blue-100 mt-1">Cho {selectedUser?.fullName}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAccount} className="p-8">
              <div className="space-y-6">
                {/* Tên đăng nhập */}
                <div className="space-y-2">
                  <label htmlFor="accountUsername" className="block text-sm font-semibold text-gray-700">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="accountUsername"
                      name="username"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Nhập tên đăng nhập"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Mật khẩu */}
                <div className="space-y-2">
                  <label htmlFor="accountPassword" className="block text-sm font-semibold text-gray-700">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="accountPassword"
                      name="password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Nhập mật khẩu"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAccountModal(false)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Tạo tài khoản
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal cấp lại mật khẩu */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onMouseDown={(e)=>{ if(e.target===e.currentTarget) setShowPasswordModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onMouseDown={(e)=>e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <FaKey className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Cấp lại mật khẩu</h3>
                  <p className="text-orange-100 mt-1">Cho {selectedUser?.fullName}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitPassword} className="p-8">
              <div className="space-y-6">
                {/* Mật khẩu mới */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Nhập mật khẩu mới"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPasswordModal(false)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Cấp lại mật khẩu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;