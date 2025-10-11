import React, { useState, useEffect } from 'react';
import Button from '../../../components/Button';
import Card, { CardTitle, CardContent } from '../../../components/Card';
import { FaClock, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaCalendarAlt, FaUserClock, FaExclamationTriangle } from 'react-icons/fa';

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
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaClock className="text-blue-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                Quản lý ca làm việc
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Thiết lập và quản lý các ca làm việc trong hệ thống
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header và nút thêm */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle level="h3" className="text-lg mb-1">
              Danh sách ca làm việc
            </CardTitle>
            <CardContent className="text-sm text-gray-600">
              Tổng cộng: {filteredShifts.length} ca làm việc
            </CardContent>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            icon={<FaPlus />}
          >
            Thêm ca làm việc
          </Button>
        </div>
      </Card>

      {/* Filters và Search */}
      <Card>
        <CardTitle level="h3" className="text-lg mb-4">
          Bộ lọc và tìm kiếm
        </CardTitle>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm ca làm việc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent>
            <div className="flex items-start">
              <FaExclamationTriangle className="text-red-500 mr-3 mt-1" />
              <div>
                <div className="text-red-800 font-medium">{error}</div>
                {error.includes('Không thể kết nối đến server') && (
                  <div className="mt-2 text-sm text-red-700">
                    <strong>Hướng dẫn:</strong>
                    <ul className="mt-1 ml-4 list-disc">
                      <li>Kiểm tra backend server đã chạy chưa</li>
                      <li>Chạy script SQL để tạo bảng shifts</li>
                      <li>Kiểm tra kết nối database</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang xử lý...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danh sách ca làm việc */}
      {filteredShifts.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <FaCalendarAlt className="mx-auto text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có ca làm việc nào</h3>
              <p className="text-gray-600">Hãy thêm ca làm việc đầu tiên để bắt đầu</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShifts.map(shift => (
            <Card key={shift.shift_id} className={`${!shift.is_active ? 'opacity-60' : ''}`}>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle level="h4" className="text-lg mb-1">
                      {shift.shift_name}
                    </CardTitle>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${shift.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {shift.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleStatus(shift.shift_id)}
                      className={`p-2 rounded-lg transition-colors ${shift.is_active
                        ? 'text-green-600 hover:bg-green-100'
                        : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      title={shift.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    >
                      {shift.is_active ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    <button
                      onClick={() => openEditModal(shift)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteShift(shift.shift_id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUserClock className="mr-2" />
                    <span className="mr-2">Bắt đầu:</span>
                    <span className="font-medium">{shift.start_time}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUserClock className="mr-2" />
                    <span className="mr-2">Kết thúc:</span>
                    <span className="font-medium">{shift.end_time}</span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Giờ làm việc:</span>
                      <span className="font-medium text-blue-600">
                        {calculateWorkHours(shift.start_time, shift.end_time, shift.break_duration).toFixed(1)}h
                      </span>
                    </div>
                    {shift.break_duration > 0 && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Nghỉ giữa ca:</span>
                        <span className="font-medium">{shift.break_duration} phút</span>
                      </div>
                    )}
                  </div>

                  {shift.description && (
                    <div className="border-t pt-3">
                      <p className="text-sm text-gray-600">{shift.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? 'Đang tạo...' : 'Tạo ca làm việc'}
                </Button>
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
                <Button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedShift(null);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
