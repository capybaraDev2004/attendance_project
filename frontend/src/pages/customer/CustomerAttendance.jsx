import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminButton from '../../components/AdminButton';
import { FaHistory, FaSearch, FaFileExcel, FaCalendarAlt } from 'react-icons/fa';
import '../admin/AttendanceHistory.css';

// Component lịch sử chấm công cho customer - chỉ hiển thị lịch sử của user hiện tại
const CustomerAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
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
  }, [fetchAttendanceHistory]);

  // Badge trạng thái theo check-in/out
  const renderStatusBadge = useCallback((checkIn, checkOut) => {
    if (!checkIn) return <span className="status-pending">Chưa vào</span>;
    if (!checkOut) return <span className="status-working">Đang làm việc</span>;
    return <span className="status-complete">Đã tan ca</span>;
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
      <AdminLayout
        title="Lịch sử chấm công của tôi"
        subtitle="Theo dõi lịch sử ra vào cá nhân"
        icon={FaHistory}
      >
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!currentUser) {
    return (
      <AdminLayout
        title="Lịch sử chấm công của tôi"
        subtitle="Theo dõi lịch sử ra vào cá nhân"
        icon={FaHistory}
      >
        <div className="no-data-container">
          <div className="no-data-card">
            <FaHistory className="no-data-icon" />
            <h3>Không thể xác định thông tin người dùng</h3>
            <p>Vui lòng đăng nhập lại để xem lịch sử chấm công</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Lịch sử chấm công của tôi"
      subtitle={`Lịch sử ra vào của ${currentUser.fullName}`}
      icon={FaHistory}
    >
      <div className="attendance-history-container">
        {/* Filters Section - Chỉ hiển thị filter ngày */}
        <div className="filters-container">
          <div className="filters-card">
            <h3 className="filters-title">
              <FaSearch className="filters-icon" />
              Bộ lọc dữ liệu
            </h3>
            
            {/* Lọc theo ngày */}
            <div className="filter-group">
              <div className="filter-title">Lọc theo ngày</div>
              <div className="date-row">
                <div className="input-group">
                  <label className="input-label">Ngày bắt đầu:</label>
                  <div className="date-input-container">
                    <input
                      type="text"
                      className="form-input date-input"
                      placeholder="dd/mm/yyyy"
                      value={filters.startDate}
                      onChange={(e) => handleDateInputChange('startDate', e.target.value)}
                      maxLength="10"
                    />
                    <button
                      type="button"
                      className="date-picker-button"
                      onClick={() => setShowStartDatePicker(true)}
                    >
                      <FaCalendarAlt />
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Ngày kết thúc:</label>
                  <div className="date-input-container">
                    <input
                      type="text"
                      className="form-input date-input"
                      placeholder="dd/mm/yyyy"
                      value={filters.endDate}
                      onChange={(e) => handleDateInputChange('endDate', e.target.value)}
                      maxLength="10"
                    />
                    <button
                      type="button"
                      className="date-picker-button"
                      onClick={() => setShowEndDatePicker(true)}
                    >
                      <FaCalendarAlt />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="filter-actions">
              <AdminButton
                variant="success"
                size="medium"
                onClick={handleFilter}
                icon={FaSearch}
              >
                Lọc dữ liệu
              </AdminButton>
              <AdminButton
                variant="outline"
                size="medium"
                onClick={() => alert('Tính năng xuất Excel sẽ được triển khai!')}
                icon={FaFileExcel}
              >
                Xuất File Excel
              </AdminButton>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">
              <FaHistory className="table-icon" />
              Dữ liệu lịch sử
            </h3>
            <p className="table-subtitle">
              Tổng cộng: {attendanceData.length} bản ghi
            </p>
          </div>

          {attendanceData.length === 0 ? (
            <div className="no-data-container">
              <div className="no-data-card">
                <FaHistory className="no-data-icon" />
                <h3>Chưa có dữ liệu lịch sử</h3>
                <p>Vui lòng chọn khoảng thời gian và nhấn "Lọc dữ liệu" để xem kết quả</p>
              </div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead className="table-header-row">
                  <tr>
                    <th>ID</th>
                    <th>NGÀY</th>
                    <th>THỜI GIAN VÀO</th>
                    <th>THIẾT BỊ VÀO</th>
                    <th>THỜI GIAN RA</th>
                    <th>THIẾT BỊ RA</th>
                    <th>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {attendanceData.map((record) => (
                    <tr key={record.attendance_id}>
                      <td className="record-id">{record.attendance_id}</td>
                      <td className="record-date">
                        {formatDateToDDMMYYYY(record.work_date)}
                      </td>
                      <td className="record-time-in">
                        {record.check_in ? new Date(record.check_in).toLocaleTimeString('vi-VN') : '--'}
                      </td>
                      <td className="record-device-in">{record.device_in_name || '--'}</td>
                      <td className="record-time-out">
                        {record.check_out ? new Date(record.check_out).toLocaleTimeString('vi-VN') : '--'}
                      </td>
                      <td className="record-device-out">{record.device_out_name || '--'}</td>
                      <td className="record-status">
                        {renderStatusBadge(record.check_in, record.check_out)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
    </AdminLayout>
  );
};

export default CustomerAttendance;


