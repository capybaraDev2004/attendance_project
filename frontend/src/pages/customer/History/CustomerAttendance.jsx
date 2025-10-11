
import React, { useEffect, useState, useCallback, useRef  } from 'react';
import { io } from 'socket.io-client';
import StandardTable from '../../../components/StandardTable';
import Card, { CardTitle, CardContent } from '../../../components/Card';
import Pagination from '../../../components/Pagination';
import { IconHistory, IconSearch, IconFileExport, IconCalendar, IconAlertCircle } from '@tabler/icons-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Component lịch sử chấm công cho customer - chỉ hiển thị lịch sử của user hiện tại
const CustomerAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State cho filters và date pickers
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Lấy thông tin user hiện tại từ localStorage - theo pattern chuẩn của project
  const getCurrentUser = useCallback(() => {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const auth = JSON.parse(authData);
        if (auth.user) return auth.user;
        if (auth.token) {
          const payload = JSON.parse(atob(auth.token.split('.')[1]));
          return payload;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Lỗi khi lấy thông tin user:', error);
      return null;
      console.error('Lỗi khi lấy thông tin user:', error);
    }
    return null;
  }, []);

  // Chuyển đổi từ dd/mm/yyyy sang yyyy-mm-dd cho API
  const convertToAPIDate = useCallback((ddmmyyyy) => {
    if (!ddmmyyyy) return '';
    const [day, month, year] = ddmmyyyy.split('/');
    return `${year}-${month}-${day}`;
  }, []);

  // Validate và format input date
  const handleDateInputChange = useCallback((key, value) => {
    // Chỉ cho phép nhập số và dấu /
    const cleaned = value.replace(/[^\d/]/g, '');

    // Giới hạn độ dài
    if (cleaned.length > 10) return;

    // Tự động thêm dấu /
    let formatted = cleaned;
    if (cleaned.length >= 2 && !cleaned.includes('/')) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 5 && cleaned.split('/').length === 2) {
      const parts = cleaned.split('/');
      if (parts[1].length >= 2) {
        formatted = parts[0] + '/' + parts[1].slice(0, 2) + '/' + parts[1].slice(2);
      }
    }

    setFilters((prev) => ({ ...prev, [key]: formatted }));
  }, []);

  // Xử lý chọn ngày từ date picker (không auto refresh)
  const handleDatePickerSelect = useCallback((key, date) => {
    const formatDateForDisplay = (dateObj) => {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    };
    // Giới hạn không vượt quá ngày hiện tại
    const today = new Date();
    const chosen = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const clamped = chosen > new Date(today.getFullYear(), today.getMonth(), today.getDate())
      ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
      : chosen;

    setFilters((prev) => ({ ...prev, [key]: formatDateForDisplay(clamped) }));
    
    // Đóng date picker
    if (key === 'startDate') {
      setShowStartDatePicker(false);
    } else {
      setShowEndDatePicker(false);
    }
  }, []);


  // Gọi API lấy lịch sử chỉ của user hiện tại - sử dụng endpoint user-history
  const fetchAttendanceHistory = useCallback(async () => {
    if (!currentUser?.userID) {
      console.error('❌ Không tìm thấy userID');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Fetching attendance history for user:', currentUser.userID);

      // Sử dụng endpoint user-history thay vì history với filters
      const response = await fetch(`${API_URL}/api/attendance/user-history/${currentUser.userID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi API: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 API Response:', data);

      if (data.success && data.data) {
        // Chuyển đổi dữ liệu từ format user-history sang format hiện tại
        const processedData = data.data
          .filter(item => !item.isDateHeader) // Loại bỏ header ngày
          .map(item => ({
            attendance_id: item.id,
            work_date: item.date,
            check_in: item.type === 'Check-in' ? `${item.date}T${item.time}:00` : null,
            check_out: item.type === 'Check-out' ? `${item.date}T${item.time}:00` : null,
            device_in_name: item.location || '--',
            device_out_name: item.location || '--'
          }))
          .filter((item, index, array) => {
            // Loại bỏ các bản ghi trùng lặp và chỉ giữ lại bản ghi có đầy đủ thông tin
            return item.check_in || item.check_out;
          });

        setAttendanceData(processedData);
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('❌ Lỗi khi lấy lịch sử attendance:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Lắng nghe realtime từ Socket.IO và tự refresh khi có quét RFID của chính user này
  useEffect(() => {
    if (!currentUser) return;

    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected (attendance history):', socket.id);
    });

    socket.on('attendanceUpdate', (payload) => {
      // payload: { id, date, time, type, status, location, userName }
      if (payload && payload.userName === currentUser.fullName) {
        console.log('📡 Received attendance update for current user:', payload);
        // Tải lại lịch sử để đồng bộ dữ liệu bảng
        fetchAttendanceHistory();
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected (attendance history):', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('⚠️ Socket connect_error (attendance history):', err.message);
    });

    return () => {
      console.log('🔌 Disconnecting socket (attendance history)');
      socket.disconnect();
    };
  }, [currentUser, fetchAttendanceHistory]);

  useEffect(() => {
    // Lấy thông tin user hiện tại
    const user = getCurrentUser();
    setCurrentUser(user);
  }, [getCurrentUser]);

  // Tự động tải dữ liệu khi có currentUser
  useEffect(() => {
    if (currentUser) {
      fetchAttendanceHistory();
    }
  }, [currentUser, fetchAttendanceHistory]);

  // Hàm refresh dữ liệu (không cần filter phức tạp vì user-history endpoint đã trả về tất cả dữ liệu)
  const handleRefresh = useCallback(() => {
    fetchAttendanceHistory();
    setCurrentPage(1); // Reset về trang đầu khi refresh
  }, [fetchAttendanceHistory]);

  // Xử lý thay đổi trang
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Xử lý thay đổi số dòng hiển thị
  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset về trang đầu
  }, []);

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const getPaginatedData = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return attendanceData.slice(startIndex, endIndex);
  }, [attendanceData, currentPage, itemsPerPage]);

  // Tính tổng số trang
  const totalPages = Math.ceil(attendanceData.length / itemsPerPage);

  // (Đã bỏ cột trạng thái)

  // Tính toán ghi chú: Đến muộn / Đúng giờ / Làm vượt giờ
  const renderNoteBadge = useCallback((record) => {
    const formatMinutes = (totalMins) => {
      const minutes = Math.max(0, Math.round(totalMins));
      if (minutes < 60) return `${minutes}p`;
      const hours = Math.floor(minutes / 60);
      const remain = minutes % 60;
      return `${hours}h${remain}p`;
    };
    // Mặc định ca hành chính: 08:00 - 17:30

    const checkInDate = record.check_in ? new Date(record.check_in) : null;
    const checkOutDate = record.check_out ? new Date(record.check_out) : null;

    // Lấy mốc ca theo chính ngày của check-in/out để tránh lệch ngày
    const shiftStart = checkInDate
      ? new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), 8, 0, 0)
      : null;

    const isLate = checkInDate && shiftStart ? checkInDate > shiftStart : false;
    // Thời gian làm thực tế = (checkout - checkin) - 60 phút ăn
    const workedMinutesRaw = checkInDate && checkOutDate
      ? Math.max(0, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 60000))
      : 0;
    const workedMinutes = Math.max(0, workedMinutesRaw - 60);
    // Vượt giờ kể từ khi vượt mốc 8 giờ 30 phút (510 phút) sau khi đã trừ ăn trưa
    const OVERTIME_THRESHOLD_MINUTES = 8 * 60 + 30;
    const overtimeMinutes = Math.max(0, workedMinutes - OVERTIME_THRESHOLD_MINUTES);
    const isOvertime = overtimeMinutes > 0;

    if (isOvertime) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Làm vượt giờ ({formatMinutes(overtimeMinutes)})</span>;
    }
    if (isLate) {
      const diffMs = shiftStart ? (checkInDate.getTime() - shiftStart.getTime()) : 0;
      const diffMins = diffMs / 60000;
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Đến muộn ({formatMinutes(diffMins)})</span>;
    }
    if (checkInDate) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đúng giờ</span>;
    }
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">--</span>;
  }, []);

  // Tính số "công" dựa trên thời gian làm việc và mốc 8h30
  const renderWorkUnits = useCallback((record) => {
    const checkInDate = record.check_in ? new Date(record.check_in) : null;
    const checkOutDate = record.check_out ? new Date(record.check_out) : null;
    if (!checkInDate || !checkOutDate) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">--</span>;
    }

    // Trừ 60 phút ăn để ra giờ làm thực tế
    const workedMinutesRaw = Math.max(0, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 60000));
    const workedMinutes = Math.max(0, workedMinutesRaw - 60);
    const FULL_DAY_MINUTES = 8 * 60 + 30; // 8h30 = 510 phút

    // Nếu dưới 8h30: làm tròn theo bậc 0, 0.25, 0.5, 0.75, 1.0
    if (workedMinutes < FULL_DAY_MINUTES) {
      const ratio = workedMinutes / FULL_DAY_MINUTES;
      let units = 0;
      if (ratio >= 0.75) units = 0.75;
      else if (ratio >= 0.5) units = 0.5;
      else if (ratio >= 0.25) units = 0.25;
      else units = 0;

      const display = units.toFixed(2);
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
          {display} công
        </span>
      );
    }

    // Đủ 8h30 trở lên: chỉ hiển thị 1 công và ghi rõ số giờ vượt
    const overtimeMinutes = workedMinutes - FULL_DAY_MINUTES;
    const overtimeHours = (overtimeMinutes / 60).toFixed(2);
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
        1 công (+ {overtimeHours}h)
      </span>
    );
  }, []);

  // Tính tổng hợp đơn giản từ dữ liệu attendance
  const computeTotals = useCallback(() => {
    const FULL_DAY_MINUTES = 8 * 60 + 30; // 510 phút
    let totalUnits = 0;
    let totalOvertimeHours = 0;
    const workingDateSet = new Set();

    attendanceData.forEach((record) => {
      const checkInDate = record.check_in ? new Date(record.check_in) : null;
      const checkOutDate = record.check_out ? new Date(record.check_out) : null;
      if (!checkInDate || !checkOutDate) return;

      const workedMinutesRaw = Math.max(0, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 60000));
      const workedMinutes = Math.max(0, workedMinutesRaw - 60);

      // Tính work_unit theo bậc
      if (workedMinutes >= FULL_DAY_MINUTES) {
        totalUnits += 1;
        workingDateSet.add(record.work_date);
      } else {
        const ratio = workedMinutes / FULL_DAY_MINUTES;
        if (ratio >= 0.75) { totalUnits += 0.75; workingDateSet.add(record.work_date); }
        else if (ratio >= 0.5) { totalUnits += 0.5; workingDateSet.add(record.work_date); }
        else if (ratio >= 0.25) { totalUnits += 0.25; workingDateSet.add(record.work_date); }
      }

      // Tính giờ làm thêm
      if (workedMinutes > FULL_DAY_MINUTES) {
        totalOvertimeHours += (workedMinutes - FULL_DAY_MINUTES) / 60;
      }
    });

    // Tính số ngày làm việc trong tháng hiện tại
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let sundays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dt = new Date(year, month, day);
      if (dt.getDay() === 0) sundays += 1;
    }
    const standardWorkingDays = daysInMonth - sundays;
    const offDays = Math.max(0, standardWorkingDays - workingDateSet.size);

    return {
      totalUnits: parseFloat(totalUnits.toFixed(2)),
      totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
      offDays,
      standardWorkingDays
    };
  }, [attendanceData]);

  // Hàm format ngày theo định dạng dd/mm/yyyy
  const formatDateToDDMMYYYY = useCallback((dateString) => {
    if (!dateString) return '--';
    // Nếu chỉ có yyyy-MM-dd thì parse LOCAL để không bị lùi ngày
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [y, m, d0] = dateString.split('-').map(n => parseInt(n, 10));
      const date = new Date(y, m - 1, d0, 0, 0, 0, 0);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const renderTime = useCallback((dateTimeString) => {
    if (!dateTimeString) return '--';
    // Hỗ trợ cả 'HH:mm' thuần
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(String(dateTimeString).trim())) {
      return String(dateTimeString).trim().slice(0, 5);
    }
    // Nếu check_in/out ở dạng yyyy-MM-dd thì không có giờ → '--'
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateTimeString))) return '--';
    const d = new Date(dateTimeString);
    if (isNaN(d.getTime())) return '--';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }, []);

  // Định nghĩa cột cho bảng
  const tableColumns = [
    {
      key: 'attendance_id',
      label: 'ID',
      visible: true,
      render: (record) => <span className="font-medium">{record.attendance_id}</span>
    },
    {
      key: 'work_date',
      label: 'NGÀY',
      visible: true,
      render: (record) => formatDateToDDMMYYYY(record.work_date)
    },
    {
      key: 'check_in',
      label: 'THỜI GIAN VÀO',
      visible: true,
      render: (record) => renderTime(record.check_in)
    },
    {
      key: 'device_in_name',
      label: 'THIẾT BỊ VÀO',
      visible: true,
      render: (record) => record.device_in_name || '--'
    },
    {
      key: 'check_out',
      label: 'THỜI GIAN RA',
      visible: true,
      render: (record) => renderTime(record.check_out)
    },
    {
      key: 'device_out_name',
      label: 'THIẾT BỊ RA',
      visible: true,
      render: (record) => record.device_out_name || '--'
    },
    {
      key: 'note',
      label: 'GHI CHÚ',
      visible: true,
      render: (record) => renderNoteBadge(record)
    },
    {
      key: 'work_units',
      label: 'CHẤM CÔNG',
      visible: true,
      render: (record) => renderWorkUnits(record)
    },

  ];


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <IconHistory className="text-gray-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lịch sử chấm công</h1>
              <p className="text-gray-600 mt-1">Theo dõi lịch sử ra vào cá nhân</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <IconHistory className="text-gray-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lịch sử chấm công</h1>
              <p className="text-gray-600 mt-1">Theo dõi lịch sử ra vào cá nhân</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <IconAlertCircle className="text-red-600 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-red-900">Không thể xác định thông tin người dùng</h3>
          </div>
          <p className="text-red-700">Vui lòng đăng nhập lại để xem lịch sử chấm công</p>
        </div>
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
              <IconHistory className="text-blue-600 text-xl" />
            </div>
            <div>
              <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                Lịch sử chấm công
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Lịch sử ra vào của {currentUser.fullName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Action Section */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <IconHistory className="mr-2 text-green-600" size={20} />
                Lịch sử chấm công
              </h3>
              <p className="text-gray-600 mt-1">
                Hiển thị lịch sử chấm công của {currentUser.fullName}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <IconSearch className="mr-2" size={16} />
                Làm mới
              </button>
              <button
                onClick={() => alert('Tính năng xuất Excel sẽ được triển khai!')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <IconFileExport className="mr-2" size={16} />
                Xuất Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <StandardTable
        title="Dữ liệu lịch sử"
        subtitle={`Tổng cộng: ${attendanceData.length} bản ghi`}
        icon={IconHistory}
        columns={tableColumns}
        data={getPaginatedData()}
        onRefresh={handleRefresh}
        emptyState={
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <IconHistory size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu lịch sử</h3>
            <p className="text-gray-600">Chưa có dữ liệu chấm công nào được ghi nhận</p>
          </div>
        }
      />

      {/* Summary Totals */}
      {(() => {
        const totals = computeTotals();
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="rounded-lg p-4 text-right border border-green-200 bg-green-50">
              <p className="text-sm text-green-700">Tổng công chuẩn</p>
              <p className="text-2xl font-bold text-green-900">{totals.totalUnits} công</p>
            </div>
            <div className="rounded-lg p-4 text-right border border-purple-200 bg-purple-50">
              <p className="text-sm text-purple-700">Tổng giờ làm thêm</p>
              <p className="text-2xl font-bold text-purple-900">{totals.totalOvertimeHours} h</p>
            </div>
            <div className="rounded-lg p-4 text-right border border-red-200 bg-red-50">
              <p className="text-sm text-red-700">OFF (ngày không công)</p>
              <p className="text-2xl font-bold text-red-900">{totals.offDays} ngày</p>
            </div>
            <div className="rounded-lg p-4 text-right border border-blue-200 bg-blue-50">
              <p className="text-sm text-blue-700">Công chuẩn (tháng hiện tại)</p>
              <p className="text-2xl font-bold text-blue-900">{totals.standardWorkingDays} ngày</p>
            </div>
          </div>
        );
      })()}

      {/* Phân trang */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        totalItems={attendanceData.length}
        itemsPerPageOptions={[5, 10, 20, 50]}
      />

    </div>
  );
};

export default CustomerAttendance;


