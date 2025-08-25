import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminButton from '../../components/AdminButton';
import { FaDesktop, FaPlus, FaEdit, FaTrash, FaWifi, FaExclamationTriangle, FaCheckCircle, FaClock } from 'react-icons/fa';
import './DeviceManagement.css';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Dữ liệu mẫu cho thiết bị IoT RFID
  const sampleDevices = [
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
  ];

  useEffect(() => {
    // Giả lập API call
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
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
  };

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

  if (loading) {
    return (
      <AdminLayout
        title="Quản lý thiết bị"
        subtitle="Quản lý các thiết bị IoT RFID trong hệ thống điểm danh"
        icon={FaDesktop}
      >
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách thiết bị...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout
        title="Quản lý thiết bị"
        subtitle="Quản lý các thiết bị IoT RFID trong hệ thống điểm danh"
        icon={FaDesktop}
      >
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h3>Đã xảy ra lỗi</h3>
          <p>{error}</p>
          <AdminButton onClick={fetchDevices} variant="primary">
            Thử lại
          </AdminButton>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Quản lý thiết bị"
      subtitle="Quản lý các thiết bị IoT RFID trong hệ thống điểm danh"
      icon={FaDesktop}
    >
      <div className="device-management-container">
        {/* Bộ lọc và tìm kiếm */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên thiết bị, vị trí hoặc IP..."
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
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="maintenance">Bảo trì</option>
              </select>
            </div>
            
            <AdminButton onClick={fetchDevices} variant="outline" size="small">
              Làm mới
            </AdminButton>
          </div>
        </div>

        {/* Thống kê */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{totalDevices}</div>
            <div className="stat-label">Tổng thiết bị</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{activeDevices}</div>
            <div className="stat-label">Đang hoạt động</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{inactiveDevices}</div>
            <div className="stat-label">Không hoạt động</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{maintenanceDevices}</div>
            <div className="stat-label">Đang bảo trì</div>
          </div>
        </div>

        {/* Header và nút thêm */}
        <div className="section-header">
          <div className="header-content">
            <h3>Danh sách thiết bị</h3>
            <p>Tổng cộng: {filteredDevices.length} thiết bị</p>
          </div>
          <AdminButton onClick={handleAddDevice} variant="primary" icon={FaPlus}>
            Thêm thiết bị
          </AdminButton>
        </div>

        {/* Bảng thiết bị */}
        <div className="table-container">
          <table className="devices-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên thiết bị</th>
                <th>Loại</th>
                <th>Vị trí</th>
                <th>IP Address</th>
                <th>Trạng thái</th>
                <th>Kết nối</th>
                <th>Lần cuối</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    <div className="no-data-content">
                      <p>Không tìm thấy thiết bị nào</p>
                      <p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device, index) => (
                  <tr key={device.id} className="device-row">
                    <td className="device-stt">
                      <span className="stt-badge">{index + 1}</span>
                    </td>
                    <td className="device-name">
                      <div className="device-info">
                        <strong>{device.deviceName}</strong>
                        <small>{device.description}</small>
                      </div>
                    </td>
                    <td className="device-type">
                      <span className="type-badge type-rfid">RFID</span>
                    </td>
                    <td className="device-location">{device.location}</td>
                    <td className="device-ip">{device.ipAddress}</td>
                    <td className="device-status">
                      <span className={`status-badge status-${device.status}`}>
                        {formatStatus(device.status)}
                      </span>
                    </td>
                    <td className="device-connection">
                      <span className={`connection-badge connection-${device.connectionStatus}`}>
                        {formatConnectionStatus(device.connectionStatus)}
                      </span>
                    </td>
                    <td className="device-last-seen">
                      <div className="last-seen-info">
                        <FaClock className="clock-icon" />
                        <span>{device.lastSeen}</span>
                      </div>
                    </td>
                    <td className="device-actions">
                      <div className="action-buttons">
                        <AdminButton
                          onClick={() => handleEditDevice(device)}
                          variant="outline"
                          size="small"
                          icon={FaEdit}
                          title="Sửa thiết bị"
                        />
                        <AdminButton
                          onClick={() => handleDeleteDevice(device.id)}
                          variant="danger"
                          size="small"
                          icon={FaTrash}
                          title="Xóa thiết bị"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                  <AdminButton type="button" onClick={closeModal} variant="outline">
                    Hủy
                  </AdminButton>
                  <AdminButton type="submit" variant="primary">
                    Thêm thiết bị
                  </AdminButton>
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

export default DeviceManagement;
