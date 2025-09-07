import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminButton from '../../components/AdminButton';
import { FaHistory, FaCalendarAlt, FaSearch, FaFileExcel } from 'react-icons/fa';
import './AttendanceHistory.css';

// Lịch sử ra/vào với bộ lọc theo ngày, user, thiết bị
const AttendanceHistory = () => {
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  // refs cho input date ẩn (dùng để mở calendar native)
  const startHiddenRef = useRef(null);
  const endHiddenRef = useRef(null);

  // ===== Helpers xử lý ngày dd/MM/yyyy <-> ISO yyyy-MM-dd =====
  const formatDisplayDate = (dateObj) => {
    // Trả về chuỗi dd/MM/yyyy
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const displayToISO = (displayStr) => {
    // Chuyển "dd/MM/yyyy" -> "yyyy-MM-dd" để gọi API hoặc gán cho input type="date"
    const parts = displayStr.split('/');
    if (parts.length !== 3) return '';
    const [dd, mm, yyyy] = parts;
    if (!dd || !mm || !yyyy) return '';
    return `${yyyy.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  };

  const isoToDisplay = (isoStr) => {
    // Chuyển "yyyy-MM-dd" -> "dd/MM/yyyy" khi chọn từ calendar
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length !== 3) return '';
    const [yyyy, mm, dd] = parts;
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy.padStart(4, '0')}`;
  };

  const normalizeDateInput = (value) => {
    // Chuẩn hoá chuỗi nhập thành định dạng dd/MM/yyyy khi gõ
    // - Lấy tối đa 8 chữ số
    // - Chèn dấu "/" sau 2 và 4 chữ số
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  // Mặc định: ngày bắt đầu = ngày 01 của tháng hiện tại, ngày kết thúc = hôm nay
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Bộ lọc: lưu chuỗi hiển thị dd/MM/yyyy
  const [filters, setFilters] = useState({
    startDate: formatDisplayDate(firstDayOfMonth),
    endDate: formatDisplayDate(today),
    selectedUser: 'all',
    selectedDevice: 'all'
  });

  useEffect(() => {
    // Tải users + devices ban đầu
    const load = async () => {
      setLoading(true);
      try {
        const [uRes, dRes] = await Promise.all([
          fetch('http://localhost:3001/api/users'),
          fetch('http://localhost:3001/api/devices')
        ]);
        const [uData, dData] = [await uRes.json(), await dRes.json()];
        if (uData.success) setUsers(uData.users);
        if (dData.success) setDevices(dData.devices);
      } catch (e) {
        console.error('Lỗi khi tải users/devices:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFilterChange = (key, value) => {
    // Với trường ngày thì áp dụng định dạng dd/MM/yyyy khi người dùng nhập
    if (key === 'startDate' || key === 'endDate') {
      value = normalizeDateInput(value);
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Khi chọn ngày từ calendar (input type="date" ẩn)
  const handleCalendarPick = (key, isoValue) => {
    // Chuyển ISO -> dd/MM/yyyy để hiển thị đẹp
    const display = isoToDisplay(isoValue);
    setFilters((prev) => ({ ...prev, [key]: display }));
  };

  // Gọi API lấy lịch sử theo filter hiện tại
  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      // Chuyển ngày hiển thị dd/MM/yyyy -> ISO yyyy-MM-dd để backend nhận đúng
      const startISO = displayToISO(filters.startDate);
      const endISO = displayToISO(filters.endDate);

      const queryParams = new URLSearchParams({
        start_date: startISO,
        end_date: endISO,
        user_id: filters.selectedUser,
        device_id: filters.selectedDevice
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
  };

  const handleFilter = () => {
    // Có nút "Lọc dữ liệu" để người dùng chủ động áp dụng
    fetchAttendanceHistory();
  };

  // Badge trạng thái theo check-in/out
  const renderStatusBadge = (checkIn, checkOut) => {
    if (!checkIn) return <span className="status-pending">Chưa vào</span>;
    if (!checkOut) return <span className="status-working">Đang làm việc</span>;
    return <span className="status-complete">Hoàn thành</span>;
  };

  if (loading) {
    return (
      <AdminLayout
        title="Lịch sử truy cập người dùng"
        subtitle="Theo dõi lịch sử ra vào của nhân viên"
        icon={FaHistory}
      >
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Lịch sử truy cập người dùng"
      subtitle="Theo dõi lịch sử ra vào của nhân viên"
      icon={FaHistory}
    >
      <div className="attendance-history-container">
        {/* Filters Section */}
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
                {/* Ô ngày bắt đầu: text dd/MM/yyyy + nút mở calendar + input date ẩn */}
                <div className="input-group">
                  <label className="input-label">Ngày bắt đầu:</label>
                  <div className="date-input-with-button">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/yyyy"
                      className="form-input"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                    <button
                      type="button"
                      className="calendar-button"
                      aria-label="Chọn ngày bắt đầu"
                      onClick={() => {
                        // Mở calendar của input date ẩn (nếu trình duyệt hỗ trợ)
                        if (startHiddenRef.current) {
                          // Đặt giá trị hiện tại theo ISO để trỏ đúng ngày
                          startHiddenRef.current.value = displayToISO(filters.startDate) || '';
                          if (startHiddenRef.current.showPicker) {
                            startHiddenRef.current.showPicker();
                          } else {
                            startHiddenRef.current.click();
                          }
                        }
                      }}
                    >
                      <FaCalendarAlt />
                    </button>
                    {/* input date ẩn (calendar native) */}
                    <input
                      ref={startHiddenRef}
                      type="date"
                      className="hidden-date-input"
                      defaultValue=""
                      onChange={(e) => handleCalendarPick('startDate', e.target.value)}
                      tabIndex={-1}
                    />
                  </div>
                </div>

                {/* Ô ngày kết thúc: text dd/MM/yyyy + nút mở calendar + input date ẩn */}
                <div className="input-group">
                  <label className="input-label">Ngày kết thúc:</label>
                  <div className="date-input-with-button">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/yyyy"
                      className="form-input"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                    <button
                      type="button"
                      className="calendar-button"
                      aria-label="Chọn ngày kết thúc"
                      onClick={() => {
                        if (endHiddenRef.current) {
                          endHiddenRef.current.value = displayToISO(filters.endDate) || '';
                          if (endHiddenRef.current.showPicker) {
                            endHiddenRef.current.showPicker();
                          } else {
                            endHiddenRef.current.click();
                          }
                        }
                      }}
                    >
                      <FaCalendarAlt />
                    </button>
                    <input
                      ref={endHiddenRef}
                      type="date"
                      className="hidden-date-input"
                      defaultValue=""
                      onChange={(e) => handleCalendarPick('endDate', e.target.value)}
                      tabIndex={-1}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lọc theo User và thiết bị */}
            <div className="filter-group">
              <div className="select-row">
                <div className="input-group">
                  <label className="input-label">Lọc theo User:</label>
                  <select
                    className="form-select"
                    value={filters.selectedUser}
                    onChange={(e) => handleFilterChange('selectedUser', e.target.value)}
                  >
                    <option value="all">Tất cả người dùng</option>
                    {users.map((user) => (
                      <option key={user.userID} value={user.userID}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Lọc theo thiết bị:</label>
                  <select
                    className="form-select"
                    value={filters.selectedDevice}
                    onChange={(e) => handleFilterChange('selectedDevice', e.target.value)}
                  >
                    <option value="all">Tất cả thiết bị</option>
                    {devices.map((device) => (
                      <option key={device.device_id} value={device.device_id}>
                        {device.device_name}
                      </option>
                    ))}
                  </select>
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
                    <th>HỌ TÊN</th>
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
                      <td className="record-name">{record.fullName}</td>
                      <td className="record-date">
                        {new Date(record.work_date).toLocaleDateString('vi-VN')}
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
      </div>
    </AdminLayout>
  );
};

export default AttendanceHistory;