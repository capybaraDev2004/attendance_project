import React, { useState } from 'react';
import './PayrollCalculation.css';
import AdminLayout from '../../components/AdminLayout';
import AdminButton from '../../components/AdminButton';
import { FaCalculator, FaCalendarAlt, FaUsers, FaFileExport, FaSearch, FaFilter, FaDownload, FaInfoCircle } from 'react-icons/fa';

const PayrollCalculation = () => {
  // State cho form tính công
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [calculationType, setCalculationType] = useState('monthly');

  // State cho danh sách nhân viên
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Nguyễn Văn A', department: 'IT', position: 'Developer', baseSalary: 15000000, attendanceDays: 22, overtimeHours: 8 },
    { id: 2, name: 'Trần Thị B', department: 'HR', position: 'Manager', baseSalary: 20000000, attendanceDays: 21, overtimeHours: 5 },
    { id: 3, name: 'Lê Văn C', department: 'Sales', position: 'Sales Rep', baseSalary: 12000000, attendanceDays: 20, overtimeHours: 12 },
    { id: 4, name: 'Phạm Thị D', department: 'Marketing', position: 'Designer', baseSalary: 14000000, attendanceDays: 23, overtimeHours: 6 },
  ]);

  // State cho kết quả tính công
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

  // Hàm tính công
  const calculatePayroll = () => {
    setIsCalculating(true);
    
    // Mô phỏng tính toán
    setTimeout(() => {
      const results = employees.map(emp => {
        const baseSalary = emp.baseSalary;
        const dailyRate = baseSalary / 26; // Lương theo ngày
        const attendancePay = emp.attendanceDays * dailyRate;
        const overtimePay = emp.overtimeHours * (dailyRate / 8) * 1.5; // Làm thêm giờ x1.5
        const totalPay = attendancePay + overtimePay;
        
        return {
          ...emp,
          dailyRate: Math.round(dailyRate),
          attendancePay: Math.round(attendancePay),
          overtimePay: Math.round(overtimePay),
          totalPay: Math.round(totalPay),
          deductions: Math.round(totalPay * 0.105), // BHXH, BHYT, BHTN
          netPay: Math.round(totalPay * 0.895)
        };
      });
      
      setPayrollResults(results);
      setIsCalculating(false);
    }, 2000);
  };

  // Hàm xuất báo cáo
  const exportReport = (format) => {
    alert(`Đang xuất báo cáo định dạng ${format}...`);
  };

  // Hàm lọc nhân viên
  const filteredEmployees = employees.filter(emp => {
    if (selectedDepartment && selectedDepartment !== 'Tất cả') {
      return emp.department === selectedDepartment;
    }
    return true;
  });

  return (
    <AdminLayout
      title="Tính Công & Lương"
      subtitle="Quản lý và tính toán lương tháng cho nhân viên"
      icon={FaCalculator}
    >

      {/* Form tính công */}
      <div className="calculation-form-container">
        <div className="form-card">
          <h3 className="form-title">
            <FaCalendarAlt className="form-icon" />
            Thông tin tính công
          </h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="month">Tháng</label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-select"
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
              <label htmlFor="year">Năm</label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-select"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="department">Phòng ban</label>
              <select
                id="department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="form-select"
              >
                <option value="">Tất cả phòng ban</option>
                {departments.slice(1).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="calculationType">Loại tính công</label>
              <select
                id="calculationType"
                value={calculationType}
                onChange={(e) => setCalculationType(e.target.value)}
                className="form-select"
              >
                <option value="monthly">Tính theo tháng</option>
                <option value="quarterly">Tính theo quý</option>
                <option value="yearly">Tính theo năm</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <AdminButton
              variant="primary"
              size="medium"
              onClick={calculatePayroll}
              disabled={!selectedMonth || isCalculating}
              icon={FaCalculator}
            >
              {isCalculating ? (
                <>
                  <div className="spinner"></div>
                  Đang tính toán...
                </>
              ) : (
                'Tính công'
              )}
            </AdminButton>
            
            <AdminButton
              variant="secondary"
              size="medium"
              icon={FaFilter}
            >
              Lọc dữ liệu
            </AdminButton>
          </div>
        </div>
      </div>

      {/* Kết quả tính công */}
      {payrollResults.length > 0 ? (
        <div className="results-container">
          <div className="results-header">
            <h3>
              <FaUsers className="results-icon" />
              Kết quả tính công tháng {selectedMonth}/{selectedYear}
            </h3>
            
            <div className="export-actions">
              <AdminButton 
                variant="outline"
                size="medium"
                onClick={() => exportReport('Excel')}
                icon={FaFileExport}
              >
                Xuất Excel
              </AdminButton>
              <AdminButton 
                variant="outline"
                size="medium"
                onClick={() => exportReport('PDF')}
                icon={FaDownload}
              >
                Xuất PDF
              </AdminButton>
            </div>
          </div>

          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Mã NV</th>
                  <th>Họ tên</th>
                  <th>Phòng ban</th>
                  <th>Chức vụ</th>
                  <th>Lương cơ bản</th>
                  <th>Số ngày công</th>
                  <th>Giờ làm thêm</th>
                  <th>Lương công</th>
                  <th>Lương OT</th>
                  <th>Tổng lương</th>
                  <th>Khấu trừ</th>
                  <th>Lương thực nhận</th>
                </tr>
              </thead>
              <tbody>
                {payrollResults.map(emp => (
                  <tr key={emp.id}>
                    <td className="employee-id">NV{emp.id.toString().padStart(3, '0')}</td>
                    <td className="employee-name">{emp.name}</td>
                    <td className="employee-dept">{emp.department}</td>
                    <td className="employee-position">{emp.position}</td>
                    <td className="salary-amount">{emp.baseSalary.toLocaleString('vi-VN')} ₫</td>
                    <td className="attendance-days">{emp.attendanceDays}</td>
                    <td className="overtime-hours">{emp.overtimeHours}</td>
                    <td className="attendance-pay">{emp.attendancePay.toLocaleString('vi-VN')} ₫</td>
                    <td className="overtime-pay">{emp.overtimePay.toLocaleString('vi-VN')} ₫</td>
                    <td className="total-pay">{emp.totalPay.toLocaleString('vi-VN')} ₫</td>
                    <td className="deductions">{emp.deductions.toLocaleString('vi-VN')} ₫</td>
                    <td className="net-pay">{emp.netPay.toLocaleString('vi-VN')} ₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tổng kết */}
          <div className="summary-container">
            <div className="summary-card">
              <h4>Tổng lương</h4>
              <p className="summary-amount">
                {payrollResults.reduce((sum, emp) => sum + emp.totalPay, 0).toLocaleString('vi-VN')} ₫
              </p>
            </div>
            
            <div className="summary-card">
              <h4>Tổng khấu trừ</h4>
              <p className="summary-amount deductions">
                {payrollResults.reduce((sum, emp) => sum + emp.deductions, 0).toLocaleString('vi-VN')} ₫
              </p>
            </div>
            
            <div className="summary-card">
              <h4>Tổng thực chi</h4>
              <p className="summary-amount net-pay">
                {payrollResults.reduce((sum, emp) => sum + emp.netPay, 0).toLocaleString('vi-VN')} ₫
              </p>
            </div>
            
            <div className="summary-card">
              <h4>Số nhân viên</h4>
              <p className="summary-amount">{payrollResults.length}</p>
            </div>
          </div>
        </div>
      ) : (
        // Thông báo khi chưa có kết quả tính công
        <div className="no-results-container">
          <div className="no-results-card">
            <FaInfoCircle className="no-results-icon" />
            <h3>Chưa có kết quả tính công</h3>
            <p>Vui lòng chọn tháng và nhấn "Tính công" để xem kết quả</p>
            <div className="no-results-tips">
              <h4>Hướng dẫn sử dụng:</h4>
              <ul>
                <li>Chọn tháng và năm cần tính công</li>
                <li>Chọn phòng ban (tùy chọn)</li>
                <li>Chọn loại tính công (tháng/quý/năm)</li>
                <li>Nhấn nút "Tính công" để bắt đầu</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách nhân viên */}
      <div className="employees-container">
        <div className="employees-header">
          <h3>
            <FaUsers className="employees-icon" />
            Danh sách nhân viên
          </h3>
          
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              className="search-input"
            />
          </div>
        </div>

        <div className="employees-table-container">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ tên</th>
                <th>Phòng ban</th>
                <th>Chức vụ</th>
                <th>Lương cơ bản</th>
                <th>Số ngày công</th>
                <th>Giờ làm thêm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  <td className="employee-id">NV{emp.id.toString().padStart(3, '0')}</td>
                  <td className="employee-name">{emp.name}</td>
                  <td className="employee-dept">{emp.department}</td>
                  <td className="employee-position">{emp.position}</td>
                  <td className="salary-amount">{emp.baseSalary.toLocaleString('vi-VN')} ₫</td>
                  <td className="attendance-days">{emp.attendanceDays}</td>
                  <td className="overtime-hours">{emp.overtimeHours}</td>
                  <td className="actions">
                    <AdminButton variant="primary" size="small">Chỉnh sửa</AdminButton>
                    <AdminButton variant="outline" size="small">Xem chi tiết</AdminButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PayrollCalculation;
