import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUser, FaIdCard, FaCheck, FaTimes } from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';
import Button from '../../components/Button';
import Card, { CardTitle, CardContent, CardActions } from '../../components/Card';
import StandardTable from '../../components/StandardTable';

/**
 * Trang quản lý thẻ RFID cho admin
 * Bao gồm: thêm, sửa, xóa, gán thẻ cho nhân viên
 */
const RFIDManagement = () => {
  // State quản lý dữ liệu
  const [rfidCards, setRfidCards] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [formData, setFormData] = useState({
    cardCode: '',
    status: 'active',
    assignedTo: ''
  });


  // Load dữ liệu khi component mount
  useEffect(() => {
    console.log('Component RFIDManagement mounted, đang load dữ liệu...');
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Xác định API base URL
      const computeApiBase = () => {
        const envBase = process.env.REACT_APP_API_BASE_URL;
        if (envBase) return envBase.replace(/\/$/, '');
        const origin = window.location.origin;
        if (origin.includes(':3000')) return origin.replace(':3000', ':3001');
        return origin;
      };
      const API_BASE = computeApiBase();
      console.log('API Base URL:', API_BASE);

      // Gọi API lấy danh sách thẻ RFID
      console.log('Đang gọi API:', `${API_BASE}/api/rfid`);
      const rfidResponse = await fetch(`${API_BASE}/api/rfid`);
      const rfidData = await rfidResponse.json();
      
      console.log('Response từ API RFID:', rfidData);

      if (rfidData.success && rfidData.data) {
        console.log('Dữ liệu thẻ RFID:', rfidData.data);
        console.log('Số lượng thẻ:', rfidData.count);
        // Đảm bảo data là array
        const cardsData = Array.isArray(rfidData.data) ? rfidData.data : [];
        setRfidCards(cardsData);
      } else {
        console.error('Lỗi API RFID:', rfidData.message);
        setRfidCards([]);
      }

      // Gọi API lấy danh sách nhân viên chưa gán thẻ
      console.log('Đang gọi API:', `${API_BASE}/api/rfid/available-users`);
      const usersResponse = await fetch(`${API_BASE}/api/rfid/available-users`);
      const usersData = await usersResponse.json();
      
      console.log('Response từ API Users:', usersData);

      if (usersData.success && usersData.data) {
        console.log('Dữ liệu nhân viên:', usersData.data);
        console.log('Số lượng nhân viên:', usersData.count);
        // Đảm bảo data là array
        const usersDataArray = Array.isArray(usersData.data) ? usersData.data : [];
        setEmployees(usersDataArray);
      } else {
        console.error('Lỗi API Users:', usersData.message);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu thẻ RFID:', error);
      setRfidCards([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thêm thẻ mới
  const handleAddCard = async () => {
    if (!formData.cardCode.trim()) {
      alert('Vui lòng nhập mã thẻ');
      return;
    }

    try {
      // Xác định API base URL
      const computeApiBase = () => {
        const envBase = process.env.REACT_APP_API_BASE_URL;
        if (envBase) return envBase.replace(/\/$/, '');
        const origin = window.location.origin;
        if (origin.includes(':3000')) return origin.replace(':3000', ':3001');
        return origin;
      };
      const API_BASE = computeApiBase();

      // Gọi API thêm thẻ
      const response = await fetch(`${API_BASE}/api/rfid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardCode: formData.cardCode,
          status: formData.status
        })
      });

      const data = await response.json();

      if (data.success) {
        // Reload dữ liệu sau khi thêm thành công
        await loadData();
        setShowAddModal(false);
        setFormData({ cardCode: '', status: 'active', assignedTo: '' });
        alert('Thêm thẻ thành công!');
      } else {
        alert(data.message || 'Có lỗi xảy ra khi thêm thẻ');
      }
    } catch (error) {
      console.error('Lỗi thêm thẻ:', error);
      alert('Có lỗi xảy ra khi thêm thẻ');
    }
  };

  // Xử lý sửa thẻ
  const handleEditCard = async () => {
    if (!formData.cardCode.trim()) {
      alert('Vui lòng nhập mã thẻ');
      return;
    }

    try {
      // Xác định API base URL
      const computeApiBase = () => {
        const envBase = process.env.REACT_APP_API_BASE_URL;
        if (envBase) return envBase.replace(/\/$/, '');
        const origin = window.location.origin;
        if (origin.includes(':3000')) return origin.replace(':3000', ':3001');
        return origin;
      };
      const API_BASE = computeApiBase();

      // Gọi API cập nhật thẻ
      const response = await fetch(`${API_BASE}/api/rfid/${selectedCard.cardCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newCardCode: formData.cardCode,
          status: formData.status
        })
      });

      const data = await response.json();

      if (data.success) {
        // Reload dữ liệu sau khi cập nhật thành công
        await loadData();
        setShowEditModal(false);
        setSelectedCard(null);
        setFormData({ cardCode: '', status: 'active', assignedTo: '' });
        alert('Cập nhật thẻ thành công!');
      } else {
        alert(data.message || 'Có lỗi xảy ra khi cập nhật thẻ');
      }
    } catch (error) {
      console.error('Lỗi cập nhật thẻ:', error);
      alert('Có lỗi xảy ra khi cập nhật thẻ');
    }
  };

  // Xử lý xóa thẻ
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thẻ này?')) {
      return;
    }

    try {
      // Xác định API base URL
      const computeApiBase = () => {
        const envBase = process.env.REACT_APP_API_BASE_URL;
        if (envBase) return envBase.replace(/\/$/, '');
        const origin = window.location.origin;
        if (origin.includes(':3000')) return origin.replace(':3000', ':3001');
        return origin;
      };
      const API_BASE = computeApiBase();

      // Gọi API xóa thẻ
      const response = await fetch(`${API_BASE}/api/rfid/${cardId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        // Reload dữ liệu sau khi xóa thành công
        await loadData();
        alert('Xóa thẻ thành công!');
      } else {
        alert(data.message || 'Có lỗi xảy ra khi xóa thẻ');
      }
    } catch (error) {
      console.error('Lỗi xóa thẻ:', error);
      alert('Có lỗi xảy ra khi xóa thẻ');
    }
  };

  // Xử lý gán thẻ cho nhân viên
  const handleAssignCard = async () => {
    if (!formData.assignedTo) {
      alert('Vui lòng chọn nhân viên');
      return;
    }

    try {
      // Xác định API base URL
      const computeApiBase = () => {
        const envBase = process.env.REACT_APP_API_BASE_URL;
        if (envBase) return envBase.replace(/\/$/, '');
        const origin = window.location.origin;
        if (origin.includes(':3000')) return origin.replace(':3000', ':3001');
        return origin;
      };
      const API_BASE = computeApiBase();

      // Gọi API gán thẻ
      const response = await fetch(`${API_BASE}/api/rfid/${selectedCard.cardCode}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(formData.assignedTo)
        })
      });

      const data = await response.json();

      if (data.success) {
        // Reload dữ liệu sau khi gán thành công
        await loadData();
        setShowAssignModal(false);
        setSelectedCard(null);
        setFormData({ cardCode: '', status: 'active', assignedTo: '' });
        alert('Gán thẻ thành công!');
      } else {
        alert(data.message || 'Có lỗi xảy ra khi gán thẻ');
      }
    } catch (error) {
      console.error('Lỗi gán thẻ:', error);
      alert('Có lỗi xảy ra khi gán thẻ');
    }
  };

  // Mở modal thêm thẻ
  const openAddModal = () => {
    setFormData({ cardCode: '', status: 'active', assignedTo: '' });
    setShowAddModal(true);
  };

  // Mở modal sửa thẻ
  const openEditModal = (card) => {
    setSelectedCard(card);
    setFormData({
      cardCode: card.cardCode,
      status: card.status,
      assignedTo: ''
    });
    setShowEditModal(true);
  };

  // Mở modal gán thẻ
  const openAssignModal = (card) => {
    setSelectedCard(card);
    setFormData({
      cardCode: card.cardCode,
      status: card.status,
      assignedTo: card.assignedToId ? card.assignedToId.toString() : ''
    });
    setShowAssignModal(true);
  };

  // Đóng tất cả modal
  const closeAllModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowAssignModal(false);
    setSelectedCard(null);
    setFormData({ cardCode: '', status: 'active', assignedTo: '' });
  };

  // Cấu hình cột cho bảng
  const columns = [
    {
      key: 'stt',
      title: 'STT',
      render: (_, __, index) => (
        <div className="text-center font-medium text-gray-700">
          {index + 1}
        </div>
      ),
      width: '80px'
    },
    {
      key: 'cardCode',
      title: 'Mã thẻ',
      render: (record) => (
        <div className="font-mono font-bold text-blue-600 text-lg">
          {record.cardCode}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Trạng thái hoạt động',
      render: (record) => (
        <div className="flex justify-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
            record.status === 'active' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {record.status === 'active' ? (
              <>
                <FaCheck className="mr-2" />
                Hoạt động
              </>
            ) : (
              <>
                <FaTimes className="mr-2" />
                Không hoạt động
              </>
            )}
          </span>
        </div>
      )
    },
    {
      key: 'assignedTo',
      title: 'Gán cho ai',
      render: (record) => (
        <div className="text-center">
          {record.isAssigned ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-center">
                <FaUser className="text-blue-600 mr-2" />
                <div>
                  <div className="font-semibold text-blue-800">{record.assignedTo}</div>
                  <div className="text-xs text-blue-600">{record.position}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-center text-gray-500">
                <FaIdCard className="mr-2" />
                <span className="font-medium">Chưa gán</span>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (record) => (
        <div className="flex justify-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openEditModal(record)}
            className="flex items-center px-3 py-1"
          >
            <FaEdit className="mr-1" />
            Sửa
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openAssignModal(record)}
            className="flex items-center px-3 py-1"
          >
            <FaUser className="mr-1" />
            Gán
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteCard(record.id)}
            className="flex items-center px-3 py-1"
          >
            <FaTrash className="mr-1" />
            Xóa
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaIdCard className="text-blue-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                Quản lý thẻ RFID
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Quản lý thẻ RFID và gán thẻ cho nhân viên
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bảng danh sách thẻ RFID */}
      <Card className="shadow-lg">
        <div className="flex items-center justify-between p-6 pb-0">
          <CardTitle level="h2" className="text-xl font-bold text-gray-800">
            📋 Danh sách thẻ RFID
          </CardTitle>
          <Button
            variant="primary"
            onClick={openAddModal}
            className="flex items-center"
          >
            <FaPlus className="mr-2" />
            Thêm thẻ mới
          </Button>
        </div>
        <CardContent className="p-6 pt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Table Header */}
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    STT
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    Mã thẻ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    Trạng thái hoạt động
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    Gán cho ai
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    Hành động
                  </th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="bg-white divide-y divide-gray-100">
                {console.log('Render rfidCards:', rfidCards, 'Length:', rfidCards.length, 'Loading:', loading)}
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : rfidCards && rfidCards.length > 0 ? (
                  rfidCards.map((card, index) => (
                  <tr key={card.id} className="hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100">
                    {/* STT */}
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <div className="text-sm font-semibold text-gray-800 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto">
                        {index + 1}
                      </div>
                    </td>
                    
                    {/* Mã thẻ */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="font-mono font-bold text-blue-600 text-lg bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                        {card.cardCode}
                      </div>
                    </td>
                    
                    {/* Trạng thái hoạt động */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex justify-start">
                        <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${
                          card.status === 'active' 
                            ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                            : 'bg-red-100 text-red-800 border-2 border-red-300'
                        }`}>
                          {card.status === 'active' ? (
                            <>
                              <FaCheck className="mr-2 text-green-600" />
                              Hoạt động
                            </>
                          ) : (
                            <>
                              <FaTimes className="mr-2 text-red-600" />
                              Không hoạt động
                            </>
                          )}
                        </span>
                      </div>
                    </td>
                    
                    {/* Gán cho ai */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      {card.isAssigned ? (
                        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 max-w-xs shadow-sm">
                          <div className="flex items-center">
                            <FaUser className="text-blue-600 mr-3 flex-shrink-0 text-lg" />
                            <div>
                              <div className="font-bold text-blue-800 text-sm">{card.assignedTo}</div>
                              <div className="text-xs text-blue-600 font-medium">{card.position}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 max-w-xs shadow-sm">
                          <div className="flex items-center text-gray-500">
                            <FaIdCard className="mr-3 flex-shrink-0 text-lg" />
                            <span className="font-bold text-sm">Chưa gán</span>
                          </div>
                        </div>
                      )}
                    </td>
                    
                    {/* Hành động */}
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(card)}
                          className="flex items-center px-3 py-2 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <FaEdit className="mr-1" />
                          Sửa
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openAssignModal(card)}
                          className="flex items-center px-3 py-2 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <FaUser className="mr-1" />
                          Gán
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteCard(card.id)}
                          className="flex items-center px-3 py-2 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <FaTrash className="mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <FaIdCard className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có thẻ RFID nào</h3>
                      <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách thêm thẻ RFID mới.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal thêm thẻ mới */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center">
                <FaPlus className="text-2xl mr-3" />
                <h3 className="text-xl font-bold">Thêm thẻ RFID mới</h3>
              </div>
              <p className="text-blue-100 mt-1">Nhập thông tin thẻ RFID để thêm vào hệ thống</p>
            </div>
            
            {/* Form */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaIdCard className="inline mr-2" />
                  Mã thẻ *
                </label>
                <input
                  type="text"
                  value={formData.cardCode}
                  onChange={(e) => setFormData({ ...formData, cardCode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Nhập mã thẻ (VD: RF001)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaCheck className="inline mr-2" />
                  Tình trạng hoạt động
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="active">✅ Hoạt động</option>
                  <option value="inactive">❌ Không hoạt động</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={closeAllModals} className="px-6">
                  Hủy
                </Button>
                <Button variant="primary" onClick={handleAddCard} className="px-6">
                  <FaPlus className="mr-2" />
                  Thêm thẻ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa thẻ */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center">
                <FaEdit className="text-2xl mr-3" />
                <h3 className="text-xl font-bold">Sửa thông tin thẻ RFID</h3>
              </div>
              <p className="text-orange-100 mt-1">Cập nhật thông tin thẻ RFID trong hệ thống</p>
            </div>
            
            {/* Form */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaIdCard className="inline mr-2" />
                  Mã thẻ *
                </label>
                <input
                  type="text"
                  value={formData.cardCode}
                  onChange={(e) => setFormData({ ...formData, cardCode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  placeholder="Nhập mã thẻ (VD: RF001)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaCheck className="inline mr-2" />
                  Tình trạng hoạt động
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                >
                  <option value="active">✅ Hoạt động</option>
                  <option value="inactive">❌ Không hoạt động</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={closeAllModals} className="px-6">
                  Hủy
                </Button>
                <Button variant="primary" onClick={handleEditCard} className="px-6">
                  <FaEdit className="mr-2" />
                  Cập nhật
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal gán thẻ cho nhân viên */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center">
                <FaUser className="text-2xl mr-3" />
                <h3 className="text-xl font-bold">Gán thẻ cho nhân viên</h3>
              </div>
              <p className="text-green-100 mt-1">Chọn nhân viên để gán thẻ RFID</p>
            </div>
            
            {/* Form */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaIdCard className="inline mr-2" />
                  Mã thẻ
                </label>
                <input
                  type="text"
                  value={formData.cardCode}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaUser className="inline mr-2" />
                  Chọn nhân viên *
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      👤 {employee.name} - {employee.position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={closeAllModals} className="px-6">
                  Hủy
                </Button>
                <Button variant="primary" onClick={handleAssignCard} className="px-6">
                  <FaUser className="mr-2" />
                  Gán thẻ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFIDManagement;
