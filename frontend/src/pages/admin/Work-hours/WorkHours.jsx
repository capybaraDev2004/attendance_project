import React, { useState, useEffect, useCallback } from 'react';
import StandardTable from '../../../components/StandardTable';
import Button from '../../../components/Button';
import Card, { CardTitle, CardContent } from '../../../components/Card';
import Pagination from '../../../components/Pagination';
import { FaClock, FaExclamationTriangle } from 'react-icons/fa';

// ===== Cấu hình & Helpers đặt ngoài component để ổn định tham chiếu (fix ESLint deps) =====
const STANDARD_HOURS = 8;         // số giờ làm chuẩn trong ngày
const WORK_START = '08:00';       // giờ vào chuẩn để tính muộn/sớm

const toLocalDateISO = (input) => {
  if (!input) return '';
  try {
    if (typeof input === 'string' && (input.includes('T') || input.includes(' '))) {
      const d = new Date(input);
      if (!Number.isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    const d = new Date(input);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
};

const toLocalHHMM = (input) => {
  if (!input) return '';
  try {
    if (input instanceof Date) {
      return input.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (typeof input === 'string') {
      if (input.includes('T') || (input.includes('-') && input.includes(':'))) {
        const d = new Date(input);
        if (!Number.isNaN(d.getTime())) {
          return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
      }
      const m = input.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (m) {
        return `${m[1].padStart(2, '0')}:${m[2]}`;
      }
    }
    const d = new Date(input);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
};

const diffHours = (dateISO, checkInStr, checkOutStr) => {
  // tính số giờ giữa check-in/check-out theo local
  try {
    if (!dateISO || !checkInStr || !checkOutStr) return 0;
    const [ciH, ciM] = toLocalHHMM(checkInStr).split(':').map(Number);
    const [coH, coM] = toLocalHHMM(checkOutStr).split(':').map(Number);
    if ([ciH, ciM, coH, coM].some((v) => Number.isNaN(v))) return 0;
    const start = new Date(`${dateISO}T${String(ciH).padStart(2, '0')}:${String(ciM).padStart(2, '0')}:00`);
    const end = new Date(`${dateISO}T${String(coH).padStart(2, '0')}:${String(coM).padStart(2, '0')}:00`);
    const ms = end - start;
    if (Number.isNaN(ms) || ms <= 0) return 0;
    const hours = ms / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100;
  } catch {
    return 0;
  }
};

const calcOvertime = (hours) => {
  // Giờ làm thêm = tổng giờ - chuẩn nếu > 0
  const ot = Math.max(0, (parseFloat(hours || 0) - STANDARD_HOURS));
  return Math.round(ot * 100) / 100;
};

const minutesFromHHMM = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const buildStatusAndNotes = (checkIn, checkOut, totalHours) => {
  // Xác định trạng thái theo tổng giờ, và ghi chú muộn/sớm theo WORK_START
  let status = 'completed';
  let computedNotes = '';

  if (!checkIn && !checkOut) {
    return { status: 'absent', notes: 'Không có dữ liệu vào/ra' };
  }

  const total = parseFloat(totalHours || 0);
  if (total > STANDARD_HOURS) {
    const exceed = Math.round((total - STANDARD_HOURS) * 100) / 100;
    status = 'overtime'; // Làm thêm
    computedNotes = `Vượt ${exceed.toFixed(2)} giờ`;
  } else if (total < STANDARD_HOURS) {
    const lack = Math.round((STANDARD_HOURS - total) * 100) / 100;
    status = 'short'; // Thiếu giờ
    computedNotes = `Thiếu ${lack.toFixed(2)} giờ`;
  } else {
    status = 'completed';
    computedNotes = 'Đủ giờ';
  }

  // Tính muộn/sớm dựa vào giờ vào so với WORK_START
  const startMin = minutesFromHHMM(WORK_START);
  const inMin = minutesFromHHMM(checkIn);
  if (inMin != null && startMin != null) {
    const delta = inMin - startMin;
    if (delta > 0) {
      computedNotes += computedNotes ? ' • ' : '';
      computedNotes += `Đi muộn ${delta} phút`;
    } else if (delta < 0) {
      computedNotes += computedNotes ? ' • ' : '';
      computedNotes += `Đến sớm ${Math.abs(delta)} phút`;
    } else {
      computedNotes += computedNotes ? ' • ' : '';
      computedNotes += 'Đúng giờ';
    }
  }

  return { status, notes: computedNotes };
};

// ===== Component =====
const WorkHours = () => {
  const [workHours, setWorkHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorkHour, setSelectedWorkHour] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form state cho sửa giờ làm việc

  // Form state cho sửa giờ làm việc
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

  // Tải dữ liệu (dùng useCallback để không dính cảnh báo deps)
  const fetchWorkHours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/attendance/history`);
      const data = await response.json();

      if (!data?.success) {
        setWorkHours([]);
        setError('Không lấy được dữ liệu giờ làm việc từ máy chủ');
        setLoading(false);
        return;
      }

      const mapped = (data.attendance || []).map((row) => {
        const dateISO = toLocalDateISO(row.work_date);
        const checkIn = toLocalHHMM(row.check_in);
        const checkOut = toLocalHHMM(row.check_out);
        const total = diffHours(dateISO, checkIn, checkOut);
        const overtime = calcOvertime(total);
        const { status, notes } = buildStatusAndNotes(checkIn, checkOut, total);

        return {
          id: row.attendance_id,
          employeeName: row.fullName || 'Chưa rõ tên',
          employeeId: String(row.user_id || ''),
          date: dateISO,
          checkIn,
          checkOut,
          totalHours: total,
          overtime,
          status,
          notes,
          department: 'Chưa xác định',
          position: 'Chưa xác định'
        };
      });

      setWorkHours(mapped);
    } catch (err) {
      console.error('Lỗi fetch work hours:', err);
      setError('Lỗi khi tải danh sách giờ làm việc');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkHours();
  }, [fetchWorkHours]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Tính lại giá trị
      const computedTotal = diffHours(formData.date, formData.checkIn, formData.checkOut);
      const computedOvertime = calcOvertime(computedTotal);
      const { status, notes } = buildStatusAndNotes(formData.checkIn, formData.checkOut, computedTotal);

      // Xác nhận khi lưu
      const ok = window.confirm('Xác nhận cập nhật bản ghi này?');
      if (!ok) return;

      const payload = {
        ...formData,
        totalHours: computedTotal,
        overtime: computedOvertime,
        status,
        notes
      };

      // Cập nhật trong danh sách hiện tại (frontend)
      const updatedWorkHours = workHours.map(workHour =>
        workHour.id === selectedWorkHour.id ? { ...workHour, ...payload } : workHour
      );

      setWorkHours(updatedWorkHours);
      setShowEditModal(false);
      setSelectedWorkHour(null);

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
    const matchesSearch = (workHour.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (workHour.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (workHour.department || '').toLowerCase().includes(searchTerm.toLowerCase());
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
    return filteredWorkHours.slice(startIndex, endIndex);
  };

  // Tính tổng số trang
  const totalPages = Math.ceil(filteredWorkHours.length / itemsPerPage);

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
      case 'overtime': return 'Làm thêm';
      case 'short': return 'Thiếu giờ';
      case 'late': return 'Đi muộn';
      case 'absent': return 'Vắng mặt';
      default: return 'Không xác định';
    }
  };

  // Format ngày
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Định nghĩa cột cho bảng
  const tableColumns = [
    {
      key: 'stt',
      label: 'STT',
      visible: true,
      render: (_, index) => index + 1
    },
    {
      key: 'employeeName',
      label: 'Nhân viên',
      visible: true,
      render: (workHour) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{workHour.employeeName}</div>
          <div className="text-sm text-gray-500">ID: {workHour.employeeId}</div>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Ngày',
      visible: true,
      render: (workHour) => formatDate(workHour.date)
    },
    {
      key: 'checkIn',
      label: 'Giờ vào',
      visible: true,
      render: (workHour) => workHour.checkIn || '--'
    },
    {
      key: 'checkOut',
      label: 'Giờ ra',
      visible: true,
      render: (workHour) => workHour.checkOut || '--'
    },
    {
      key: 'totalHours',
      label: 'Tổng giờ',
      visible: true,
      render: (workHour) => (
        <span className="font-medium">{workHour.totalHours || 0}h</span>
      )
    },
    {
      key: 'overtime',
      label: 'Giờ thêm',
      visible: true,
      render: (workHour) => (
        <span className={`font-medium ${
          workHour.overtime > 0 ? 'text-orange-600' : 'text-gray-500'
        }`}>
          {workHour.overtime || 0}h
        </span>
      )
    },
    {
      key: 'status',
      label: 'Trạng thái',
      visible: true,
      render: (workHour) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          workHour.status === 'completed' ? 'bg-green-100 text-green-800' :
          workHour.status === 'overtime' ? 'bg-orange-100 text-orange-800' :
          workHour.status === 'short' ? 'bg-yellow-100 text-yellow-800' :
          workHour.status === 'late' ? 'bg-red-100 text-red-800' :
          workHour.status === 'absent' ? 'bg-gray-100 text-gray-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {formatStatus(workHour.status)}
        </span>
      )
    },
    {
      key: 'notes',
      label: 'Ghi chú',
      visible: true,
      render: (workHour) => workHour.notes || '--'
    },
    {
      key: 'actions',
      label: 'Thao tác',
      visible: true,
      render: (workHour) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
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
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Chỉnh sửa"
          >
            <FaClock size={14} />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
        <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaClock className="text-blue-600 text-xl" />
                </div>
                <div>
                  <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                    Quản lý giờ làm việc
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Theo dõi và quản lý giờ làm việc của nhân viên
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <div className="loading-spinner"></div>
                <p className="mt-4 text-gray-600">Đang tải danh sách giờ làm việc...</p>
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
                  <FaClock className="text-blue-600 text-xl" />
                </div>
                <div>
                  <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                    Quản lý giờ làm việc
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Theo dõi và quản lý giờ làm việc của nhân viên
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
                <Button onClick={fetchWorkHours} variant="primary">
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
                <FaClock className="text-blue-600 text-xl" />
              </div>
              <div>
                <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                  Quản lý giờ làm việc
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Theo dõi và quản lý giờ làm việc của nhân viên
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Bộ lọc và tìm kiếm */}
        <Card>
          <CardTitle level="h3" className="text-lg mb-4">
            Bộ lọc và tìm kiếm
          </CardTitle>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên nhân viên, mã nhân viên hoặc phòng ban..."
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
                    <option value="completed">Hoàn thành</option>
                    <option value="overtime">Làm thêm</option>
                    <option value="short">Thiếu giờ</option>
                    <option value="late">Đi muộn</option>
                    <option value="absent">Vắng mặt</option>
                  </select>
                </div>
                
                <Button onClick={fetchWorkHours} variant="outline" size="sm">
                  Làm mới
                </Button>
              </div>
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
                <p className="text-sm text-gray-500 mt-1">Tổng hợp thông tin về giờ làm việc</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Tổng bản ghi */}
            <Card className="stat-card stat-card-primary p-2 sm:p-3">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">Tổng bản ghi</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalRecords}</p>
                    <p className="text-xs text-gray-500 mt-1">Tất cả bản ghi</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-full mt-2 sm:mt-0 self-start">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hoàn thành */}
            <Card className="stat-card stat-card-success p-2 sm:p-3">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">Hoàn thành</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{completedRecords}</p>
                    <p className="text-xs text-gray-500 mt-1">Đủ giờ làm</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full mt-2 sm:mt-0 self-start">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Đi muộn */}
            <Card className="stat-card stat-card-warning p-2 sm:p-3">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-yellow-600 mb-1">Đi muộn</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{lateRecords}</p>
                    <p className="text-xs text-gray-500 mt-1">Đến muộn</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-yellow-100 rounded-full mt-2 sm:mt-0 self-start">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Làm thêm giờ */}
            <Card className="stat-card stat-card-info p-2 sm:p-3">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-orange-600 mb-1">Làm thêm giờ</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{overtimeRecords}</p>
                    <p className="text-xs text-gray-500 mt-1">Vượt giờ chuẩn</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-orange-100 rounded-full mt-2 sm:mt-0 self-start">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tổng giờ làm */}
            <Card className="stat-card stat-card-purple p-2 sm:p-3">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-purple-600 mb-1">Tổng giờ làm</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalWorkHours.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Giờ làm việc</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-full mt-2 sm:mt-0 self-start">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tổng giờ thêm */}
            <Card className="stat-card stat-card-red p-2 sm:p-3">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-red-600 mb-1">Tổng giờ thêm</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalOvertime.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Giờ làm thêm</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-red-100 rounded-full mt-2 sm:mt-0 self-start">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bảng giờ làm việc với header tích hợp */}
        <StandardTable
          title="Danh sách giờ làm việc"
          subtitle={`Tổng cộng: ${filteredWorkHours.length} bản ghi`}
          icon={FaClock}
          columns={tableColumns}
          data={getPaginatedData()}
          emptyState={
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FaClock size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu giờ làm việc</h3>
              <p className="text-gray-600">Chưa có bản ghi giờ làm việc nào</p>
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
          totalItems={filteredWorkHours.length}
          itemsPerPageOptions={[5, 10, 20, 50]}
        />

        {/* Modal sửa giờ làm việc (có thể mở từ nơi khác nếu cần) */}
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
                    <option value="overtime">Làm thêm</option>
                    <option value="short">Thiếu giờ</option>
                    <option value="late">Đi muộn</option>
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

export default WorkHours;