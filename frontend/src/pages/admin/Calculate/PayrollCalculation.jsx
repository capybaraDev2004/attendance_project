import React, { useState } from 'react';
import Card, { CardTitle, CardContent, CardActions, CardButton } from '../../../components/Card';
import { FaCalculator, FaCalendarAlt, FaUsers, FaFileExport, FaFilter, FaDownload, FaInfoCircle } from 'react-icons/fa';

const PayrollCalculation = () => {
  // State cho form tính công
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  // const [selectedEmployee, setSelectedEmployee] = useState(''); // Tạm thời comment vì chưa sử dụng
  const [calculationType, setCalculationType] = useState('monthly');

  // Kết quả tổng hợp từ attendance_records
  const [payrollResults, setPayrollResults] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Danh sách phòng ban
  const departments = ['Tất cả', 'IT', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations'];

  // Danh sách tháng
  const months = [
    { value: '01', label: 'Tháng 1' },
    { value: '02', label: 'Tháng 2' },
    { value: '03', label: 'Tháng 3' },
    { value: '04', label: 'Tháng 4' },
    { value: '05', label: 'Tháng 5' },
    { value: '06', label: 'Tháng 6' },
    { value: '07', label: 'Tháng 7' },
    { value: '08', label: 'Tháng 8' },
    { value: '09', label: 'Tháng 9' },
    { value: '10', label: 'Tháng 10' },
    { value: '11', label: 'Tháng 11' },
    { value: '12', label: 'Tháng 12' },
  ];

  // Danh sách năm (5 năm gần nhất)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Hàm lấy dữ liệu thực tế từ backend: tổng công (work_unit) và tổng giờ theo tháng
  const calculatePayroll = async () => {
    if (!selectedMonth) return;
    try {
      setIsCalculating(true);
      const monthParam = `${selectedYear}-${selectedMonth}`; // YYYY-MM
      const res = await fetch(`http://localhost:3001/api/attendance/records?month=${encodeURIComponent(monthParam)}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Phản hồi không hợp lệ từ máy chủ');
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const normalized = (json.data || []).map((row) => ({
        userID: row.userID,
        fullName: row.fullName,
        workingDays: Number(row.working_days || 0),
        totalWorkUnits: Number(row.total_work_units || 0),
        totalHours: Number(row.total_hours || 0),
        totalOvertimeHours: Number(row.total_overtime_hours || 0),
      }));
      setPayrollResults(normalized);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu tính công:', error);
      alert(error.message || 'Không thể lấy dữ liệu tính công');
    } finally {
      setIsCalculating(false);
    }
  };

  // Hàm xuất báo cáo
  const exportReport = (format) => {
    alert(`Đang xuất báo cáo định dạng ${format}...`);
  };

  // Không dùng dữ liệu mẫu, bảng dưới hiển thị theo payrollResults

  return (
    <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaCalculator className="text-blue-600 text-xl" />
              </div>
              <div>
                <CardTitle level="h1" className="text-2xl font-bold text-gray-900">
                  Tính Công & Lương
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  Quản lý và tính toán lương tháng cho nhân viên
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form tính công */}
        <Card>
          <CardTitle level="h3" className="text-lg mb-4 flex items-center">
            <FaCalendarAlt className="mr-2 text-blue-600" />
            Thông tin tính công
          </CardTitle>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-group">
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">Tháng</label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn tháng</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">Năm</label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">Phòng ban</label>
                <select
                  id="department"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả phòng ban</option>
                  {departments.slice(1).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="calculationType" className="block text-sm font-medium text-gray-700 mb-2">Loại tính công</label>
                <select
                  id="calculationType"
                  value={calculationType}
                  onChange={(e) => setCalculationType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="monthly">Tính theo tháng</option>
                  <option value="quarterly">Tính theo quý</option>
                  <option value="yearly">Tính theo năm</option>
                </select>
              </div>
            </div>

          </CardContent>
          <CardActions>
            <CardButton 
              onClick={calculatePayroll} 
              variant="primary" 
              className="flex items-center"
              disabled={!selectedMonth || isCalculating}
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang tính toán...
                </>
              ) : (
                <>
                  <FaCalculator className="mr-2" />
                  Tính công
                </>
              )}
            </CardButton>
            
            <CardButton variant="outline" className="flex items-center">
              <FaFilter className="mr-2" />
              Lọc dữ liệu
            </CardButton>
          </CardActions>
        </Card>

        {/* Kết quả tính công */}
        {payrollResults.length > 0 ? (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle level="h3" className="text-lg flex items-center">
                <FaUsers className="mr-2 text-blue-600" />
                Kết quả tính công tháng {selectedMonth}/{selectedYear}
              </CardTitle>
              
              <div className="flex gap-2">
                <CardButton 
                  variant="outline"
                  onClick={() => exportReport('Excel')}
                  className="flex items-center"
                >
                  <FaFileExport className="mr-2" />
                  Xuất Excel
                </CardButton>
                <CardButton 
                  variant="outline"
                  onClick={() => exportReport('PDF')}
                  className="flex items-center"
                >
                  <FaDownload className="mr-2" />
                  Xuất PDF
                </CardButton>
              </div>
            </div>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã NV</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số ngày ghi nhận</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng công</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng giờ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giờ tăng ca</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrollResults.map(row => (
                      <tr key={row.userID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">NV{String(row.userID).padStart(3, '0')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.workingDays}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalWorkUnits}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalHours.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalOvertimeHours.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>

            {/* Tổng kết */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">{payrollResults.reduce((sum, r) => sum + r.totalWorkUnits, 0).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Tổng công (work units)</div>
                </div>
              </Card>
              
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">{payrollResults.reduce((sum, r) => sum + r.totalHours, 0).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Tổng giờ làm</div>
                </div>
              </Card>
              
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">{payrollResults.reduce((sum, r) => sum + r.totalOvertimeHours, 0).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Tổng giờ tăng ca</div>
                </div>
              </Card>
              
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {payrollResults.length}
                  </div>
                  <div className="text-sm text-gray-600">Số nhân viên</div>
                </div>
              </Card>
            </div>
          </Card>
        ) : (
          // Thông báo khi chưa có kết quả tính công
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <FaInfoCircle className="mx-auto text-6xl text-blue-500 mb-4" />
                <CardTitle level="h3" className="text-xl mb-2">
                  Chưa có kết quả tính công
                </CardTitle>
                <p className="text-gray-600 mb-6">
                  Vui lòng chọn tháng và nhấn "Tính công" để xem kết quả
                </p>
                <div className="bg-blue-50 rounded-lg p-6 text-left max-w-md mx-auto">
                  <h4 className="font-semibold text-blue-800 mb-3">Hướng dẫn sử dụng:</h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li>• Chọn tháng và năm cần tính công</li>
                    <li>• Chọn phòng ban (tùy chọn)</li>
                    <li>• Chọn loại tính công (tháng/quý/năm)</li>
                    <li>• Nhấn nút "Tính công" để bắt đầu</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Đã bỏ danh sách nhân viên mẫu để tránh nhầm lẫn dữ liệu */}
    </div>
  );
};

export default PayrollCalculation;
