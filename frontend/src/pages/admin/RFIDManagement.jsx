
// export default RFIDManagement;
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { FaPlus, FaEdit, FaTrash, FaUser, FaIdCard, FaCheck, FaTimes, FaInbox } from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';
import Button from '../../components/Button';
import Card, { CardTitle, CardContent } from '../../components/Card';

const computeApiBase = () => {
  const envBase = process.env.REACT_APP_API_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const origin = window.location.origin;
  if (origin.includes(':3000')) return origin.replace(':3000', ':3001');
  return origin;
};
const API_BASE = computeApiBase();

const RFIDManagement = () => {
  const [rfidCards, setRfidCards] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [unassignedCards, setUnassignedCards] = useState([]);
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

  // Socket: kết nối 1 lần
  useEffect(() => {
    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    const onRefresh = (payload) => {
      // console.log('[socket] rfid:refresh', payload);
      loadData();
    };
    socket.on('rfid:refresh', onRefresh);

    // cũng nghe attendanceUpdate (khi UID lạ được thêm từ máy chấm công)
    socket.on('attendanceUpdate', onRefresh);

    // cleanup
    return () => {
      socket.off('rfid:refresh', onRefresh);
      socket.off('attendanceUpdate', onRefresh);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rfidRes, usersRes, uaRes] = await Promise.all([
        fetch(`${API_BASE}/api/rfid`),
        fetch(`${API_BASE}/api/rfid/available-users`),
        fetch(`${API_BASE}/api/rfid/unassigned`)
      ]);

      const [rfidJson, usersJson, uaJson] = await Promise.all([
        rfidRes.json(),
        usersRes.json(),
        uaRes.json()
      ]);

      setRfidCards(Array.isArray(rfidJson.data) ? rfidJson.data : []);
      setEmployees(Array.isArray(usersJson.data) ? usersJson.data : []);
      setUnassignedCards(Array.isArray(uaJson.data) ? uaJson.data : []);
    } catch (e) {
      console.error('Load RFID data error:', e);
      setRfidCards([]); setEmployees([]); setUnassignedCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!formData.cardCode) {
      alert('Vui lòng chọn một thẻ chưa gán');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/rfid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardCode: formData.cardCode, status: formData.status })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setShowAddModal(false);
        setFormData({ cardCode: '', status: 'active', assignedTo: '' });
        alert('Thêm thẻ thành công!');
      } else {
        alert(data.message || 'Có lỗi xảy ra khi thêm thẻ');
      }
    } catch (e) {
      console.error('Lỗi thêm thẻ:', e);
      alert('Có lỗi xảy ra khi thêm thẻ');
    }
  };

  const handleEditCard = async () => {
    if (!formData.cardCode.trim()) {
      alert('Vui lòng nhập mã thẻ');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/rfid/${selectedCard.cardCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCardCode: formData.cardCode, status: formData.status })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setShowEditModal(false);
        setSelectedCard(null);
        setFormData({ cardCode: '', status: 'active', assignedTo: '' });
        alert('Cập nhật thẻ thành công!');
      } else {
        alert(data.message || 'Có lỗi xảy ra khi cập nhật thẻ');
      }
    } catch (e) {
      console.error('Lỗi cập nhật thẻ:', e);
      alert('Có lỗi xảy ra khi cập nhật thẻ');
    }
  };

  // const handleDeleteCard = async (cardId) => {
  //   if (!window.confirm('Bạn có chắc chắn muốn xóa thẻ này?')) return;
  //   try {
  //     const res = await fetch(`${API_BASE}/api/rfid/${cardId}`, { method: 'DELETE' });
  //     const data = await res.json();
  //     if (data.success) {
  //       await loadData();
  //       alert('Xóa thẻ thành công!');
  //     } else {
  //       alert(data.message || 'Có lỗi xảy ra khi xóa thẻ');
  //     }
  //   } catch (e) {
  //     console.error('Lỗi xóa thẻ:', e);
  //     alert('Có lỗi xảy ra khi xóa thẻ');
  //   }
  // };
  const handleDeleteCard = async (card) => {
    // Cảnh báo khác nhau tùy trạng thái
    const warn = card.hasOpenAttendance
      ? '⚠️ CẢNH BÁO: Thẻ này đang được dùng để chấm công (chưa check-out). Thao tác xóa sẽ bị từ chối.'
      : 'Bạn có chắc chắn muốn xóa thẻ này?';

    if (!window.confirm(warn)) return;

    try {
      const res = await fetch(`${API_BASE}/api/rfid/${card.cardCode}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        await loadData();
        alert('Xóa thẻ thành công!');
      } else {
        // Hiển thị lý do từ server (ví dụ: đang chấm công -> 409)
        alert(data.message || 'Có lỗi xảy ra khi xóa thẻ');
      }
    } catch (e) {
      console.error('Lỗi xóa thẻ:', e);
      alert('Có lỗi xảy ra khi xóa thẻ');
    }
  };


  const handleAssignCard = async () => {
    if (!formData.assignedTo) { alert('Vui lòng chọn nhân viên'); return; }
    try {
      const res = await fetch(`${API_BASE}/api/rfid/${selectedCard.cardCode}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(formData.assignedTo, 10) })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadData();
        setShowAssignModal(false);
        setSelectedCard(null);
        setFormData({ cardCode: '', status: 'active', assignedTo: '' });
        alert('Gán thẻ thành công!');
      } else {
        alert(data.message || 'Có lỗi xảy ra khi gán thẻ');
      }
    } catch (e) {
      console.error('Lỗi gán thẻ:', e);
      alert('Có lỗi xảy ra khi gán thẻ');
    }
  };


  // Modals helpers
  const openAddModal = () => {
    const defaultCode = unassignedCards.length > 0 ? (unassignedCards[0].cardCode || unassignedCards[0].rfid_uid) : '';
    setFormData({ cardCode: defaultCode, status: 'active', assignedTo: '' });
    setShowAddModal(true);
  };
  const openEditModal = (card) => {
    setSelectedCard(card);
    setFormData({ cardCode: card.cardCode, status: card.status, assignedTo: '' });
    setShowEditModal(true);
  };
  const openAssignModal = (card) => {
    setSelectedCard(card);
    setFormData({
      cardCode: card.cardCode,
      status: card.status,
      assignedTo: card.assignedToId ? String(card.assignedToId) : ''
    });
    setShowAssignModal(true);
  };
  const closeAllModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowAssignModal(false);
    setSelectedCard(null);
    setFormData({ cardCode: '', status: 'active', assignedTo: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaIdCard className="text-blue-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h1" className="text-2xl font-bold text-gray-900">Quản lý thẻ RFID</CardTitle>
              <p className="text-gray-600 mt-1">Quản lý thẻ RFID và gán thẻ cho nhân viên</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-lg">
        <div className="flex items-center justify-between p-6 pb-0">
          <CardTitle level="h2" className="text-xl font-bold text-gray-800">📋 Danh sách thẻ RFID</CardTitle>
          <Button variant="primary" onClick={openAddModal} className="flex items-center">
            <FaPlus className="mr-2" /> Thêm thẻ mới
          </Button>
        </div>
        <CardContent className="p-6 pt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Mã thẻ</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Trạng thái hoạt động</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Gán cho ai</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
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
                    <tr key={card.id || card.cardCode} className="hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100">
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-gray-800 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto">{index + 1}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-600 text-lg bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">{card.cardCode}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex justify-start">
                          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${card.status === 'active'
                            ? 'bg-green-100 text-green-800 border-2 border-green-300'
                            : 'bg-red-100 text-red-800 border-2 border-red-300'
                            }`}>
                            {card.status === 'active' ? (<><FaCheck className="mr-2 text-green-600" />Hoạt động</>) : (<><FaTimes className="mr-2 text-red-600" />Không hoạt động</>)}
                          </span>
                        </div>
                      </td>
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
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <Button variant="secondary" size="sm" onClick={() => openEditModal(card)} className="flex items-center px-3 py-2 font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                            <FaEdit className="mr-1" /> Sửa
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => !card.isAssigned && openAssignModal(card)}
                            className="flex items-center px-3 py-2 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                            disabled={card.isAssigned}
                            title={card.isAssigned ? 'Thẻ đang được gán cho nhân viên. Hãy hủy gán trước khi gán cho người khác.' : 'Gán thẻ cho nhân viên'}
                          >
                            <FaUser className="mr-1" /> Gán
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteCard(card)}   // <— trước đây là (card.id)
                            className="flex items-center px-3 py-2 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <FaTrash className="mr-1" /> Xóa
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

      {/* Modal thêm thẻ mới → CHỌN từ danh sách thẻ chưa gán */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center">
                <FaPlus className="text-2xl mr-3" />
                <h3 className="text-xl font-bold">Thêm thẻ RFID mới</h3>
              </div>
              <p className="text-blue-100 mt-1">Chọn UID thẻ chưa gán để thêm vào hệ thống</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaIdCard className="inline mr-2" />
                  Chọn thẻ chưa gán *
                </label>
                <select
                  value={formData.cardCode}
                  onChange={(e) => setFormData({ ...formData, cardCode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  disabled={unassignedCards.length === 0}
                >
                  {unassignedCards.length === 0 ? (
                    <option value="">(Không có thẻ trống nào)</option>
                  ) : (
                    <>
                      <option value="">-- Chọn UID --</option>
                      {unassignedCards.map((c) => {
                        const code = c.cardCode || c.rfid_uid;
                        const text = `${code}${c.status ? ` (${c.status})` : ''}`;
                        return <option key={code} value={code}>{text}</option>;
                      })}
                    </>
                  )}
                </select>
                {unassignedCards.length === 0 && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <FaInbox className="mr-1" /> Không có thẻ chưa gán. Hãy quét thẻ mới để hệ thống tự lưu UID.
                  </div>
                )}
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

            <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={closeAllModals} className="px-6">Hủy</Button>
                <Button
                  variant="primary"
                  onClick={handleAddCard}
                  className="px-6"
                  disabled={!formData.cardCode || unassignedCards.length === 0}
                >
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
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center">
                <FaEdit className="text-2xl mr-3" />
                <h3 className="text-xl font-bold">Sửa thông tin thẻ RFID</h3>
              </div>
              <p className="text-orange-100 mt-1">Cập nhật thông tin thẻ RFID trong hệ thống</p>
            </div>
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
                  placeholder="Nhập mã thẻ (VD: 9375790C)"
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
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={closeAllModals} className="px-6">Hủy</Button>
                <Button variant="primary" onClick={handleEditCard} className="px-6">
                  <FaEdit className="mr-2" /> Cập nhật
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal gán thẻ */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center">
                <FaUser className="text-2xl mr-3" />
                <h3 className="text-xl font-bold">Gán thẻ cho nhân viên</h3>
              </div>
              <p className="text-green-100 mt-1">Chọn nhân viên để gán thẻ RFID</p>
            </div>
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
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      👤 {employee.name} - {employee.position}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={closeAllModals} className="px-6">Hủy</Button>
                <Button variant="primary" onClick={handleAssignCard} className="px-6">
                  <FaUser className="mr-2" /> Gán thẻ
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
