import React, { useState, useEffect } from 'react';
import { FaClock, FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import Card, { CardContent, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import API_BASE_URL from '../../../config/api';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [formData, setFormData] = useState({
    shift_name: '',
    start_time: '',
    end_time: '',
    break_duration: 30,
    is_active: true
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      console.log('Fetching shifts from:', `${API_BASE_URL}/api/shifts`);

      const response = await fetch(`${API_BASE_URL}/api/shifts`);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setShifts(data.data || []);
      } else {
        console.error('API returned error:', data.message);
        setShifts([]);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      setShifts([]);
      // Show user-friendly error message
      alert(`Lỗi khi tải danh sách ca làm việc: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      shift_name: '',
      start_time: '',
      end_time: '',
      break_duration: 30,
      is_active: true
    });
  };

  const handleAddShift = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log('Adding shift:', formData);

      const response = await fetch(`${API_BASE_URL}/api/shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Add shift result:', result);

      if (result.success) {
        await fetchShifts();
        setShowAddModal(false);
        resetForm();
        alert('Thêm ca làm việc thành công!');
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra khi thêm ca làm việc');
      }
    } catch (error) {
      console.error('Error adding shift:', error);
      alert(`Lỗi khi thêm ca làm việc: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditShift = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log('Updating shift:', selectedShift.shift_id, formData);

      const response = await fetch(`${API_BASE_URL}/api/shifts/${selectedShift.shift_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Update shift result:', result);

      if (result.success) {
        await fetchShifts();
        setShowEditModal(false);
        setSelectedShift(null);
        resetForm();
        alert('Cập nhật ca làm việc thành công!');
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra khi cập nhật ca làm việc');
      }
    } catch (error) {
      console.error('Error updating shift:', error);
      alert(`Lỗi khi cập nhật ca làm việc: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ca làm việc này?')) {
      try {
        setLoading(true);
        console.log('Deleting shift:', shiftId);

        const response = await fetch(`${API_BASE_URL}/api/shifts/${shiftId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Delete shift result:', result);

        if (result.success) {
          await fetchShifts();
          alert('Xóa ca làm việc thành công!');
        } else {
          throw new Error(result.message || 'Có lỗi xảy ra khi xóa ca làm việc');
        }
      } catch (error) {
        console.error('Error deleting shift:', error);
        alert(`Lỗi khi xóa ca làm việc: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditClick = (shift) => {
    setSelectedShift(shift);
    setFormData({
      shift_name: shift.shift_name || '',
      start_time: shift.start_time || '',
      end_time: shift.end_time || '',
      break_duration: shift.break_duration || 30,
      is_active: shift.is_active !== false
    });
    setShowEditModal(true);
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM format
  };

  const calculateWorkHours = (startTime, endTime, breakDuration = 0) => {
    if (!startTime || !endTime) return 0;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
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
            <p className="text-gray-600 text-sm">
              Quản lý các ca làm việc và thời gian làm việc
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => {
                console.log('API Base URL:', API_BASE_URL);
                console.log('Full API URL:', `${API_BASE_URL}/api/shifts`);
                fetchShifts();
              }}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <FaEye className="text-sm" />
              <span>Test API</span>
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              variant="primary"
              className="flex items-center space-x-2"
            >
              <FaPlus className="text-sm" />
              <span>Thêm ca làm việc</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Bảng danh sách ca làm việc */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-8">
              <FaClock className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600">Chưa có ca làm việc nào</p>
              <Button
                onClick={() => setShowAddModal(true)}
                variant="primary"
                className="mt-4"
              >
                Thêm ca làm việc đầu tiên
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tên ca</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Giờ bắt đầu</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Giờ kết thúc</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Thời gian nghỉ</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tổng giờ làm</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((shift) => (
                    <tr key={shift.shift_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{shift.shift_name}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatTime(shift.start_time)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatTime(shift.end_time)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {shift.break_duration || 0} phút
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {calculateWorkHours(shift.start_time, shift.end_time, shift.break_duration).toFixed(1)} giờ
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${shift.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {shift.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => handleEditClick(shift)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <FaEdit className="text-xs" />
                            <span>Sửa</span>
                          </Button>
                          <Button
                            onClick={() => handleDeleteShift(shift.shift_id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <FaTrash className="text-xs" />
                            <span>Xóa</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal thêm ca làm việc */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); resetForm(); } }}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-cyan-600">
              <h2 className="text-white text-lg font-semibold">Thêm ca làm việc mới</h2>
              <button
                className="text-white/80 hover:text-white text-2xl leading-none"
                onClick={() => { setShowAddModal(false); resetForm(); }}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddShift} className="p-6 space-y-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên ca làm việc *</label>
                <input
                  type="text"
                  name="shift_name"
                  value={formData.shift_name}
                  onChange={handleInputChange}
                  placeholder="VD: Ca sáng, Ca chiều..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu *</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc *</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian nghỉ (phút)</label>
                <input
                  type="number"
                  name="break_duration"
                  value={formData.break_duration}
                  onChange={handleInputChange}
                  placeholder="30"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="form-group">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Kích hoạt ca làm việc</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowEditModal(false); setSelectedShift(null); resetForm(); } }}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-cyan-600">
              <h2 className="text-white text-lg font-semibold">Chỉnh sửa ca làm việc</h2>
              <button
                className="text-white/80 hover:text-white text-2xl leading-none"
                onClick={() => { setShowEditModal(false); setSelectedShift(null); resetForm(); }}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditShift} className="p-6 space-y-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên ca làm việc *</label>
                <input
                  type="text"
                  name="shift_name"
                  value={formData.shift_name}
                  onChange={handleInputChange}
                  placeholder="VD: Ca sáng, Ca chiều..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu *</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc *</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian nghỉ (phút)</label>
                <input
                  type="number"
                  name="break_duration"
                  value={formData.break_duration}
                  onChange={handleInputChange}
                  placeholder="30"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="form-group">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Kích hoạt ca làm việc</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedShift(null); resetForm(); }}
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