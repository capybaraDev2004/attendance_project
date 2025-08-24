import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminButton from '../../components/AdminButton';
import { FaClock, FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaCalendarAlt, FaUserClock } from 'react-icons/fa';
import './WorkHours.css';

const WorkHours = () => {
  const [workHours, setWorkHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorkHour, setSelectedWorkHour] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state cho thêm/sửa giờ làm việc
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    date: '',
    checkIn: '',
    checkOut: '',
    totalHours: '',
    overtime: '',
    status: 'completed',
    notes: ''
  });

  // Dữ liệu mẫu cho giờ làm việc
  const sampleWorkHours = [
    {
      id: 1,
      employeeName: 'Nguyễn Văn An',
      employeeId: 'NV001',
      date: '2024-01-15',
      checkIn: '08:00',
      checkOut: '17:00',
      totalHours: '8.0',
      overtime: '0.0',
      status: 'completed',
      notes: 'Làm việc đầy đủ giờ, không có giờ làm thêm',
      department: 'Kỹ thuật',
      position: 'Lập trình viên'
    },
    {
      id: 2,
      employeeName: 'Trần Thị Bình',
      employeeId: 'NV002',
      date: '2024-01-15',
      checkIn: '08:15',
      checkOut: '18:30',
      totalHours: '9.25',
      overtime: '1.25',
      status: 'completed',
      notes: 'Có làm thêm giờ để hoàn thành dự án',
      department: 'Thiết kế',
      position: 'UI/UX Designer'
    },
    {
      id: 3,
      employeeName: 'Lê Văn Cường',
      employeeId: 'NV003',
      date: '2024-01-15',
      checkIn: '09:00',
      checkOut: '16:00',
      totalHours: '7.0',
      overtime: '0.0',
      status: 'late',
      notes: 'Đi muộn 1 giờ, cần cải thiện',
      department: 'Kinh doanh',
      position: 'Nhân viên kinh doanh'
    },
    {
      id: 4,
      employeeName: 'Phạm Thị Dung',
      employeeId: 'NV004',
      date: '2024-01-15',
      checkIn: '08:00',
      checkOut: '17:00',
      totalHours: '8.0',
      overtime: '0.0',
      status: 'completed',
      notes: 'Làm việc đúng giờ, hiệu quả cao',
      department: 'Nhân sự',
      position: 'Chuyên viên nhân sự'
    },
    {
      id: 5,
      employeeName: 'Hoàng Văn Em',
      employeeId: 'NV005',
      date: '2024-01-15',
      checkIn: '08:00',
      checkOut: '19:00',
      totalHours: '10.0',
      overtime: '2.0',
      status: 'overtime',
      notes: 'Làm thêm giờ để xử lý sự cố khẩn cấp',
      department: 'Vận hành',
      position: 'Kỹ sư vận hành'
    }
  ];

  useEffect(() => {
    // Giả lập API call
    fetchWorkHours();
  }, []);

  const fetchWorkHours = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Giả lập delay API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sử dụng dữ liệu mẫu
      setWorkHours(sampleWorkHours);
    } catch (err) {
      setError('Lỗi khi tải danh sách giờ làm việc');
      console.error('Lỗi fetch work hours:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkHour = () => {
    setFormData({
      employeeName: '',
      employeeId: '',
      date: '',
      checkIn: '',
      checkOut: '',
      totalHours: '',
      overtime: '',
      status: 'completed',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleEditWorkHour = (workHour) => {
    setSelectedWorkHour(workHour);
    setFormData({
      employeeName: workHour.employeeName,
      employeeId: workHour.employeeId,
      date: workHour.date,
      checkIn: workHour.checkIn,
      checkOut: workHour.checkOut,
      totalHours: workHour.totalHours,
      overtime: workHour.overtime,
      status: workHour.status,
      notes: workHour.notes
    });
    setShowEditModal(true);
  };

  const handleDeleteWorkHour = async (workHourId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi giờ làm việc này?')) {
      try {
        // Giả lập API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setWorkHours(workHours.filter(workHour => workHour.id !== workHourId));
      } catch (err) {
        console.error('Lỗi xóa giờ làm việc:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (showAddModal) {
        // Thêm giờ làm việc mới
        const newWorkHour = {
          id: Date.now(),
          ...formData,
          department: 'Chưa xác định',
          position: 'Chưa xác định'
        };
        
        setWorkHours([...workHours, newWorkHour]);
        setShowAddModal(false);
      } else {
        // Cập nhật giờ làm việc
        const updatedWorkHours = workHours.map(workHour => 
          workHour.id === selectedWorkHour.id ? { ...workHour, ...formData } : workHour
        );
        
        setWorkHours(updatedWorkHours);
        setShowEditModal(false);
        setSelectedWorkHour(null);
      }
      
      // Reset form
      setFormData({
        employeeName: '',
        employeeId: '',
        date: '',
        checkIn: '',
        checkOut: '',
        totalHours: '',
        overtime: '',
        status: 'completed',
        notes: ''
      });
    } catch (err) {
      console.error('Lỗi lưu giờ làm việc:', err);
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
    setSelectedWorkHour(null);
    setFormData({
      employeeName: '',
      employeeId: '',
      date: '',
      checkIn: '',
      checkOut: '',
      totalHours: '',
      overtime: '',
      status: 'completed',
      notes: ''
    });
  };

  // Lọc giờ làm việc theo trạng thái và tìm kiếm
  const filteredWorkHours = workHours.filter(workHour => {
    const matchesStatus = filterStatus === 'all' || workHour.status === filterStatus;
    const matchesSearch = workHour.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workHour.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workHour.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Thống kê
  const totalRecords = workHours.length;
  const completedRecords = workHours.filter(w => w.status === 'completed').length;
  const lateRecords = workHours.filter(w => w.status === 'late').length;
  const overtimeRecords = workHours.filter(w => w.status === 'overtime').length;

  // Tính tổng giờ làm việc
  const totalWorkHours = workHours.reduce((sum, w) => sum + parseFloat(w.totalHours || 0), 0);
  const totalOvertime = workHours.reduce((sum, w) => sum + parseFloat(w.overtime || 0), 0);

  // Format trạng thái
  const formatStatus = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'late': return 'Đi muộn';
      case 'overtime': return 'Làm thêm giờ';
      case 'absent': return 'Vắng mặt';
      default: return 'Không xác định';
    }
  };

  // Format ngày
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <AdminLayout
        title="Quản lý giờ làm việc"
        subtitle="Theo dõi và quản lý giờ làm việc của nhân viên"
        icon={FaClock}
      >
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách giờ làm việc...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout
        title="Quản lý giờ làm việc"
        subtitle="Theo dõi và quản lý giờ làm việc của nhân viên"
        icon={FaClock}
      >
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h3>Đã xảy ra lỗi</h3>
          <p>{error}</p>
          <AdminButton onClick={fetchWorkHours} variant="primary">
            Thử lại
          </AdminButton>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Quản lý giờ làm việc"
      subtitle="Theo dõi và quản lý giờ làm việc của nhân viên"
      icon={FaClock}
    >
      <div className="work-hours-container">
        {/* Bộ lọc và tìm kiếm */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên nhân viên, mã nhân viên hoặc phòng ban..."
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
                <option value="completed">Hoàn thành</option>
                <option value="late">Đi muộn</option>
                <option value="overtime">Làm thêm giờ</option>
                <option value="absent">Vắng mặt</option>
              </select>
            </div>
            
            <AdminButton onClick={fetchWorkHours} variant="outline" size="small">
              Làm mới
            </AdminButton>
          </div>
        </div>

        {/* Thống kê */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{totalRecords}</div>
            <div className="stat-label">Tổng bản ghi</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{completedRecords}</div>
            <div className="stat-label">Hoàn thành</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{lateRecords}</div>
            <div className="stat-label">Đi muộn</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{overtimeRecords}</div>
            <div className="stat-label">Làm thêm giờ</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalWorkHours.toFixed(1)}</div>
            <div className="stat-label">Tổng giờ làm</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalOvertime.toFixed(1)}</div>
            <div className="stat-label">Tổng giờ thêm</div>
          </div>
        </div>

        {/* Header và nút thêm */}
        <div className="section-header">
          <div className="header-content">
            <h3>Danh sách giờ làm việc</h3>
            <p>Tổng cộng: {filteredWorkHours.length} bản ghi</p>
          </div>
          <AdminButton onClick={handleAddWorkHour} variant="primary" icon={FaPlus}>
            Thêm bản ghi
          </AdminButton>
        </div>

        {/* Bảng giờ làm việc */}
        <div className="table-container">
          <table className="work-hours-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Nhân viên</th>
                <th>Ngày</th>
                <th>Giờ vào</th>
                <th>Giờ ra</th>
                <th>Tổng giờ</th>
                <th>Giờ thêm</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkHours.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data">
                    <div className="no-data-content">
                      <p>Không tìm thấy bản ghi nào</p>
                      <p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkHours.map((workHour, index) => (
                  <tr key={workHour.id} className="work-hour-row">
                    <td className="work-hour-stt">
                      <span className="stt-badge">{index + 1}</span>
                    </td>
                    <td className="work-hour-employee">
                      <div className="employee-info">
                        <strong>{workHour.employeeName}</strong>
                        <small>{workHour.employeeId} • {workHour.department}</small>
                      </div>
                    </td>
                    <td className="work-hour-date">
                      <div className="date-info">
                        <FaCalendarAlt className="calendar-icon" />
                        <span>{formatDate(workHour.date)}</span>
                      </div>
                    </td>
                    <td className="work-hour-checkin">
                      <div className="time-info">
                        <FaUserClock className="clock-icon" />
                        <span>{workHour.checkIn}</span>
                      </div>
                    </td>
                    <td className="work-hour-checkout">
                      <div className="time-info">
                        <FaUserClock className="clock-icon" />
                        <span>{workHour.checkOut}</span>
                      </div>
                    </td>
                    <td className="work-hour-total">
                      <span className="hours-badge">{workHour.totalHours}h</span>
                    </td>
                    <td className="work-hour-overtime">
                      {parseFloat(workHour.overtime) > 0 ? (
                        <span className="overtime-badge">{workHour.overtime}h</span>
                      ) : (
                        <span className="no-overtime">--</span>
                      )}
                    </td>
                    <td className="work-hour-status">
                      <span className={`status-badge status-${workHour.status}`}>
                        {formatStatus(workHour.status)}
                      </span>
                    </td>
                    <td className="work-hour-notes">
                      <div className="notes-content">
                        {workHour.notes || 'Không có ghi chú'}
                      </div>
                    </td>
                    <td className="work-hour-actions">
                      <div className="action-buttons">
                        <AdminButton
                          onClick={() => handleEditWorkHour(workHour)}
                          variant="outline"
                          size="small"
                          icon={FaEdit}
                          title="Sửa bản ghi"
                        />
                        <AdminButton
                          onClick={() => handleDeleteWorkHour(workHour.id)}
                          variant="danger"
                          size="small"
                          icon={FaTrash}
                          title="Xóa bản ghi"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal thêm giờ làm việc */}
        {showAddModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Thêm bản ghi giờ làm việc</h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên nhân viên *</label>
                    <input
                      type="text"
                      name="employeeName"
                      value={formData.employeeName}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập tên nhân viên"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Mã nhân viên *</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập mã nhân viên"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Ngày làm việc *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Giờ vào *</label>
                    <input
                      type="time"
                      name="checkIn"
                      value={formData.checkIn}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Giờ ra *</label>
                    <input
                      type="time"
                      name="checkOut"
                      value={formData.checkOut}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tổng giờ làm việc</label>
                    <input
                      type="number"
                      name="totalHours"
                      value={formData.totalHours}
                      onChange={handleInputChange}
                      step="0.25"
                      min="0"
                      placeholder="8.0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Giờ làm thêm</label>
                    <input
                      type="number"
                      name="overtime"
                      value={formData.overtime}
                      onChange={handleInputChange}
                      step="0.25"
                      min="0"
                      placeholder="0.0"
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
                    <option value="completed">Hoàn thành</option>
                    <option value="late">Đi muộn</option>
                    <option value="overtime">Làm thêm giờ</option>
                    <option value="absent">Vắng mặt</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Ghi chú về giờ làm việc"
                    rows="3"
                  />
                </div>
                
                <div className="modal-footer">
                  <AdminButton type="button" onClick={closeModal} variant="outline">
                    Hủy
                  </AdminButton>
                  <AdminButton type="submit" variant="primary">
                    Thêm bản ghi
                  </AdminButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal sửa giờ làm việc */}
        {showEditModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Sửa bản ghi giờ làm việc</h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên nhân viên *</label>
                    <input
                      type="text"
                      name="employeeName"
                      value={formData.employeeName}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập tên nhân viên"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Mã nhân viên *</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập mã nhân viên"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Ngày làm việc *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Giờ vào *</label>
                    <input
                      type="time"
                      name="checkIn"
                      value={formData.checkIn}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Giờ ra *</label>
                    <input
                      type="time"
                      name="checkOut"
                      value={formData.checkOut}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tổng giờ làm việc</label>
                    <input
                      type="number"
                      name="totalHours"
                      value={formData.totalHours}
                      onChange={handleInputChange}
                      step="0.25"
                      min="0"
                      placeholder="8.0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Giờ làm thêm</label>
                    <input
                      type="number"
                      name="overtime"
                      value={formData.overtime}
                      onChange={handleInputChange}
                      step="0.25"
                      min="0"
                      placeholder="0.0"
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
                    <option value="completed">Hoàn thành</option>
                    <option value="late">Đi muộn</option>
                    <option value="overtime">Làm thêm giờ</option>
                    <option value="absent">Vắng mặt</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Ghi chú về giờ làm việc"
                    rows="3"
                  />
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

export default WorkHours;
