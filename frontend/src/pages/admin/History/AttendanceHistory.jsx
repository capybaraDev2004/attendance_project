import React, { useEffect, useState, useRef } from 'react';
import Button from '../../../components/Button';
import Card, { CardTitle, CardContent, CardActions } from '../../../components/Card';
import { FaHistory, FaCalendarAlt, FaSearch, FaFileExcel } from 'react-icons/fa';

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
    if (!checkIn) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Chưa vào</span>;
    }
    if (!checkOut) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Đang làm việc</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Hoàn thành</span>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaHistory className="text-blue-600 text-xl" />
              </div>
              <div>
                <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                  Lịch sử truy cập người dùng
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Theo dõi lịch sử ra vào của nhân viên
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải dữ liệu...</p>
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
                <FaHistory className="text-blue-600 text-xl" />
              </div>
              <div>
                <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                  Lịch sử truy cập người dùng
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Theo dõi lịch sử ra vào của nhân viên
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Filters Section */}
        <Card>
          <CardTitle level="h3" className="text-lg mb-4 flex items-center">
            <FaSearch className="mr-2" />
            Bộ lọc dữ liệu
          </CardTitle>
          
          <CardContent>
            {/* Lọc theo ngày */}
            <div className="mb-6">
              <CardTitle level="h4" className="text-md mb-3">Lọc theo ngày</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ô ngày bắt đầu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu:</label>
                  <div className="flex">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/yyyy"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        if (startHiddenRef.current) {
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
                    <input
                      ref={startHiddenRef}
                      type="date"
                      className="hidden"
                      onChange={(e) => handleCalendarPick('startDate', e.target.value)}
                      tabIndex={-1}
                    />
                  </div>
                </div>

                {/* Ô ngày kết thúc */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc:</label>
                  <div className="flex">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/yyyy"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
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
                      className="hidden"
                      onChange={(e) => handleCalendarPick('endDate', e.target.value)}
                      tabIndex={-1}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lọc theo User và thiết bị */}
            <div className="mb-6">
              <CardTitle level="h4" className="text-md mb-3">Lọc theo người dùng và thiết bị</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo User:</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo thiết bị:</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <CardActions>
              <Button
                variant="success"
                size="md"
                onClick={handleFilter}
                icon={<FaSearch />}
              >
                Lọc dữ liệu
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => alert('Tính năng xuất Excel sẽ được triển khai!')}
                icon={<FaFileExcel />}
              >
                Xuất File Excel
              </Button>
            </CardActions>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle level="h3" className="text-lg mb-1 flex items-center">
                <FaHistory className="mr-2" />
                Dữ liệu lịch sử
              </CardTitle>
              <CardContent className="text-sm text-gray-600">
                Tổng cộng: {attendanceData.length} bản ghi
              </CardContent>
            </div>
          </div>

          <CardContent>
            {attendanceData.length === 0 ? (
              <div className="text-center py-12">
                <FaHistory className="mx-auto text-gray-400 text-4xl mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu lịch sử</h3>
                <p className="text-gray-600">Vui lòng chọn khoảng thời gian và nhấn "Lọc dữ liệu" để xem kết quả</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HỌ TÊN</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NGÀY</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">THỜI GIAN VÀO</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">THIẾT BỊ VÀO</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">THỜI GIAN RA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">THIẾT BỊ RA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.map((record) => (
                      <tr key={record.attendance_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.attendance_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.work_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.check_in ? new Date(record.check_in).toLocaleTimeString('vi-VN') : '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.device_in_name || '--'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.check_out ? new Date(record.check_out).toLocaleTimeString('vi-VN') : '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.device_out_name || '--'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusBadge(record.check_in, record.check_out)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default AttendanceHistory;