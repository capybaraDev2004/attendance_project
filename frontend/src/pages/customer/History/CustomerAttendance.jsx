import React, { useEffect, useState, useCallback } from 'react';
import StandardTable from '../../../components/StandardTable';
import Card, { CardTitle, CardContent } from '../../../components/Card';
import Pagination from '../../../components/Pagination';
import { IconHistory, IconSearch, IconFileExport, IconCalendar, IconAlertCircle } from '@tabler/icons-react';

// Component lịch sử chấm công cho customer - chỉ hiển thị lịch sử của user hiện tại
const CustomerAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // State cho date picker
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Bộ lọc chỉ theo ngày (ẩn filter user và device)
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // Tạo ngày 1 của tháng hiện tại
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    
    // Format thành dd/mm/yyyy cho hiển thị
    const formatDateForDisplay = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    return {
      startDate: formatDateForDisplay(firstDayOfMonth), // Ngày 1 của tháng hiện tại
      endDate: formatDateForDisplay(today) // Ngày hiện tại
    };
  });

  // Lấy thông tin user hiện tại từ localStorage
  const getCurrentUser = useCallback(() => {
    try {
      const rawAuth = localStorage.getItem('auth');
      if (rawAuth) {
        const auth = JSON.parse(rawAuth);
        return auth?.user || null;
      }
    } catch (error) {
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

  // Xử lý chọn ngày từ date picker
  const handleDatePickerSelect = useCallback((key, date) => {
    const formatDateForDisplay = (dateObj) => {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    setFilters((prev) => ({ ...prev, [key]: formatDateForDisplay(date) }));
    
    // Đóng date picker
    if (key === 'startDate') {
      setShowStartDatePicker(false);
    } else {
      setShowEndDatePicker(false);
    }
  }, []);

  // Tạo danh sách ngày trong tháng
  const generateCalendarDays = useCallback((year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Thêm các ngày trống ở đầu tháng
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Thêm các ngày trong tháng
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, []);

  // Gọi API lấy lịch sử chỉ của user hiện tại
  const fetchAttendanceHistory = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: convertToAPIDate(filters.startDate),
        end_date: convertToAPIDate(filters.endDate),
        user_id: currentUser.userID, // Chỉ lấy lịch sử của user hiện tại
        device_id: 'all' // Không filter theo device
      });
      
      const response = await fetch(`http://localhost:3001/api/attendance/history?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setAttendanceData(data.attendance);
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử attendance:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters.startDate, filters.endDate, convertToAPIDate]);

  useEffect(() => {
    // Lấy thông tin user hiện tại
    const user = getCurrentUser();
    setCurrentUser(user);
  }, [getCurrentUser]);

  // Tự động tải dữ liệu khi có currentUser hoặc khi filters thay đổi
  useEffect(() => {
    if (currentUser) {
      fetchAttendanceHistory();
    }
  }, [currentUser, fetchAttendanceHistory]);

  const handleFilter = useCallback(() => {
    fetchAttendanceHistory();
    setCurrentPage(1); // Reset về trang đầu khi lọc
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

  // Hàm format ngày theo định dạng dd/mm/yyyy
  const formatDateToDDMMYYYY = useCallback((dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
      render: (record) => record.check_in ? new Date(record.check_in).toLocaleTimeString('vi-VN') : '--'
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
      render: (record) => record.check_out ? new Date(record.check_out).toLocaleTimeString('vi-VN') : '--'
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

  // Component Date Picker
  const DatePicker = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;
    
    const today = new Date();
    
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const calendarDays = generateCalendarDays(selectedYear, selectedMonth);
    
    return (
      <div className="date-picker-overlay" onClick={onClose}>
        <div className="date-picker" onClick={(e) => e.stopPropagation()}>
          <div className="date-picker-header">
            <button 
              className="date-picker-nav"
              onClick={() => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1)}
            >
              ‹
            </button>
            <span className="date-picker-title">
              {monthNames[selectedMonth]} {selectedYear}
            </span>
            <button 
              className="date-picker-nav"
              onClick={() => setSelectedMonth(prev => prev === 11 ? 0 : prev + 1)}
            >
              ›
            </button>
          </div>
          
          <div className="date-picker-calendar">
            <div className="date-picker-weekdays">
              {dayNames.map(day => (
                <div key={day} className="date-picker-weekday">{day}</div>
              ))}
            </div>
            
            <div className="date-picker-days">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  className={`date-picker-day ${day ? '' : 'empty'} ${
                    day && day.getDate() === today.getDate() && 
                    day.getMonth() === today.getMonth() && 
                    day.getFullYear() === today.getFullYear() ? 'today' : ''
                  }`}
                  onClick={() => day && onSelect(day)}
                  disabled={!day}
                >
                  {day ? day.getDate() : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <IconSearch className="mr-2 text-green-600" size={20} />
            Bộ lọc dữ liệu
          </h3>
        </div>
        
        <div className="p-6">
          {/* Lọc theo ngày */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Lọc theo ngày</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu:</label>
                <div className="flex">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="dd/mm/yyyy"
                    value={filters.startDate}
                    onChange={(e) => handleDateInputChange('startDate', e.target.value)}
                    maxLength="10"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                    onClick={() => setShowStartDatePicker(true)}
                  >
                    <IconCalendar size={16} />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc:</label>
                <div className="flex">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="dd/mm/yyyy"
                    value={filters.endDate}
                    onChange={(e) => handleDateInputChange('endDate', e.target.value)}
                    maxLength="10"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                    onClick={() => setShowEndDatePicker(true)}
                  >
                    <IconCalendar size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <IconSearch className="mr-2" size={16} />
              Lọc dữ liệu
            </button>
            <button
              onClick={() => alert('Tính năng xuất Excel sẽ được triển khai!')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <IconFileExport className="mr-2" size={16} />
              Xuất File Excel
            </button>
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
        onRefresh={fetchAttendanceHistory}
        emptyState={
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <IconHistory size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu lịch sử</h3>
            <p className="text-gray-600">Vui lòng chọn khoảng thời gian và nhấn "Lọc dữ liệu" để xem kết quả</p>
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
        totalItems={attendanceData.length}
        itemsPerPageOptions={[5, 10, 20, 50]}
      />

      {/* Date Pickers */}
      <DatePicker
        isOpen={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onSelect={(date) => handleDatePickerSelect('startDate', date)}
      />
      <DatePicker
        isOpen={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onSelect={(date) => handleDatePickerSelect('endDate', date)}
      />
    </div>
  );
};

export default CustomerAttendance;


