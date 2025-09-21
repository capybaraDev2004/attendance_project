import React, { useState, useEffect } from 'react';
import StandardTable from '../../../components/StandardTable';
import Card, { CardTitle, CardContent, CardActions } from '../../../components/Card';
import Button from '../../../components/Button';
import { toast } from 'react-toastify';
import { FaUserTie, FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaEye } from 'react-icons/fa';
import './Positions.css';

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [positionEmployees, setPositionEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // State cho việc bật/tắt cột
  const [visibleColumns, setVisibleColumns] = useState({
    stt: true,
    title: true,
    department: true,
    level: true,
    employeeCount: false,
    actualEmployeeCount: true,
    salary: true,
    status: true,
    actions: true
  });

  // Form state cho thêm/sửa chức vụ
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    department: '',
    level: '',
    description: '',
    status: 1,
    requirements: '',
    salaryMin: '',
    salaryMax: '',
    employeeCount: ''
  });

  useEffect(() => {
    // Gọi API để lấy danh sách chức vụ
    fetchPositions();
  }, []);

  // Hàm gọi API lấy danh sách chức vụ
  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/positions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Kiểm tra nếu response không phải JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server trả về dữ liệu không hợp lệ. Vui lòng kiểm tra API endpoint.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Ép kiểu các trường số để hiển thị đúng (đặc biệt là status)
      const normalized = Array.isArray(data)
        ? data.map((p) => ({
            ...p,
            status: typeof p.status === 'string' ? parseInt(p.status) : p.status,
            employeeCount: typeof p.employeeCount === 'string' ? parseInt(p.employeeCount) : p.employeeCount,
            actualEmployeeCount: typeof p.actualEmployeeCount === 'string' ? parseInt(p.actualEmployeeCount) : p.actualEmployeeCount,
            salaryMin: typeof p.salaryMin === 'string' ? parseInt(p.salaryMin) : p.salaryMin,
            salaryMax: typeof p.salaryMax === 'string' ? parseInt(p.salaryMax) : p.salaryMax,
          }))
        : data;
      setPositions(normalized);
    } catch (err) {
      let errorMessage = 'Lỗi khi tải danh sách chức vụ';
      
      if (err.message.includes('Unexpected token')) {
        errorMessage = 'API endpoint không tồn tại hoặc server chưa khởi động. Vui lòng kiểm tra backend.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      console.error('Lỗi fetch positions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy danh sách nhân viên theo chức vụ
  const fetchEmployeesByPosition = async (positionId) => {
    setLoadingEmployees(true);
    try {
      const response = await fetch(`http://localhost:3001/api/positions/${positionId}/employees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPositionEmployees(data.employees);
      setSelectedPosition(data.position);
    } catch (err) {
      console.error('Lỗi fetch employees:', err);
      toast.error(err.message || 'Có lỗi xảy ra khi tải danh sách nhân viên');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleAddPosition = () => {
    setFormData({
      title: '',
      code: '',
      department: '',
      level: '',
      description: '',
      status: 1,
      requirements: '',
      salaryMin: '',
      salaryMax: '',
      employeeCount: ''
    });
    setShowAddModal(true);
  };

  const handleEditPosition = (position) => {
    setSelectedPosition(position);
    setFormData({
      title: position.title,
      code: position.code,
      department: position.department,
      level: position.level,
      description: position.description,
      status: position.status,
      requirements: position.requirements || '',
      salaryMin: position.salaryMin || '',
      salaryMax: position.salaryMax || '',
      employeeCount: position.employeeCount ?? ''
    });
    setShowEditModal(true);
  };

  // Hàm xem chi tiết nhân viên
  const handleViewDetails = async (position) => {
    await fetchEmployeesByPosition(position.id);
    setShowDetailModal(true);
  };

  // Hàm xóa chức vụ
  const handleDeletePosition = async (positionId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chức vụ này? Hành động này không thể hoàn tác.')) {
      try {
        const response = await fetch(`http://localhost:3001/api/positions/${positionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        // Cập nhật danh sách sau khi xóa thành công
        setPositions(positions.filter(position => position.id !== positionId));
        toast.success('Xóa chức vụ thành công');
      } catch (err) {
        console.error('Lỗi xóa chức vụ:', err);
        toast.error(err.message || 'Có lỗi xảy ra khi xóa chức vụ');
      }
    }
  };

  // Hàm submit form thêm/sửa chức vụ
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const positionData = {
        title: formData.title,
        code: formData.code,
        department: formData.department,
        level: formData.level,
        description: formData.description,
        status: parseInt(formData.status),
        requirements: formData.requirements,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        employeeCount: formData.employeeCount !== '' ? parseInt(formData.employeeCount) : 0
      };

      if (showAddModal) {
        // Thêm chức vụ mới
        const response = await fetch('http://localhost:3001/api/positions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(positionData)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const newPosition = await response.json();
        setPositions([...positions, newPosition]);
        setShowAddModal(false);
        toast.success('Thêm chức vụ thành công');
      } else {
        // Xác nhận trước khi cập nhật
        const confirmed = window.confirm('Bạn có chắc muốn cập nhật thông tin chức vụ này?');
        if (!confirmed) return;

        // Cập nhật chức vụ
        const response = await fetch(`http://localhost:3001/api/positions/${selectedPosition.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(positionData)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const updatedPosition = await response.json();
        const updatedPositions = positions.map(position => 
          position.id === selectedPosition.id ? updatedPosition : position
        );
        
        setPositions(updatedPositions);
        setShowEditModal(false);
        setSelectedPosition(null);
        toast.success('Cập nhật chức vụ thành công');
      }
      
      // Reset form
      setFormData({
        title: '',
        code: '',
        department: '',
        level: '',
        description: '',
        status: 1,
        requirements: '',
        salaryMin: '',
        salaryMax: '',
        employeeCount: ''
      });
    } catch (err) {
      console.error('Lỗi lưu chức vụ:', err);
      toast.error(err.message || 'Có lỗi xảy ra khi lưu chức vụ');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDetailModal(false);
    setSelectedPosition(null);
    setPositionEmployees([]);
    setFormData({
      title: '',
      code: '',
      department: '',
      level: '',
      description: '',
      status: 1,
      requirements: '',
      salaryMin: '',
      salaryMax: ''
    });
  };

  // Lọc chức vụ theo trạng thái và tìm kiếm
  const filteredPositions = positions.filter(position => {
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && position.status === 1) ||
                         (filterStatus === 'inactive' && position.status === 0);
    const matchesSearch = position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Thống kê
  const totalPositions = positions.length;
  const activePositions = positions.filter(p => p.status === 1).length;
  const inactivePositions = positions.filter(p => p.status === 0).length;
  const totalEmployees = positions.reduce((sum, p) => sum + (p.employeeCount || 0), 0);
  const totalActualEmployees = positions.reduce((sum, p) => sum + (p.actualEmployeeCount || 0), 0);

  // Format trạng thái
  const formatStatus = (status) => {
    // Quy ước: 1 = Đang sử dụng, 0 = Tạm ngưng
    return status === 1 ? 'Đang sử dụng' : 'Tạm ngưng';
  };

  // Format cấp độ
  const formatLevel = (level) => {
    switch (level) {
      case 'Senior Level': return 'Cấp cao';
      case 'Mid Level': return 'Cấp trung';
      case 'Entry Level': return 'Cấp cơ bản';
      default: return level || 'Không xác định';
    }
  };

  // Format mức lương
  const formatSalary = (salaryMin, salaryMax) => {
    if (salaryMin && salaryMax) {
      return `${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()} VNĐ`;
    } else if (salaryMin) {
      return `Từ ${salaryMin.toLocaleString()} VNĐ`;
    } else if (salaryMax) {
      return `Đến ${salaryMax.toLocaleString()} VNĐ`;
    }
    return 'Chưa xác định';
  };

  // Format ngày sinh
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Format giới tính
  const formatGender = (gender) => {
    switch (gender) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      case 'other': return 'Khác';
      default: return 'Chưa cập nhật';
    }
  };

  // Định nghĩa các cột có thể ẩn/hiện
  const columnDefinitions = [
    { key: 'stt', label: 'STT', width: '60px' },
    { key: 'title', label: 'Chức vụ', width: '200px' },
    { key: 'department', label: 'Phòng ban', width: '150px' },
    { key: 'level', label: 'Cấp độ', width: '120px' },
    { key: 'employeeCount', label: 'Nhân viên dự kiến', width: '150px' },
    { key: 'actualEmployeeCount', label: 'Nhân viên thực tế', width: '150px' },
    { key: 'salary', label: 'Mức lương', width: '200px' },
    { key: 'status', label: 'Trạng thái', width: '120px' },
    { key: 'actions', label: 'Thao tác', width: '100px' }
  ];

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

  // Định nghĩa cột cho bảng - chỉ hiển thị các cột được chọn
  const tableColumns = columnDefinitions
    .filter(column => visibleColumns[column.key])
    .map(column => {
      switch (column.key) {
        case 'stt':
          return {
            key: 'stt',
            label: 'STT',
            visible: true,
            render: (_, index) => index + 1
          };
        case 'title':
          return {
            key: 'title',
            label: 'Chức vụ',
            visible: true,
            render: (position) => (
              <div>
                <div className="text-sm font-medium text-gray-900">{position.title}</div>
                <div className="text-sm text-gray-500">{position.code}</div>
              </div>
            )
          };
        case 'department':
          return {
            key: 'department',
            label: 'Phòng ban',
            visible: true,
            render: (position) => position.department
          };
        case 'level':
          return {
            key: 'level',
            label: 'Cấp độ',
            visible: true,
            render: (position) => (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {formatLevel(position.level)}
              </span>
            )
          };
        case 'employeeCount':
          return {
            key: 'employeeCount',
            label: 'Nhân viên dự kiến',
            visible: true,
            render: (position) => (
              <span className="font-medium">{position.employeeCount || 0}</span>
            )
          };
        case 'actualEmployeeCount':
          return {
            key: 'actualEmployeeCount',
            label: 'Nhân viên thực tế',
            visible: true,
            render: (position) => (
              <span className="font-medium">{position.actualEmployeeCount || 0}</span>
            )
          };
        case 'salary':
          return {
            key: 'salary',
            label: 'Mức lương',
            visible: true,
            render: (position) => formatSalary(position.salaryMin, position.salaryMax)
          };
        case 'status':
          return {
            key: 'status',
            label: 'Trạng thái',
            visible: true,
            render: (position) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                position.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {formatStatus(position.status)}
              </span>
            )
          };
        case 'actions':
          return {
            key: 'actions',
            label: 'Thao tác',
            visible: true,
            render: (position) => (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewDetails(position)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Xem chi tiết"
                >
                  <FaEye size={14} />
                </button>
                <button
                  onClick={() => handleEditPosition(position)}
                  className="text-green-600 hover:text-green-800 transition-colors"
                  title="Chỉnh sửa"
                >
                  <FaEdit size={14} />
                </button>
                <button
                  onClick={() => handleDeletePosition(position.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Xóa"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            )
          };
        default:
          return null;
      }
    })
    .filter(Boolean);


  if (loading) {
    return (
      <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaUserTie className="text-blue-600 text-xl" />
                </div>
                <div>
                  <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                    Quản lý chức vụ
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Quản lý các chức vụ và vị trí công việc trong công ty
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <div className="loading-spinner"></div>
                <p className="mt-4 text-gray-600">Đang tải danh sách chức vụ...</p>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaUserTie className="text-blue-600 text-xl" />
                </div>
                <div>
                  <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                    Quản lý chức vụ
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Quản lý các chức vụ và vị trí công việc trong công ty
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Đã xảy ra lỗi</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="flex justify-center space-x-3">
                  <Button onClick={fetchPositions} variant="primary">
                    Thử lại
                  </Button>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Tải lại trang
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
                <FaUserTie className="text-blue-600 text-xl" />
              </div>
              <div>
                <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                  Quản lý chức vụ
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Quản lý các chức vụ và vị trí công việc trong công ty
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
                  placeholder="Tìm kiếm theo tên chức vụ, mã chức vụ hoặc phòng ban..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang sử dụng</option>
                  <option value="inactive">Tạm ngưng</option>
                </select>
              </div>
            </div>
          </CardContent>
          <CardActions>
            <Button onClick={fetchPositions} variant="outline" size="sm">
              Làm mới
            </Button>
          </CardActions>
        </Card>

        {/* Cài đặt hiển thị cột */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <CardTitle level="h2" className="text-lg">Cài đặt hiển thị cột</CardTitle>
            <Button onClick={showAllColumns} variant="outline" size="sm">
              Hiện tất cả
            </Button>
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

        {/* Thống kê */}
        <div className="stats-section">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="text-center">
                <div className="stat-number">{totalPositions}</div>
                <div className="stat-label">Tổng chức vụ</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <div className="stat-number">{activePositions}</div>
                <div className="stat-label">Đang sử dụng</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <div className="stat-number">{inactivePositions}</div>
                <div className="stat-label">Tạm ngưng</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <div className="stat-number">{totalEmployees}</div>
                <div className="stat-label">Tổng nhân viên dự kiến</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <div className="stat-number">{totalActualEmployees}</div>
                <div className="stat-label">Tổng nhân viên thực tế</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Danh sách chức vụ */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Danh sách chức vụ</h3>
              <p className="text-sm text-gray-600 mt-1">Tổng cộng: {filteredPositions.length} chức vụ</p>
            </div>
            <Button onClick={handleAddPosition} variant="primary" icon={<FaPlus />}>
              Thêm chức vụ
            </Button>
          </div>
        </div>

        <StandardTable
          title="Danh sách chức vụ"
          subtitle={`Tổng cộng: ${filteredPositions.length} chức vụ`}
          icon={FaUserTie}
          columns={tableColumns}
          data={filteredPositions}
          emptyState={
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FaUserTie size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy chức vụ nào</h3>
              <p className="text-gray-600">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          }
        />

        {/* Modal thêm chức vụ */}
        {showAddModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Thêm chức vụ mới</h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên chức vụ *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập tên chức vụ"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Mã chức vụ *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập mã chức vụ"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Phòng ban *</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập phòng ban"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Cấp độ *</label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Chọn cấp độ</option>
                      <option value="Senior Level">Cấp cao</option>
                      <option value="Mid Level">Cấp trung</option>
                      <option value="Entry Level">Cấp cơ bản</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Mô tả chức vụ</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chi tiết về chức vụ và trách nhiệm"
                    rows="3"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Yêu cầu</label>
                    <textarea
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleInputChange}
                      placeholder="Yêu cầu về kinh nghiệm, kỹ năng, bằng cấp"
                      rows="3"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Mức lương tối thiểu</label>
                    <input
                      type="number"
                      name="salaryMin"
                      value={formData.salaryMin}
                      onChange={handleInputChange}
                      placeholder="Nhập mức lương tối thiểu"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Mức lương tối đa</label>
                    <input
                      type="number"
                      name="salaryMax"
                      value={formData.salaryMax}
                      onChange={handleInputChange}
                      placeholder="Nhập mức lương tối đa"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Số nhân viên dự kiến</label>
                    <input
                      type="number"
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleInputChange}
                      placeholder="Nhập số nhân viên dự kiến"
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value={1}>Đang sử dụng</option>
                      <option value={0}>Tạm ngưng</option>
                    </select>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <Button type="button" onClick={closeModal} variant="outline">
                    Hủy
                  </Button>
                  <Button type="submit" variant="primary">
                    Thêm chức vụ
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal sửa chức vụ */}
        {showEditModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Sửa chức vụ</h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên chức vụ *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập tên chức vụ"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Mã chức vụ *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập mã chức vụ"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Phòng ban *</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập phòng ban"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Cấp độ *</label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Chọn cấp độ</option>
                      <option value="Senior Level">Cấp cao</option>
                      <option value="Mid Level">Cấp trung</option>
                      <option value="Entry Level">Cấp cơ bản</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Mô tả chức vụ</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chi tiết về chức vụ và trách nhiệm"
                    rows="3"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Yêu cầu</label>
                    <textarea
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleInputChange}
                      placeholder="Yêu cầu về kinh nghiệm, kỹ năng, bằng cấp"
                      rows="3"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Mức lương tối thiểu</label>
                    <input
                      type="number"
                      name="salaryMin"
                      value={formData.salaryMin}
                      onChange={handleInputChange}
                      placeholder="Nhập mức lương tối thiểu"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Mức lương tối đa</label>
                    <input
                      type="number"
                      name="salaryMax"
                      value={formData.salaryMax}
                      onChange={handleInputChange}
                      placeholder="Nhập mức lương tối đa"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Số nhân viên dự kiến</label>
                    <input
                      type="number"
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleInputChange}
                      placeholder="Nhập số nhân viên dự kiến"
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value={1}>Đang sử dụng</option>
                      <option value={0}>Tạm ngưng</option>
                    </select>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <Button type="button" onClick={closeModal} variant="outline">
                    Hủy
                  </Button>
                  <Button type="submit" variant="primary">
                    Cập nhật
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal xem chi tiết nhân viên */}
        {showDetailModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Chi tiết nhân viên - {selectedPosition?.title}</h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              <div className="modal-body">
                {loadingEmployees ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Đang tải danh sách nhân viên...</p>
                  </div>
                ) : (
                  <>
                    <div className="position-summary">
                      <h4>Thông tin chức vụ</h4>
                      <div className="summary-grid">
                        <div className="summary-item">
                          <span className="summary-label">Mã chức vụ:</span>
                          <span className="summary-value">{selectedPosition?.code}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Phòng ban:</span>
                          <span className="summary-value">{selectedPosition?.department}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Cấp độ:</span>
                          <span className="summary-value">{formatLevel(selectedPosition?.level)}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Số nhân viên dự kiến:</span>
                          <span className="summary-value">{selectedPosition?.employeeCount || 0}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Số nhân viên thực tế:</span>
                          <span className="summary-value">{positionEmployees.length}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Mức lương:</span>
                          <span className="summary-value">{formatSalary(selectedPosition?.salaryMin, selectedPosition?.salaryMax)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="employees-section">
                      <h4>Danh sách nhân viên ({positionEmployees.length} người)</h4>
                      {positionEmployees.length === 0 ? (
                        <div className="no-employees">
                          <p>Chưa có nhân viên nào được gán cho chức vụ này</p>
                        </div>
                      ) : (
                        <div className="employees-table">
                          <table className="employees-list">
                            <thead>
                              <tr>
                                <th>STT</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Ngày sinh</th>
                                <th>Giới tính</th>
                                <th>Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {positionEmployees.map((employee, index) => (
                                <tr key={employee.userID}>
                                  <td>{index + 1}</td>
                                  <td>
                                    <div className="employee-name">
                                      <strong>{employee.fullName}</strong>
                                      <small>@{employee.userName}</small>
                                    </div>
                                  </td>
                                  <td>{employee.email}</td>
                                  <td>{employee.phone || 'Chưa cập nhật'}</td>
                                  <td>{formatDate(employee.dateOfBirth)}</td>
                                  <td>{formatGender(employee.gender)}</td>
                                  <td>
                                    <span className={`status-badge status-${employee.status === 'active' ? 'active' : 'inactive'}`}>
                                      {employee.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              <div className="modal-footer">
                <Button onClick={closeModal} variant="outline">
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Positions;