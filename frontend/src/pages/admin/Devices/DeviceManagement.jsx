import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StandardTable from '../../../components/StandardTable';
import Button from '../../../components/Button';
import Card, { CardTitle, CardContent } from '../../../components/Card';
import { FaDesktop, FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaClock } from 'react-icons/fa';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // State cho việc bật/tắt cột - mặc định ẩn IP, Vị trí, Lần cuối
  const [visibleColumns, setVisibleColumns] = useState({
    stt: true,
    deviceName: true,
    deviceType: true,
    location: false,      // Ẩn mặc định
    ipAddress: false,    // Ẩn mặc định
    status: true,
    connectionStatus: true,
    lastSeen: false,     // Ẩn mặc định
    actions: true
  });

  // Form state cho thêm/sửa thiết bị
  const [formData, setFormData] = useState({
    deviceName: '',
    deviceType: 'rfid',
    location: '',
    ipAddress: '',
    macAddress: '',
    status: 'active',
    lastSeen: '',
    description: ''
  });

  // Dữ liệu mẫu cho thiết bị IoT RFID - sử dụng useMemo để tránh re-render
  const sampleDevices = useMemo(() => [
    {
      id: 1,
      deviceName: 'RFID Reader - Cổng chính',
      deviceType: 'rfid',
      location: 'Cổng chính - Tầng 1',
      ipAddress: '192.168.1.100',
      macAddress: '00:1B:44:11:3A:B7',
      status: 'active',
      lastSeen: '2024-01-15 14:30:25',
      description: 'Thiết bị đọc thẻ RFID tại cổng chính, phục vụ điểm danh nhân viên',
      connectionStatus: 'connected',
      batteryLevel: 85,
      signalStrength: 'strong'
    },
    {
      id: 2,
      deviceName: 'RFID Reader - Phòng làm việc',
      deviceType: 'rfid',
      location: 'Phòng làm việc - Tầng 2',
      ipAddress: '192.168.1.101',
      macAddress: '00:1B:44:11:3A:B8',
      status: 'active',
      lastSeen: '2024-01-15 14:28:15',
      description: 'Thiết bị đọc thẻ RFID tại phòng làm việc, hỗ trợ điểm danh nội bộ',
      connectionStatus: 'connected',
      batteryLevel: 92,
      signalStrength: 'strong'
    },
    {
      id: 3,
      deviceName: 'RFID Reader - Canteen',
      deviceType: 'rfid',
      location: 'Canteen - Tầng 1',
      ipAddress: '192.168.1.102',
      macAddress: '00:1B:44:11:3A:B9',
      status: 'inactive',
      lastSeen: '2024-01-15 12:15:30',
      description: 'Thiết bị đọc thẻ RFID tại canteen, quản lý giờ ăn trưa',
      connectionStatus: 'disconnected',
      batteryLevel: 45,
      signalStrength: 'weak'
    },
    {
      id: 4,
      deviceName: 'RFID Reader - Bãi xe',
      deviceType: 'rfid',
      location: 'Bãi xe - Tầng hầm',
      ipAddress: '192.168.1.103',
      macAddress: '00:1B:44:11:3A:BA',
      status: 'maintenance',
      lastSeen: '2024-01-15 10:45:12',
      description: 'Thiết bị đọc thẻ RFID tại bãi xe, quản lý ra vào xe',
      connectionStatus: 'maintenance',
      batteryLevel: 78,
      signalStrength: 'medium'
    }
  ], []);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Giả lập delay API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sử dụng dữ liệu mẫu
      setDevices(sampleDevices);
    } catch (err) {
      setError('Lỗi khi tải danh sách thiết bị');
      console.error('Lỗi fetch devices:', err);
    } finally {
      setLoading(false);
    }
  }, [sampleDevices]);

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
      ipAddress: device.ipAddress,
      macAddress: device.macAddress,
      status: device.status,
      lastSeen: device.lastSeen,
      description: device.description
    });
    setShowEditModal(true);
  };

  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      try {
        // Giả lập API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setDevices(devices.filter(device => device.id !== deviceId));
      } catch (err) {
        console.error('Lỗi xóa thiết bị:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (showAddModal) {
        // Thêm thiết bị mới
        const newDevice = {
          id: Date.now(),
          ...formData,
          lastSeen: new Date().toLocaleString('vi-VN'),
          connectionStatus: 'connected',
          batteryLevel: 100,
          signalStrength: 'strong'
        };
        
        setDevices([...devices, newDevice]);
        setShowAddModal(false);
      } else {
        // Cập nhật thiết bị
        const updatedDevices = devices.map(device => 
          device.id === selectedDevice.id ? { ...device, ...formData } : device
        );
        
        setDevices(updatedDevices);
        setShowEditModal(false);
        setSelectedDevice(null);
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
      ipAddress: '',
      macAddress: '',
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

  // Định nghĩa các cột có thể ẩn/hiện
  const columnDefinitions = [
    { key: 'stt', label: 'STT', width: '60px' },
    { key: 'deviceName', label: 'Tên thiết bị', width: '200px' },
    { key: 'deviceType', label: 'Loại', width: '100px' },
    { key: 'location', label: 'Vị trí', width: '150px' },
    { key: 'ipAddress', label: 'IP Address', width: '120px' },
    { key: 'status', label: 'Trạng thái', width: '120px' },
    { key: 'connectionStatus', label: 'Kết nối', width: '120px' },
    { key: 'lastSeen', label: 'Lần cuối', width: '150px' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{totalDevices}</div>
              <div className="text-sm text-gray-600">Tổng thiết bị</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{activeDevices}</div>
              <div className="text-sm text-gray-600">Đang hoạt động</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{inactiveDevices}</div>
              <div className="text-sm text-gray-600">Không hoạt động</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{maintenanceDevices}</div>
              <div className="text-sm text-gray-600">Đang bảo trì</div>
            </div>
          </Card>
        </div>

        {/* Header và nút thêm */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Danh sách thiết bị</h3>
              <p className="text-sm text-gray-600 mt-1">Tổng cộng: {filteredDevices.length} thiết bị</p>
            </div>
            <Button onClick={handleAddDevice} variant="primary" icon={<FaPlus />}>
              Thêm thiết bị
            </Button>
          </div>
        </div>

        {/* Bảng thiết bị */}
        <StandardTable
          title="Danh sách thiết bị"
          subtitle={`Tổng cộng: ${filteredDevices.length} thiết bị`}
          icon={FaDesktop}
          columns={tableColumns}
          data={filteredDevices}
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
                
                <div className="form-row">
                  <div className="form-group">
                    <label>IP Address *</label>
                    <input
                      type="text"
                      name="ipAddress"
                      value={formData.ipAddress}
                      onChange={handleInputChange}
                      required
                      placeholder="192.168.1.100"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>MAC Address</label>
                    <input
                      type="text"
                      name="macAddress"
                      value={formData.macAddress}
                      onChange={handleInputChange}
                      placeholder="00:1B:44:11:3A:B7"
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
                
                <div className="form-row">
                  <div className="form-group">
                    <label>IP Address *</label>
                    <input
                      type="text"
                      name="ipAddress"
                      value={formData.ipAddress}
                      onChange={handleInputChange}
                      required
                      placeholder="192.168.1.100"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>MAC Address</label>
                    <input
                      type="text"
                      name="macAddress"
                      value={formData.macAddress}
                      onChange={handleInputChange}
                      placeholder="00:1B:44:11:3A:B7"
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
    </div>
  );
};

export default DeviceManagement;
