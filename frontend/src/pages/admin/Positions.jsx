import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminButton from '../../components/AdminButton';
import { toast } from 'react-toastify';
import { FaUserTie, FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaUsers } from 'react-icons/fa';
import './Positions.css';

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
    setSelectedPosition(null);
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

  if (loading) {
    return (
      <AdminLayout
        title="Quản lý chức vụ"
        subtitle="Quản lý các chức vụ và vị trí công việc trong công ty"
        icon={FaUserTie}
      >
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách chức vụ...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout
        title="Quản lý chức vụ"
        subtitle="Quản lý các chức vụ và vị trí công việc trong công ty"
        icon={FaUserTie}
      >
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h3>Đã xảy ra lỗi</h3>
          <p>{error}</p>
          <div style={{ marginTop: '20px' }}>
            <AdminButton onClick={fetchPositions} variant="primary" style={{ marginRight: '10px' }}>
              Thử lại
            </AdminButton>
            <AdminButton onClick={() => window.location.reload()} variant="outline">
              Tải lại trang
            </AdminButton>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Quản lý chức vụ"
      subtitle="Quản lý các chức vụ và vị trí công việc trong công ty"
      icon={FaUserTie}
    >
      <div className="positions-container">
        {/* Bộ lọc và tìm kiếm */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên chức vụ, mã chức vụ hoặc phòng ban..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label className="filter-label">Trạng thái:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang sử dụng</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
            
            <AdminButton onClick={fetchPositions} variant="outline" size="small">
              Làm mới
            </AdminButton>
          </div>
        </div>

        {/* Thống kê */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{totalPositions}</div>
            <div className="stat-label">Tổng chức vụ</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{activePositions}</div>
            <div className="stat-label">Đang sử dụng</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{inactivePositions}</div>
            <div className="stat-label">Tạm ngưng</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalEmployees}</div>
            <div className="stat-label">Tổng nhân viên</div>
          </div>
        </div>

        {/* Header và nút thêm */}
        <div className="section-header">
          <div className="header-content">
            <h3>Danh sách chức vụ</h3>
            <p>Tổng cộng: {filteredPositions.length} chức vụ</p>
          </div>
          <AdminButton onClick={handleAddPosition} variant="primary" icon={FaPlus}>
            Thêm chức vụ
          </AdminButton>
        </div>

        {/* Bảng chức vụ */}
        <div className="table-container">
          <table className="positions-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Chức vụ</th>
                <th>Phòng ban</th>
                <th>Cấp độ</th>
                <th>Số nhân viên</th>
                <th>Mức lương</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    <div className="no-data-content">
                      <p>Không tìm thấy chức vụ nào</p>
                      <p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPositions.map((position, index) => (
                  <tr key={position.id} className="position-row">
                    <td className="position-stt">
                      <span className="stt-badge">{index + 1}</span>
                    </td>
                    <td className="position-info">
                      <div className="position-details">
                        <strong>{position.title}</strong>
                        <small>{position.code}</small>
                        <div className="position-description">{position.description}</div>
                      </div>
                    </td>
                    <td className="position-department">
                      <span className="department-badge">{position.department}</span>
                    </td>
                    <td className="position-level">
                      <span className={`level-badge level-${position.level?.replace(/\s+/g, '-').toLowerCase()}`}>
                        {formatLevel(position.level)}
                      </span>
                    </td>
                    <td className="position-employees">
                      <div className="employee-count">
                        <FaUsers className="users-icon" />
                        <span>{position.employeeCount || 0}</span>
                      </div>
                    </td>
                    <td className="position-salary">
                      <span className="salary-range">{formatSalary(position.salaryMin, position.salaryMax)}</span>
                    </td>
                    <td className="position-status">
                      <span className={`status-badge status-${position.status === 1 ? 'active' : 'inactive'}`}>
                        {formatStatus(position.status)}
                      </span>
                    </td>
                    <td className="position-actions">
                      <div className="action-buttons">
                        <AdminButton
                          onClick={() => handleEditPosition(position)}
                          variant="outline"
                          size="small"
                          icon={FaEdit}
                          title="Sửa chức vụ"
                        />
                        <AdminButton
                          onClick={() => handleDeletePosition(position.id)}
                          variant="danger"
                          size="small"
                          icon={FaTrash}
                          title="Xóa chức vụ"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                    <label>Số nhân viên</label>
                    <input
                      type="number"
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleInputChange}
                      placeholder="Nhập số nhân viên"
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
                  <AdminButton type="button" onClick={closeModal} variant="outline">
                    Hủy
                  </AdminButton>
                  <AdminButton type="submit" variant="primary">
                    Thêm chức vụ
                  </AdminButton>
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
                    <label>Số nhân viên</label>
                    <input
                      type="number"
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleInputChange}
                      placeholder="Nhập số nhân viên"
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
                  <AdminButton type="button" onClick={closeModal} variant="outline">
                    Hủy
                  </AdminButton>
                  <AdminButton type="submit" variant="primary">
                    Cập nhật
                  </AdminButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Positions;
