import React, { useState, useEffect, useCallback} from 'react';
import StandardTable from '../../../components/StandardTable';
import Button from '../../../components/Button';
import Card, { CardTitle, CardContent } from '../../../components/Card';
import Pagination from '../../../components/Pagination';
import { FaDesktop, FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaClock } from 'react-icons/fa';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  // Modal xác nhận trung tâm
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    onConfirm: null
  });
  // Popup thông báo thành công trung tâm
  const [successModal, setSuccessModal] = useState({
    open: false,
    title: 'Thành công',
    message: ''
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State cho việc bật/tắt cột - chỉ giữ lại các cột cần thiết
  const [visibleColumns, setVisibleColumns] = useState({
    stt: true,
    deviceName: true,
    deviceType: true,
    location: true,
    status: true,
    actions: true
  });

  // Form state cho thêm/sửa thiết bị
  const [formData, setFormData] = useState({
    deviceName: '',
    deviceType: 'rfid',
    location: '',
    status: 'active',
    lastSeen: '',
    description: ''
  });

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Xác định API base URL đồng bộ với AdminHome
      const envBase = process.env.REACT_APP_API_BASE_URL;
      const origin = window.location.origin;
      const API_BASE = (envBase ? envBase.replace(/\/$/, '') : (origin.includes(':3000') ? origin.replace(':3000', ':3001') : origin));

      const res = await fetch(`${API_BASE}/api/devices`);
      const data = await res.json();
      if (data?.success && Array.isArray(data?.devices)) {
        // Map dữ liệu DB -> view model cho bảng
        const mapped = data.devices.map(d => ({
          id: d.device_id,
          deviceName: d.device_name || d.device_code,
          deviceCode: d.device_code,
          deviceType: 'rfid', // chưa có cột type trong DB -> mặc định
          location: d.location || '',
          ipAddress: '',
          macAddress: '',
          status: d.is_active === 1 ? 'active' : 'inactive',
          lastSeen: '',
          description: ''
        }));
        setDevices(mapped);
      } else {
        setDevices([]);
      }
    } catch (err) {
      setError('Lỗi khi tải danh sách thiết bị');
      console.error('Lỗi fetch devices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Giả lập API call
    fetchDevices();
  }, [fetchDevices]);

  const handleAddDevice = () => {
    setFormData({
      deviceName: '',
      deviceType: 'rfid',
      location: '',
      ipAddress: '',
      macAddress: '',
      status: 'active',
      lastSeen: '',
      description: ''
    });
    setShowAddModal(true);
  };

  const handleEditDevice = (device) => {
    setSelectedDevice(device);
    setFormData({
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      location: device.location,
      status: device.status,
      lastSeen: device.lastSeen,
      description: device.description
    });
    setShowEditModal(true);
  };

  const handleDeleteDevice = async (deviceId) => {
    // Hiển thị modal xác nhận đẹp ở giữa màn hình
    setConfirmModal({
      open: true,
      title: 'Xác nhận xóa thiết bị',
      message: 'Bạn có chắc chắn muốn xóa thiết bị này? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa thiết bị',
      cancelText: 'Hủy',
      onConfirm: async () => {
        try {
          const envBase = process.env.REACT_APP_API_BASE_URL;
          const origin = window.location.origin;
          const API_BASE = (envBase ? envBase.replace(/\/$/, '') : (origin.includes(':3000') ? origin.replace(':3000', ':3001') : origin));
          const res = await fetch(`${API_BASE}/api/devices/${deviceId}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok || !data?.success) throw new Error(data?.message || 'Xóa thiết bị thất bại');
          setDevices(prev => prev.filter(device => device.id !== deviceId));
          setSuccessModal({ open: true, title: 'Đã xóa', message: 'Xóa thiết bị thành công.' });
        } catch (err) {
          console.error('Lỗi xóa thiết bị:', err);
        } finally {
          setConfirmModal(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const envBase = process.env.REACT_APP_API_BASE_URL;
      const origin = window.location.origin;
      const API_BASE = (envBase ? envBase.replace(/\/$/, '') : (origin.includes(':3000') ? origin.replace(':3000', ':3001') : origin));

      if (showAddModal) {
        // Thêm thiết bị mới -> POST /api/devices
        // Tự sinh device_code từ tên thiết bị để đảm bảo duy nhất
        const normalizedName = (formData.deviceName || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const generatedCode = `${normalizedName || 'device'}-${Date.now()}`;
        const payload = {
          device_code: generatedCode,
          device_name: formData.deviceName,
          location: formData.location,
          is_active: formData.status === 'active' ? 1 : 0
        };
        const res = await fetch(`${API_BASE}/api/devices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.message || 'Tạo thiết bị thất bại');

        setShowAddModal(false);
        await fetchDevices();
        setSuccessModal({ open: true, title: 'Thành công', message: 'Thêm thiết bị mới thành công.' });
      } else {
        // Cập nhật thiết bị -> PUT /api/devices/:id
        const payload = {
          device_code: selectedDevice.deviceCode, // giữ nguyên device_code
          device_name: formData.deviceName,
          location: formData.location,
          is_active: formData.status === 'active' ? 1 : 0
        };
        // Hiển thị xác nhận chỉnh sửa trước khi gọi API
        setConfirmModal({
          open: true,
          title: 'Xác nhận cập nhật',
          message: 'Bạn có muốn lưu thay đổi cho thiết bị này?',
          confirmText: 'Lưu thay đổi',
          cancelText: 'Hủy',
          onConfirm: async () => {
            try {
              const res = await fetch(`${API_BASE}/api/devices/${selectedDevice.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await res.json();
              if (!res.ok || !data?.success) throw new Error(data?.message || 'Cập nhật thiết bị thất bại');
              setShowEditModal(false);
              setSelectedDevice(null);
              await fetchDevices();
              setSuccessModal({ open: true, title: 'Đã lưu', message: 'Cập nhật thiết bị thành công.' });
            } catch (err) {
              console.error('Lỗi lưu thiết bị:', err);
            } finally {
              setConfirmModal(prev => ({ ...prev, open: false }));
            }
          }
        });
      }
      
      // Reset form
      setFormData({
        deviceName: '',
        deviceType: 'rfid',
        location: '',
        ipAddress: '',
        macAddress: '',
        status: 'active',
        lastSeen: '',
        description: ''
      });
    } catch (err) {
      console.error('Lỗi lưu thiết bị:', err);
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
    setSelectedDevice(null);
    setFormData({
      deviceName: '',
      deviceType: 'rfid',
      location: '',
      status: 'active',
      lastSeen: '',
      description: ''
    });
  };

  // Lọc thiết bị theo trạng thái và tìm kiếm
  const filteredDevices = devices.filter(device => {
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    const matchesSearch = device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.ipAddress.includes(searchTerm);
    
    return matchesStatus && matchesSearch;
  });

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
    return filteredDevices.slice(startIndex, endIndex);
  };

  // Tính tổng số trang
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);

  // Thống kê
  const totalDevices = devices.length;
  const activeDevices = devices.filter(d => d.status === 'active').length;
  const inactiveDevices = devices.filter(d => d.status === 'inactive').length;
  const maintenanceDevices = devices.filter(d => d.status === 'maintenance').length;

  // Format trạng thái
  const formatStatus = (status) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'maintenance': return 'Bảo trì';
      default: return 'Không xác định';
    }
  };

  // Format trạng thái kết nối
  const formatConnectionStatus = (status) => {
    switch (status) {
      case 'connected': return 'Đã kết nối';
      case 'disconnected': return 'Mất kết nối';
      case 'maintenance': return 'Bảo trì';
      default: return 'Không xác định';
    }
  };

  // Định nghĩa các cột có thể ẩn/hiện (đã loại bỏ IP Address, Kết nối, Lần cuối)
  const columnDefinitions = [
    { key: 'stt', label: 'STT', width: '60px' },
    { key: 'deviceName', label: 'Tên thiết bị', width: '200px' },
    { key: 'deviceType', label: 'Loại', width: '100px' },
    { key: 'location', label: 'Vị trí', width: '150px' },
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
            render: (_, index) => (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {index + 1}
              </span>
            )
          };
        case 'deviceName':
          return {
            key: 'deviceName',
            label: 'Tên thiết bị',
            visible: true,
            render: (device) => (
              <div>
                <div className="text-sm font-medium text-gray-900">{device.deviceName}</div>
                <div className="text-sm text-gray-500">{device.description}</div>
              </div>
            )
          };
        case 'deviceType':
          return {
            key: 'deviceType',
            label: 'Loại',
            visible: true,
            render: (device) => (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                RFID
              </span>
            )
          };
        case 'location':
          return {
            key: 'location',
            label: 'Vị trí',
            visible: true,
            render: (device) => device.location
          };
        case 'ipAddress':
          return {
            key: 'ipAddress',
            label: 'IP Address',
            visible: true,
            render: (device) => device.ipAddress
          };
        case 'status':
          return {
            key: 'status',
            label: 'Trạng thái',
            visible: true,
            render: (device) => (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                device.status === 'active' ? 'bg-green-100 text-green-800' :
                device.status === 'inactive' ? 'bg-red-100 text-red-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {formatStatus(device.status)}
              </span>
            )
          };
        case 'connectionStatus':
          return {
            key: 'connectionStatus',
            label: 'Kết nối',
            visible: true,
            render: (device) => (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                device.connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                device.connectionStatus === 'disconnected' ? 'bg-red-100 text-red-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {formatConnectionStatus(device.connectionStatus)}
              </span>
            )
          };
        case 'lastSeen':
          return {
            key: 'lastSeen',
            label: 'Lần cuối',
            visible: true,
            render: (device) => (
              <div className="flex items-center">
                <FaClock className="text-gray-400 mr-1" size={12} />
                <span className="text-sm text-gray-900">{device.lastSeen}</span>
              </div>
            )
          };
        case 'actions':
          return {
            key: 'actions',
            label: 'Thao tác',
            visible: true,
            render: (device) => (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditDevice(device)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Chỉnh sửa"
                >
                  <FaEdit size={14} />
                </button>
                <button
                  onClick={() => handleDeleteDevice(device.id)}
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
                  <FaDesktop className="text-blue-600 text-xl" />
                </div>
                <div>
                  <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                    Quản lý thiết bị
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Quản lý các thiết bị IoT RFID trong hệ thống điểm danh
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <div className="loading-spinner"></div>
                <p className="mt-4 text-gray-600">Đang tải danh sách thiết bị...</p>
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
                  <FaDesktop className="text-blue-600 text-xl" />
                </div>
                <div>
                  <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                    Quản lý thiết bị
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Quản lý các thiết bị IoT RFID trong hệ thống điểm danh
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
                <Button onClick={fetchDevices} variant="primary">
                  Thử lại
                </Button>
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
                <FaDesktop className="text-blue-600 text-xl" />
              </div>
              <div>
                <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                  Quản lý thiết bị
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Quản lý các thiết bị IoT RFID trong hệ thống điểm danh
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Bộ lọc và tìm kiếm */}
        <Card className="mb-6">
          <CardTitle level="h3" className="text-lg mb-4">
            Bộ lọc và tìm kiếm
          </CardTitle>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên thiết bị, vị trí hoặc IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
              </div>
              
              <Button onClick={fetchDevices} variant="outline" size="sm">
                Làm mới
              </Button>
            </div>
          </div>
        </Card>

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
                <p className="text-sm text-gray-500 mt-1">Tổng hợp thông tin về thiết bị IoT RFID</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tổng thiết bị */}
            <Card className="stat-card stat-card-primary">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">Tổng thiết bị</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalDevices}</p>
                    <p className="text-xs text-gray-500 mt-1">Tất cả thiết bị</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-full mt-2 sm:mt-0 self-start">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Đang hoạt động */}
            <Card className="stat-card stat-card-success">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">Đang hoạt động</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{activeDevices}</p>
                    <p className="text-xs text-gray-500 mt-1">Thiết bị hoạt động</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full mt-2 sm:mt-0 self-start">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Không hoạt động */}
            <Card className="stat-card stat-card-warning">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-red-600 mb-1">Không hoạt động</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{inactiveDevices}</p>
                    <p className="text-xs text-gray-500 mt-1">Thiết bị tạm dừng</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-red-100 rounded-full mt-2 sm:mt-0 self-start">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Đang bảo trì */}
            <Card className="stat-card stat-card-info">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-orange-600 mb-1">Đang bảo trì</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{maintenanceDevices}</p>
                    <p className="text-xs text-gray-500 mt-1">Thiết bị bảo trì</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-orange-100 rounded-full mt-2 sm:mt-0 self-start">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bảng thiết bị với header tích hợp */}
        <StandardTable
          title="Danh sách thiết bị"
          subtitle={`Tổng cộng: ${filteredDevices.length} thiết bị`}
          icon={FaDesktop}
          columns={tableColumns}
          data={getPaginatedData()}
          actionButton={{
            text: "Thêm thiết bị",
            icon: <FaPlus />,
            onClick: handleAddDevice,
            variant: "primary"
          }}
          emptyState={
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FaDesktop size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy thiết bị nào</h3>
              <p className="text-gray-600">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
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
          totalItems={filteredDevices.length}
          itemsPerPageOptions={[5, 10, 20, 50]}
        />

        {/* Modal thêm thiết bị */}
        {showAddModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Thêm thiết bị mới</h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label>Tên thiết bị *</label>
                  <input
                    type="text"
                    name="deviceName"
                    value={formData.deviceName}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập tên thiết bị"
                  />
                </div>
                
                <div className="form-group">
                  <label>Loại thiết bị</label>
                  <select
                    name="deviceType"
                    value={formData.deviceType}
                    onChange={handleInputChange}
                  >
                    <option value="rfid">RFID Reader</option>
                    <option value="camera">Camera</option>
                    <option value="sensor">Sensor</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Vị trí *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập vị trí lắp đặt"
                  />
                </div>
                
                {/* Bỏ IP/MAC theo yêu cầu */}
                
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chức năng và mục đích sử dụng"
                    rows="3"
                  />
                </div>
                
                <div className="modal-footer">
                  <Button type="button" onClick={closeModal} variant="outline">
                    Hủy
                  </Button>
                  <Button type="submit" variant="primary">
                    Thêm thiết bị
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal sửa thiết bị */}
        {showEditModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Sửa thiết bị</h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label>Tên thiết bị *</label>
                  <input
                    type="text"
                    name="deviceName"
                    value={formData.deviceName}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập tên thiết bị"
                  />
                </div>
                
                <div className="form-group">
                  <label>Loại thiết bị</label>
                  <select
                    name="deviceType"
                    value={formData.deviceType}
                    onChange={handleInputChange}
                  >
                    <option value="rfid">RFID Reader</option>
                    <option value="camera">Camera</option>
                    <option value="sensor">Sensor</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Vị trí *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập vị trí lắp đặt"
                  />
                </div>
                
                {/* Bỏ IP/MAC theo yêu cầu */}
                
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả chức năng và mục đích sử dụng"
                    rows="3"
                  />
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

        {/* Modal xác nhận trung tâm */}
        {confirmModal.open && (
          <div className="modal-overlay" onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{confirmModal.title}</h3>
                <button className="modal-close" onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>×</button>
              </div>
              <div className="modal-body">
                <p className="text-center text-gray-700 text-base">{confirmModal.message}</p>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
                <Button type="button" variant="outline" onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>
                  {confirmModal.cancelText || 'Hủy'}
                </Button>
                <Button type="button" variant="primary" onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}>
                  {confirmModal.confirmText || 'Xác nhận'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal thông báo thành công giữa màn hình */}
        {successModal.open && (
          <div className="modal-overlay" onClick={() => setSuccessModal(prev => ({ ...prev, open: false }))}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{successModal.title || 'Thành công'}</h3>
                <button className="modal-close" onClick={() => setSuccessModal(prev => ({ ...prev, open: false }))}>×</button>
              </div>
              <div className="modal-body">
                <div className="text-center">
                  <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#16a34a' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p className="text-gray-700 text-base">{successModal.message}</p>
                </div>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'center' }}>
                <Button type="button" variant="primary" onClick={() => setSuccessModal(prev => ({ ...prev, open: false }))}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default DeviceManagement;
