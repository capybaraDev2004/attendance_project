import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminButton from '../../components/AdminButton';
import { FaClock, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaCalendarAlt, FaUserClock, FaExclamationTriangle } from 'react-icons/fa';
import './ShiftManagement.css';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state cho thêm/sửa ca làm việc
  const [formData, setFormData] = useState({
    shift_name: '',
    start_time: '',
    end_time: '',
    break_duration: 0,
    description: ''
  });

  // Load danh sách ca làm việc từ API
  const loadShifts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/shifts');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setShifts(result.data);
      } else {
        setError(result.message || 'Lỗi khi tải danh sách ca làm việc');
        setShifts([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải ca làm việc:', err);
      setError('Không thể kết nối đến server. Vui lòng kiểm tra backend server.');
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load dữ liệu khi component mount
  useEffect(() => {
    loadShifts();
  }, []);

  // Xử lý thay đổi form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form về trạng thái ban đầu
  const resetForm = () => {
    setFormData({
      shift_name: '',
      start_time: '',
      end_time: '',
      break_duration: 0,
      description: ''
    });
    setError(null);
  };

  // Xử lý thêm ca làm việc mới
  const handleAddShift = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setShowAddModal(false);
        resetForm();
        loadShifts(); // Reload danh sách
      } else {
        setError(result.message || 'Lỗi khi tạo ca làm việc');
      }
    } catch (err) {
      console.error('Lỗi khi tạo ca làm việc:', err);
      setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý sửa ca làm việc
  const handleEditShift = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/shifts/${selectedShift.shift_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setShowEditModal(false);
        setSelectedShift(null);
        resetForm();
        loadShifts(); // Reload danh sách
      } else {
        setError(result.message || 'Lỗi khi cập nhật ca làm việc');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật ca làm việc:', err);
      setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xóa ca làm việc
  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ca làm việc này?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/shifts/${shiftId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        loadShifts(); // Reload danh sách
      } else {
        setError(result.message || 'Lỗi khi xóa ca làm việc');
      }
    } catch (err) {
      console.error('Lỗi khi xóa ca làm việc:', err);
      setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý bật/tắt trạng thái ca làm việc
  const handleToggleStatus = async (shiftId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/shifts/${shiftId}/toggle`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        loadShifts(); // Reload danh sách
      } else {
        setError(result.message || 'Lỗi khi thay đổi trạng thái ca làm việc');
      }
    } catch (err) {
      console.error('Lỗi khi thay đổi trạng thái ca làm việc:', err);
      setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Mở modal sửa với dữ liệu ca làm việc được chọn
  const openEditModal = (shift) => {
    setSelectedShift(shift);
    setFormData({
      shift_name: shift.shift_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      break_duration: shift.break_duration,
      description: shift.description || ''
    });
    setShowEditModal(true);
  };

  // Lọc ca làm việc theo trạng thái và từ khóa tìm kiếm
  const filteredShifts = shifts.filter(shift => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && shift.is_active) ||
      (filterStatus === 'inactive' && !shift.is_active);
    
    const matchesSearch = shift.shift_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shift.description && shift.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // Tính tổng số giờ làm việc (không tính nghỉ)
  const calculateWorkHours = (startTime, endTime, breakDuration) => {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours - (breakDuration / 60));
  };

  return (
    <AdminLayout>
      <div className="shift-management">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-title">
              <FaClock className="header-icon" />
              <h1>Quản lý ca làm việc</h1>
            </div>
            <p className="header-description">
              Thiết lập và quản lý các ca làm việc trong hệ thống
            </p>
          </div>
          <AdminButton
            onClick={() => setShowAddModal(true)}
            className="add-shift-btn"
            icon={FaPlus}
          >
            Thêm ca làm việc
          </AdminButton>
        </div>

        {/* Filters và Search */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Trạng thái:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
          
          <div className="search-group">
            <input
              type="text"
              placeholder="Tìm kiếm ca làm việc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <FaExclamationTriangle className="error-icon" />
            <div>
              {error}
              {error.includes('Không thể kết nối đến server') && (
                <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.8 }}>
                  <strong>Hướng dẫn:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    <li>Kiểm tra backend server đã chạy chưa</li>
                    <li>Chạy script SQL để tạo bảng shifts</li>
                    <li>Kiểm tra kết nối database</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Đang xử lý...</p>
          </div>
        )}

        {/* Danh sách ca làm việc */}
        <div className="shifts-grid">
          {filteredShifts.length === 0 ? (
            <div className="empty-state">
              <FaCalendarAlt className="empty-icon" />
              <h3>Chưa có ca làm việc nào</h3>
              <p>Hãy thêm ca làm việc đầu tiên để bắt đầu</p>
            </div>
          ) : (
            filteredShifts.map(shift => (
              <div key={shift.shift_id} className={`shift-card ${!shift.is_active ? 'inactive' : ''}`}>
                <div className="shift-header">
                  <div className="shift-info">
                    <h3 className="shift-name">{shift.shift_name}</h3>
                    <div className="shift-status">
                      <span className={`status-badge ${shift.is_active ? 'active' : 'inactive'}`}>
                        {shift.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                  </div>
                  <div className="shift-actions">
                    <button
                      onClick={() => handleToggleStatus(shift.shift_id)}
                      className={`toggle-btn ${shift.is_active ? 'active' : 'inactive'}`}
                      title={shift.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    >
                      {shift.is_active ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    <button
                      onClick={() => openEditModal(shift)}
                      className="edit-btn"
                      title="Chỉnh sửa"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteShift(shift.shift_id)}
                      className="delete-btn"
                      title="Xóa"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="shift-details">
                  <div className="time-info">
                    <div className="time-item">
                      <FaUserClock className="time-icon" />
                      <span className="time-label">Bắt đầu:</span>
                      <span className="time-value">{shift.start_time}</span>
                    </div>
                    <div className="time-item">
                      <FaUserClock className="time-icon" />
                      <span className="time-label">Kết thúc:</span>
                      <span className="time-value">{shift.end_time}</span>
                    </div>
                  </div>

                  <div className="work-hours-info">
                    <div className="hours-item">
                      <span className="hours-label">Giờ làm việc:</span>
                      <span className="hours-value">
                        {calculateWorkHours(shift.start_time, shift.end_time, shift.break_duration).toFixed(1)}h
                      </span>
                    </div>
                    {shift.break_duration > 0 && (
                      <div className="hours-item">
                        <span className="hours-label">Nghỉ giữa ca:</span>
                        <span className="hours-value">{shift.break_duration} phút</span>
                      </div>
                    )}
                  </div>

                  {shift.description && (
                    <div className="shift-description">
                      <p>{shift.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal thêm ca làm việc */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Thêm ca làm việc mới</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddShift} className="shift-form">
                <div className="form-group">
                  <label>Tên ca làm việc *</label>
                  <input
                    type="text"
                    name="shift_name"
                    value={formData.shift_name}
                    onChange={handleInputChange}
                    placeholder="VD: Ca sáng, Ca chiều..."
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Giờ bắt đầu *</label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Giờ kết thúc *</label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Thời gian nghỉ giữa ca (phút)</label>
                  <input
                    type="number"
                    name="break_duration"
                    value={formData.break_duration}
                    onChange={handleInputChange}
                    min="0"
                    max="120"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chi tiết về ca làm việc..."
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <AdminButton
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="cancel-btn"
                  >
                    Hủy
                  </AdminButton>
                  <AdminButton
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Đang tạo...' : 'Tạo ca làm việc'}
                  </AdminButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal sửa ca làm việc */}
        {showEditModal && selectedShift && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Chỉnh sửa ca làm việc</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedShift(null);
                    resetForm();
                  }}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleEditShift} className="shift-form">
                <div className="form-group">
                  <label>Tên ca làm việc *</label>
                  <input
                    type="text"
                    name="shift_name"
                    value={formData.shift_name}
                    onChange={handleInputChange}
                    placeholder="VD: Ca sáng, Ca chiều..."
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Giờ bắt đầu *</label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Giờ kết thúc *</label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Thời gian nghỉ giữa ca (phút)</label>
                  <input
                    type="number"
                    name="break_duration"
                    value={formData.break_duration}
                    onChange={handleInputChange}
                    min="0"
                    max="120"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chi tiết về ca làm việc..."
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <AdminButton
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedShift(null);
                      resetForm();
                    }}
                    className="cancel-btn"
                  >
                    Hủy
                  </AdminButton>
                  <AdminButton
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
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

export default ShiftManagement;
