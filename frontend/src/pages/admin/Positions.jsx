import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminButton from '../../components/AdminButton';
import { FaUserTie, FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaUsers, FaChartBar } from 'react-icons/fa';
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
    positionName: '',
    positionCode: '',
    department: '',
    level: '',
    description: '',
    status: 'active',
    requirements: '',
    salaryRange: ''
  });

  // Dữ liệu mẫu cho chức vụ
  const samplePositions = [
    {
      id: 1,
      positionName: 'Giám đốc điều hành',
      positionCode: 'CEO',
      department: 'Ban lãnh đạo',
      level: 'Cấp cao',
      description: 'Lãnh đạo và điều hành toàn bộ hoạt động của công ty',
      status: 'active',
      requirements: 'Kinh nghiệm 10+ năm, bằng MBA, kỹ năng lãnh đạo xuất sắc',
      salaryRange: '50,000,000 - 100,000,000 VNĐ',
      employeeCount: 1,
      createdDate: '2024-01-01'
    },
    {
      id: 2,
      positionName: 'Trưởng phòng kỹ thuật',
      positionCode: 'TECH_LEAD',
      department: 'Kỹ thuật',
      level: 'Cấp trung',
      description: 'Quản lý và phát triển đội ngũ kỹ thuật, dự án công nghệ',
      status: 'active',
      requirements: 'Kinh nghiệm 5+ năm, kiến thức chuyên sâu về công nghệ',
      salaryRange: '25,000,000 - 40,000,000 VNĐ',
      employeeCount: 3,
      createdDate: '2024-01-02'
    },
    {
      id: 3,
      positionName: 'Lập trình viên Senior',
      positionCode: 'SENIOR_DEV',
      department: 'Kỹ thuật',
      level: 'Cấp trung',
      description: 'Phát triển phần mềm, hướng dẫn junior developers',
      status: 'active',
      requirements: 'Kinh nghiệm 3+ năm, thành thạo nhiều ngôn ngữ lập trình',
      salaryRange: '18,000,000 - 30,000,000 VNĐ',
      employeeCount: 8,
      createdDate: '2024-01-03'
    },
    {
      id: 4,
      positionName: 'Lập trình viên Junior',
      positionCode: 'JUNIOR_DEV',
      department: 'Kỹ thuật',
      level: 'Cấp cơ bản',
      description: 'Phát triển phần mềm dưới sự hướng dẫn của senior',
      status: 'active',
      requirements: 'Tốt nghiệp đại học CNTT, kiến thức cơ bản về lập trình',
      salaryRange: '12,000,000 - 18,000,000 VNĐ',
      employeeCount: 15,
      createdDate: '2024-01-04'
    },
    {
      id: 5,
      positionName: 'Chuyên viên nhân sự',
      positionCode: 'HR_SPEC',
      department: 'Nhân sự',
      level: 'Cấp cơ bản',
      description: 'Quản lý tuyển dụng, đào tạo và phát triển nhân viên',
      status: 'active',
      requirements: 'Tốt nghiệp đại học, kỹ năng giao tiếp tốt',
      salaryRange: '15,000,000 - 22,000,000 VNĐ',
      employeeCount: 4,
      createdDate: '2024-01-05'
    },
    {
      id: 6,
      positionName: 'Nhân viên kinh doanh',
      positionCode: 'SALES_REP',
      department: 'Kinh doanh',
      level: 'Cấp cơ bản',
      description: 'Tìm kiếm khách hàng, tư vấn và bán sản phẩm',
      status: 'inactive',
      requirements: 'Kỹ năng bán hàng, giao tiếp tốt, ngoại hình ưa nhìn',
      salaryRange: '10,000,000 - 20,000,000 VNĐ',
      employeeCount: 0,
      createdDate: '2024-01-06'
    }
  ];

  useEffect(() => {
    // Giả lập API call
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Giả lập delay API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sử dụng dữ liệu mẫu
      setPositions(samplePositions);
    } catch (err) {
      setError('Lỗi khi tải danh sách chức vụ');
      console.error('Lỗi fetch positions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPosition = () => {
    setFormData({
      positionName: '',
      positionCode: '',
      department: '',
      level: '',
      description: '',
      status: 'active',
      requirements: '',
      salaryRange: ''
    });
    setShowAddModal(true);
  };

  const handleEditPosition = (position) => {
    setSelectedPosition(position);
    setFormData({
      positionName: position.positionName,
      positionCode: position.positionCode,
      department: position.department,
      level: position.level,
      description: position.description,
      status: position.status,
      requirements: position.requirements,
      salaryRange: position.salaryRange
    });
    setShowEditModal(true);
  };

  const handleDeletePosition = async (positionId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chức vụ này?')) {
      try {
        // Giả lập API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setPositions(positions.filter(position => position.id !== positionId));
      } catch (err) {
        console.error('Lỗi xóa chức vụ:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (showAddModal) {
        // Thêm chức vụ mới
        const newPosition = {
          id: Date.now(),
          ...formData,
          employeeCount: 0,
          createdDate: new Date().toISOString().split('T')[0]
        };
        
        setPositions([...positions, newPosition]);
        setShowAddModal(false);
      } else {
        // Cập nhật chức vụ
        const updatedPositions = positions.map(position => 
          position.id === selectedPosition.id ? { ...position, ...formData } : position
        );
        
        setPositions(updatedPositions);
        setShowEditModal(false);
        setSelectedPosition(null);
      }
      
      // Reset form
      setFormData({
        positionName: '',
        positionCode: '',
        department: '',
        level: '',
        description: '',
        status: 'active',
        requirements: '',
        salaryRange: ''
      });
    } catch (err) {
      console.error('Lỗi lưu chức vụ:', err);
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
      positionName: '',
      positionCode: '',
      department: '',
      level: '',
      description: '',
      status: 'active',
      requirements: '',
      salaryRange: ''
    });
  };

  // Lọc chức vụ theo trạng thái và tìm kiếm
  const filteredPositions = positions.filter(position => {
    const matchesStatus = filterStatus === 'all' || position.status === filterStatus;
    const matchesSearch = position.positionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.positionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Thống kê
  const totalPositions = positions.length;
  const activePositions = positions.filter(p => p.status === 'active').length;
  const inactivePositions = positions.filter(p => p.status === 'inactive').length;
  const totalEmployees = positions.reduce((sum, p) => sum + p.employeeCount, 0);

  // Format trạng thái
  const formatStatus = (status) => {
    switch (status) {
      case 'active': return 'Đang sử dụng';
      case 'inactive': return 'Không sử dụng';
      default: return 'Không xác định';
    }
  };

  // Format cấp độ
  const formatLevel = (level) => {
    switch (level) {
      case 'Cấp cao': return 'Cấp cao';
      case 'Cấp trung': return 'Cấp trung';
      case 'Cấp cơ bản': return 'Cấp cơ bản';
      default: return 'Không xác định';
    }
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
          <AdminButton onClick={fetchPositions} variant="primary">
            Thử lại
          </AdminButton>
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
                <option value="inactive">Không sử dụng</option>
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
            <div className="stat-label">Không sử dụng</div>
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
                        <strong>{position.positionName}</strong>
                        <small>{position.positionCode}</small>
                        <div className="position-description">{position.description}</div>
                      </div>
                    </td>
                    <td className="position-department">
                      <span className="department-badge">{position.department}</span>
                    </td>
                    <td className="position-level">
                      <span className={`level-badge level-${position.level.replace(/\s+/g, '-').toLowerCase()}`}>
                        {formatLevel(position.level)}
                      </span>
                    </td>
                    <td className="position-employees">
                      <div className="employee-count">
                        <FaUsers className="users-icon" />
                        <span>{position.employeeCount}</span>
                      </div>
                    </td>
                    <td className="position-salary">
                      <span className="salary-range">{position.salaryRange}</span>
                    </td>
                    <td className="position-status">
                      <span className={`status-badge status-${position.status}`}>
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
                      name="positionName"
                      value={formData.positionName}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập tên chức vụ"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Mã chức vụ *</label>
                    <input
                      type="text"
                      name="positionCode"
                      value={formData.positionCode}
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
                      <option value="Cấp cao">Cấp cao</option>
                      <option value="Cấp trung">Cấp trung</option>
                      <option value="Cấp cơ bản">Cấp cơ bản</option>
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
                    <label>Mức lương</label>
                    <input
                      type="text"
                      name="salaryRange"
                      value={formData.salaryRange}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: 15,000,000 - 25,000,000 VNĐ"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Đang sử dụng</option>
                    <option value="inactive">Không sử dụng</option>
                  </select>
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
                      name="positionName"
                      value={formData.positionName}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập tên chức vụ"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Mã chức vụ *</label>
                    <input
                      type="text"
                      name="positionCode"
                      value={formData.positionCode}
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
                      <option value="Cấp cao">Cấp cao</option>
                      <option value="Cấp trung">Cấp trung</option>
                      <option value="Cấp cơ bản">Cấp cơ bản</option>
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
                    <label>Mức lương</label>
                    <input
                      type="text"
                      name="salaryRange"
                      value={formData.salaryRange}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: 15,000,000 - 25,000,000 VNĐ"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Đang sử dụng</option>
                    <option value="inactive">Không sử dụng</option>
                  </select>
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
