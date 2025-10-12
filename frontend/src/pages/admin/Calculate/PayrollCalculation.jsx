import React, { useState } from 'react';
import Card, { CardTitle, CardContent, CardActions, CardButton } from '../../../components/Card';
import { FaCalculator, FaCalendarAlt, FaUsers, FaFileExport, FaInfoCircle } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

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

  // Hàm lấy thông tin người dùng hiện tại (cập nhật để lấy chính xác)
  const getCurrentUserInfo = () => {
    try {
      // Lấy thông tin từ localStorage với key 'auth'
      const authData = localStorage.getItem('auth');
      if (authData) {
        const auth = JSON.parse(authData);
        
        // Kiểm tra cấu trúc auth.user.fullName
        if (auth.user && auth.user.fullName) {
          return {
            fullName: auth.user.fullName,
            role: auth.role || 'admin'
          };
        }
        
        // Kiểm tra các trường hợp khác
        if (auth.user && auth.user.name) {
          return {
            fullName: auth.user.name,
            role: auth.role || 'admin'
          };
        }
        
        // Nếu có token, thử decode để lấy thông tin
        if (auth.token) {
          try {
            const payload = JSON.parse(atob(auth.token.split('.')[1]));
            if (payload.fullName) {
              return {
                fullName: payload.fullName,
                role: payload.role || 'admin'
              };
            }
            if (payload.name) {
              return {
                fullName: payload.name,
                role: payload.role || 'admin'
              };
            }
          } catch (tokenError) {
            console.warn('Không thể decode token:', tokenError);
          }
        }
      }
      
      // Thử các key khác trong localStorage
      const alternativeKeys = ['userInfo', 'user', 'currentUser'];
      for (const key of alternativeKeys) {
        const userData = localStorage.getItem(key);
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.fullName) {
              return {
                fullName: user.fullName,
                role: user.role || 'admin'
              };
            }
            if (user.name) {
              return {
                fullName: user.name,
                role: user.role || 'admin'
              };
            }
          } catch (parseError) {
            console.warn(`Không thể parse dữ liệu từ ${key}:`, parseError);
          }
        }
      }
      
      // Nếu không tìm thấy, hiển thị cảnh báo và yêu cầu đăng nhập lại
      console.error('Không tìm thấy thông tin người dùng trong localStorage');
      toast.error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      return {
        fullName: 'Người dùng chưa xác định',
        role: 'admin'
      };
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      toast.error('Có lỗi khi lấy thông tin người dùng!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      return {
        fullName: 'Lỗi hệ thống',
        role: 'admin'
      };
    }
  };

  // Hàm xuất báo cáo Excel (ĐỊNH DẠNG HOÀN HẢO THEO ẢNH)
  const exportToExcel = () => {
    if (payrollResults.length === 0) {
      toast.error('Không có dữ liệu để xuất!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    try {
      // Lấy thông tin người dùng hiện tại
      const currentUser = getCurrentUserInfo();
      
      // Kiểm tra nếu không lấy được tên thực tế
      if (currentUser.fullName === 'Người dùng chưa xác định' || 
          currentUser.fullName === 'Lỗi hệ thống' ||
          currentUser.fullName === 'Người dùng hệ thống') {
        toast.warning('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại để xuất báo cáo!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }
      
      // Chuẩn bị dữ liệu cho Excel
      const excelData = payrollResults.map((row, index) => ({
        'STT': index + 1,
        'Mã NV': `NV${String(row.userID).padStart(3, '0')}`,
        'Họ tên': row.fullName,
        'Số ngày ghi nhận': row.workingDays,
        'Tổng công': row.totalWorkUnits,
        'Tổng giờ': row.totalHours.toFixed(2),
        'Giờ tăng ca': row.totalOvertimeHours.toFixed(2)
      }));

      // Tạo workbook mới
      const workbook = XLSX.utils.book_new();
      
      // Tạo worksheet từ dữ liệu
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Lấy range của worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Đặt độ rộng cột (tối ưu cho nội dung)
      const columnWidths = [
        { wch: 8 },   // STT
        { wch: 12 },  // Mã NV
        { wch: 25 },  // Họ tên
        { wch: 18 },  // Số ngày ghi nhận
        { wch: 12 },  // Tổng công
        { wch: 12 },  // Tổng giờ
        { wch: 15 }   // Giờ tăng ca
      ];
      worksheet['!cols'] = columnWidths;

      // ĐỊNH DẠNG HEADER - BÔI ĐEN, CĂN GIỮA, BORDER
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          font: { 
            bold: true,
            size: 12,
            name: 'Times New Roman',
            color: { rgb: 'FFFFFF' } // Chữ trắng
          },
          alignment: { 
            horizontal: 'center', 
            vertical: 'center',
            wrapText: true
          },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          },
          fill: {
            fgColor: { rgb: '000000' } // Nền đen
          }
        };
      }

      // ĐỊNH DẠNG DỮ LIỆU - CĂN GIỮA, BORDER
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!worksheet[cellAddress]) continue;
          
          // Chỉ định dạng dòng dữ liệu (không phải header)
          if (row > 0) {
            worksheet[cellAddress].s = {
              font: { 
                size: 11,
                name: 'Times New Roman',
                color: { rgb: '000000' } // Chữ đen
              },
              alignment: { 
                horizontal: 'center', 
                vertical: 'center',
                wrapText: true
              },
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              },
              fill: {
                fgColor: { rgb: 'FFFFFF' } // Nền trắng
              }
            };
          }
        }
      }

      // THÊM THÔNG TIN CUỐI BẢNG (GIỐNG TRONG ẢNH)
      const lastRow = range.e.r + 3; // Thêm 3 dòng trống
      const lastCol = range.e.c; // Cột cuối cùng (G)
      
      // Ngày xuất báo cáo (Row 5, Column G) - CĂN PHẢI
      const dateCellAddress = XLSX.utils.encode_cell({ r: lastRow, c: lastCol });
      const currentDate = new Date();
      const exportDate = currentDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      
      worksheet[dateCellAddress] = { v: `Ngày xuất: ${exportDate}` };
      worksheet[dateCellAddress].s = {
        font: { 
          size: 11,
          name: 'Times New Roman',
          color: { rgb: '000000' }
        },
        alignment: { 
          horizontal: 'right', // CĂN PHẢI như trong ảnh
          vertical: 'center'
        }
      };

      // "Người lập báo cáo" (Row 6, Column G) - CĂN PHẢI
      const preparerLabelCellAddress = XLSX.utils.encode_cell({ r: lastRow + 1, c: lastCol });
      worksheet[preparerLabelCellAddress] = { v: 'Người lập báo cáo' };
      worksheet[preparerLabelCellAddress].s = {
        font: { 
          size: 11,
          name: 'Times New Roman',
          color: { rgb: '000000' }
        },
        alignment: { 
          horizontal: 'right', // CĂN PHẢI như trong ảnh
          vertical: 'center'
        }
      };

      // Tên người lập (Row 7, Column G) - CĂN PHẢI, TÊN THỰC TẾ
      const nameCellAddress = XLSX.utils.encode_cell({ r: lastRow + 2, c: lastCol });
      worksheet[nameCellAddress] = { v: currentUser.fullName };
      worksheet[nameCellAddress].s = {
        font: { 
          size: 11,
          name: 'Times New Roman',
          color: { rgb: '000000' }
        },
        alignment: { 
          horizontal: 'right', // CĂN PHẢI như trong ảnh
          vertical: 'center'
        }
      };

      // Cập nhật range để bao gồm các dòng mới
      const newRange = XLSX.utils.decode_range(worksheet['!ref']);
      newRange.e.r = lastRow + 2;
      worksheet['!ref'] = XLSX.utils.encode_range(newRange);

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng tính công');

      // Xuất file
      const fileName = `BaoCaoTinhCong_${selectedMonth}_${selectedYear}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      // Thông báo thành công với popup xanh lá
      toast.success(
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">
              Xuất file Excel thành công!
            </p>
            <p className="text-sm text-green-600">
              File: {fileName}
            </p>
            <p className="text-xs text-green-500">
              Người thực hiện: {currentUser.fullName}
            </p>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: "toast-success-custom"
        }
      );
    } catch (error) {
      console.error('Lỗi xuất Excel:', error);
      toast.error('Có lỗi xảy ra khi xuất file Excel!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Hàm xuất báo cáo (chỉ còn Excel)
  const exportReport = (format) => {
    if (format === 'Excel') {
      exportToExcel();
    }
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
                  Tính Công làm việc
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
                  disabled={isCalculating}
                >
                  <FaFileExport className="mr-2" />
                  Xuất Excel
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
