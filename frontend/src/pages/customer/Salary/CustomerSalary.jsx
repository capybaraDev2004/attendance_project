import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as TablerIcons from '@tabler/icons-react';
import * as XLSX from 'xlsx';

// Trang bảng lương cho customer - chỉ hiển thị lương cá nhân
export default function CustomerSalary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // State cho modal chi tiết lương
  const [salaryDetailModal, setSalaryDetailModal] = useState({
    isOpen: false,
    employee: null,
    salaryDetails: null,
    loading: false
  });

  // Tính API base
  const computeApiBase = () => {
    const envBase = process.env.REACT_APP_API_BASE_URL;
    if (envBase && envBase.trim()) return envBase.replace(/\/$/, '');
    const origin = window.location.origin;
    return origin.includes(':3000') ? origin.replace(':3000', ':3001') : origin;
  };

  // Lấy user hiện tại từ localStorage
  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('auth');
      const auth = raw ? JSON.parse(raw) : null;
      return auth?.user?.userID || auth?.user?.id || null;
    } catch (e) {
      return null;
    }
  };

  // Hàm lấy thông tin người dùng hiện tại
  const getCurrentUserInfo = () => {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const auth = JSON.parse(authData);
        
        if (auth.user && auth.user.fullName) {
          return {
            fullName: auth.user.fullName,
            role: auth.role || 'customer'
          };
        }
        
        if (auth.user && auth.user.name) {
          return {
            fullName: auth.user.name,
            role: auth.role || 'customer'
          };
        }
      }
      
      return {
        fullName: 'Người dùng chưa xác định',
        role: 'customer'
      };
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      return {
        fullName: 'Lỗi hệ thống',
        role: 'customer'
      };
    }
  };

  // Hàm lấy lương cơ bản từ salaryRank
  const getBasicSalaryFromRank = (salaryRank) => {
    // Nếu salaryRank là số tiền trực tiếp (như 100000000)
    if (typeof salaryRank === 'number' && salaryRank > 1000000) {
      return salaryRank; // Trả về số tiền trực tiếp
    }
    
    // Nếu salaryRank là string chứa số tiền
    if (typeof salaryRank === 'string') {
      const salaryAmount = parseFloat(salaryRank);
      if (!isNaN(salaryAmount) && salaryAmount > 1000000) {
        return salaryAmount; // Trả về số tiền từ string
      }
    }
    
    // Mapping salaryRank thành mức lương cơ bản (fallback)
    const salaryMapping = {
      1: 3000000,  // Nhân viên thường
      2: 4000000,  // Nhân viên có kinh nghiệm
      3: 5000000,  // Trưởng nhóm
      4: 6000000,  // Trưởng phòng
      5: 8000000,  // Phó giám đốc
      6: 10000000, // Giám đốc
      7: 12000000, // Giám đốc điều hành
      8: 15000000  // Tổng giám đốc
    };
    
    // Nếu salaryRank là số nhỏ (1-8), trả về mức lương tương ứng
    if (typeof salaryRank === 'number') {
      return salaryMapping[salaryRank] || 3000000;
    }
    
    // Nếu salaryRank là string số nhỏ, thử parse thành số
    if (typeof salaryRank === 'string') {
      const rankNumber = parseInt(salaryRank);
      if (!isNaN(rankNumber) && rankNumber <= 8) {
        return salaryMapping[rankNumber] || 3000000;
      }
    }
    
    // Mặc định 3 triệu nếu không xác định được
    return 3000000;
  };

  // Hàm tính lương chi tiết
  const calculateSalaryDetails = (employee) => {
    // Lấy lương cơ bản từ salaryRank trong database
    const baseSalary = getBasicSalaryFromRank(employee.salaryRank);
    
    // Số ngày công làm được
    const workDays = employee.totalWorkDays || 0;
    
    // Tính lương cơ bản dựa trên số công (26 công = đủ lương)
    const basicSalary = (workDays / 26) * baseSalary;
    
    // Các phụ cấp cố định
    const transportAllowance = 500000; // Phụ cấp xăng xe 500k
    const housingAllowance = 500000;   // Phụ cấp nhà ở 500k
    const mealAllowance = 600000;      // Phụ cấp ăn uống 600k
    
    // Tổng phụ cấp
    const totalAllowances = transportAllowance + housingAllowance + mealAllowance;
    
    // Bảo hiểm cố định
    const insurance = 1000000; // 1 triệu
    
    // Tiền phạt (từ dữ liệu)
    const penalties = employee.totalPenaltyAmount || 0;
    
    // Làm thêm giờ (tính theo công thức mới)
    const overtimeHours = employee.totalOvertimeHours || 0;
    const overtimePay = overtimeHours > 0 ? (baseSalary / 26 / 24) * overtimeHours : 0;
    
    // TỔNG THU = Lương cơ bản + Phụ cấp + Làm thêm
    const totalGross = basicSalary + totalAllowances + overtimePay;
    
    // TỔNG TRỪ = Bảo hiểm + Tiền phạt
    const totalDeductions = insurance + penalties;
    
    // SỐ TIỀN THỰC LÃNH = TỔNG THU - TỔNG TRỪ
    const totalSalary = totalGross - totalDeductions;
    
    return {
      baseSalary, // Lương cơ bản gốc (100 triệu)
      basicSalary, // Lương cơ bản thực tế (theo số công)
      workDays, // Số ngày công
      transportAllowance,
      housingAllowance,
      mealAllowance,
      totalAllowances,
      overtimeHours,
      overtimePay,
      insurance,
      penalties,
      totalGross,
      totalDeductions,
      totalSalary: Math.max(0, totalSalary), // Đảm bảo không âm
      salaryRank: employee.salaryRank
    };
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const fetchData = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      toast.error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }
    setLoading(true);
    try {
      const API_BASE = computeApiBase();
      const url = `${API_BASE}/api/attendance/payroll?month=${encodeURIComponent(selectedMonth)}&user_id=${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tải dữ liệu bảng lương');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Lỗi dữ liệu bảng lương');

      const item = (json.data || [])[0] || null;
      setData(item);
    } catch (err) {
      console.error(err);
      toast.error('Tải dữ liệu bảng lương thất bại');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // Hàm lấy chi tiết lương của nhân viên
  const fetchSalaryDetails = async (employeeId) => {
    setSalaryDetailModal(prev => ({ ...prev, loading: true }));
    try {
      // Tìm nhân viên trong dữ liệu hiện tại
      const employee = {
        id: employeeId,
        employeeCode: `NV${String(employeeId).padStart(3, '0')}`,
        employeeName: data.fullName,
        department: data.department || '—',
        position: data.position || '—',
        totalWorkDays: data.totalWorkDays,
        totalOvertimeHours: data.totalOvertimeHours,
        totalPenaltyAmount: data.totalPenaltyAmount,
        salaryRank: data.salaryRank
      };
      
      // Tính toán chi tiết lương dựa trên dữ liệu có sẵn
      const salaryDetails = calculateSalaryDetails(employee);
      
      setSalaryDetailModal(prev => ({
        ...prev,
        employee,
        salaryDetails,
        loading: false
      }));
      
    } catch (error) {
      console.error('Lỗi khi tính toán chi tiết lương:', error);
      toast.error('Có lỗi khi tính toán chi tiết lương!');
      setSalaryDetailModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Hàm xem chi tiết lương
  const handleViewDetails = async () => {
    if (!data) return;
    
    setSalaryDetailModal({
      isOpen: true,
      employee: null,
      salaryDetails: null,
      loading: false
    });
    
    // Tính toán chi tiết lương
    await fetchSalaryDetails(data.userID);
  };

  // Hàm đóng modal
  const closeSalaryDetailModal = () => {
    setSalaryDetailModal({
      isOpen: false,
      employee: null,
      salaryDetails: null,
      loading: false
    });
  };

  // Hàm xuất phiếu lương chi tiết
  const exportSalarySlip = () => {
    if (!salaryDetailModal.employee || !salaryDetailModal.salaryDetails) return;
    
    try {
      const currentUser = getCurrentUserInfo();
      const employee = salaryDetailModal.employee;
      const details = salaryDetailModal.salaryDetails;
      
      // Lấy thông tin tháng năm
      const monthName = selectedMonth.split('-')[1];
      const yearName = selectedMonth.split('-')[0];
      const monthNames = {
        '01': '01', '02': '02', '03': '03', '04': '04', '05': '05', '06': '06',
        '07': '07', '08': '08', '09': '09', '10': '10', '11': '11', '12': '12'
      };
      const monthDisplay = monthNames[monthName] || monthName;
      
      // Chuẩn bị dữ liệu cho Excel với định dạng đẹp
      const salarySlipData = [
        // Header chính - MERGE TOÀN BỘ HÀNG
        { 'A': `PHIẾU LƯƠNG THÁNG ${monthDisplay}/${yearName} CỦA ${employee.employeeName.toUpperCase()}` },
        { 'A': '' }, // Dòng trống
        { 'A': '' }, // Dòng trống
        
        // Header bảng
        { 'A': 'Khoản thu', 'B': 'Số tiền', 'C': 'Khoản trừ', 'D': 'Số tiền' },
        
        // Dữ liệu thu nhập
        { 'A': `Lương cơ bản (${details.workDays}/26 công)`, 'B': formatCurrency(details.basicSalary), 'C': '', 'D': '' },
        { 'A': 'Phụ cấp xăng xe', 'B': formatCurrency(details.transportAllowance), 'C': '', 'D': '' },
        { 'A': 'Phụ cấp nhà ở', 'B': formatCurrency(details.housingAllowance), 'C': '', 'D': '' },
        { 'A': 'Phụ cấp ăn uống', 'B': formatCurrency(details.mealAllowance), 'C': '', 'D': '' },
        { 'A': `Số tiền tăng ca (${details.overtimeHours}h)`, 'B': formatCurrency(details.overtimePay), 'C': '', 'D': '' },
        { 'A': 'TỔNG PHỤ CẤP', 'B': formatCurrency(details.totalGross), 'C': '', 'D': '' },
        
        // Dòng trống
        { 'A': '', 'B': '', 'C': '', 'D': '' },
        
        // Dữ liệu khoản trừ
        { 'A': '', 'B': '', 'C': 'Bảo hiểm', 'D': formatCurrency(details.insurance) },
        { 'A': '', 'B': '', 'C': 'Tiền phạt', 'D': formatCurrency(details.penalties) },
        { 'A': '', 'B': '', 'C': 'TỔNG TRỪ', 'D': formatCurrency(details.totalDeductions) },
        
        // Dòng trống
        { 'A': '', 'B': '', 'C': '', 'D': '' },
        
        // Thực lãnh
        { 'A': '', 'B': '', 'C': 'SỐ TIỀN THỰC LÃNH', 'D': formatCurrency(details.totalSalary) },
        
        // Dòng trống
        { 'A': '', 'B': '', 'C': '', 'D': '' },
        { 'A': '', 'B': '', 'C': '', 'D': '' },
        
        // Thông tin cuối
        { 'A': '', 'B': '', 'C': `Ngày xuất: ${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, 'D': '' },
        { 'A': '', 'B': '', 'C': 'Người lập báo cáo', 'D': '' },
        { 'A': '', 'B': '', 'C': currentUser.fullName, 'D': '' }
      ];

      // Tạo workbook mới
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(salarySlipData);
      
      // Định dạng worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Đặt độ rộng cột
      worksheet['!cols'] = [
        { wch: 35 }, // Cột A - Khoản thu
        { wch: 20 }, // Cột B - Số tiền thu
        { wch: 25 }, // Cột C - Khoản trừ
        { wch: 20 }  // Cột D - Số tiền trừ
      ];

      // Định dạng header chính (dòng 1) - PHIẾU LƯƠNG - MERGE TOÀN BỘ HÀNG
      const headerCellAddress = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (worksheet[headerCellAddress]) {
        worksheet[headerCellAddress].s = {
          font: { 
            bold: true,
            size: 16,
            name: 'Times New Roman',
            color: { rgb: '000000' }
          },
          alignment: { 
            horizontal: 'center', 
            vertical: 'center'
          },
          border: {
            top: { style: 'thick', color: { rgb: '000000' } },
            bottom: { style: 'thick', color: { rgb: '000000' } },
            left: { style: 'thick', color: { rgb: '000000' } },
            right: { style: 'thick', color: { rgb: '000000' } }
          },
          fill: {
            fgColor: { rgb: 'E6F3FF' }
          }
        };
        
        // Merge cells cho header chính - TOÀN BỘ HÀNG A-D
        worksheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
        ];
      }

      // Định dạng header bảng (dòng 3)
      for (let col = 0; col < 4; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          font: { 
            bold: true,
            size: 12,
            name: 'Times New Roman',
            color: { rgb: 'FFFFFF' }
          },
          alignment: { 
            horizontal: 'center', 
            vertical: 'center'
          },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          },
          fill: {
            fgColor: { rgb: '000000' }
          }
        };
      }

      // Định dạng dữ liệu
      for (let row = 4; row <= range.e.r; row++) {
        for (let col = 0; col < 4; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!worksheet[cellAddress]) continue;
          
          const cellValue = worksheet[cellAddress].v;
          if (cellValue && cellValue !== '') {
            // Định dạng cho các dòng có dữ liệu
            worksheet[cellAddress].s = {
              font: { 
                size: 11,
                name: 'Times New Roman',
                color: { rgb: '000000' },
                bold: cellValue.toString().includes('TỔNG') || cellValue.toString().includes('THỰC LÃNH')
              },
              alignment: { 
                horizontal: col % 2 === 0 ? 'left' : 'right', // Cột A,C căn trái, B,D căn phải
                vertical: 'center'
              },
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              },
              fill: {
                fgColor: cellValue.toString().includes('TỔNG PHỤ CẤP') ? { rgb: 'E6F3FF' } :
                         cellValue.toString().includes('TỔNG TRỪ') ? { rgb: 'FFE6E6' } :
                         cellValue.toString().includes('THỰC LÃNH') ? { rgb: 'E6FFE6' } :
                         { rgb: 'FFFFFF' }
              }
            };
          }
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Phiếu lương');
      
      // Xuất file
      const fileName = `PhieuLuong_${employee.employeeCode}_${monthDisplay}_${yearName}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success('Xuất phiếu lương thành công!');
    } catch (error) {
      console.error('Lỗi xuất phiếu lương:', error);
      toast.error('Có lỗi khi xuất phiếu lương!');
    }
  };

  return (
    <div className="salary-management-container">
      {/* CSS cho toast custom và modal */}
      <style jsx>{`
        .toast-success-custom {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
          border: 1px solid #10b981;
        }
        .toast-success-custom .Toastify__progress-bar {
          background: rgba(255, 255, 255, 0.8);
        }
        .toast-success-custom .Toastify__close-button {
          color: white;
          opacity: 0.8;
        }
        .toast-success-custom .Toastify__close-button:hover {
          opacity: 1;
        }
        
        /* CSS cho modal chi tiết lương */
        .salary-detail-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .salary-detail-modal {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .modal-title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        
        .modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }
        
        /* CSS MỚI CHO THÔNG TIN NHÂN VIÊN - ĐẸP VÀ RÕ RÀNG */
        .employee-info {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.2);
          position: relative;
          overflow: hidden;
        }
        
        .employee-info::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        
        .employee-info h3 {
          margin: 0 0 20px 0;
          color: #ffffff;
          font-size: 20px;
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1;
        }
        
        .employee-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          position: relative;
          z-index: 1;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .detail-item:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        
        .detail-label {
          font-weight: 600;
          color: #ffffff;
          font-size: 14px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        
        .detail-value {
          color: #ffffff;
          font-weight: bold;
          font-size: 14px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .salary-breakdown {
          margin-bottom: 24px;
        }
        
        .salary-section {
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 12px;
          padding: 8px 0;
          border-bottom: 2px solid #3b82f6;
        }
        
        .salary-items {
          display: grid;
          gap: 8px;
        }
        
        .salary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }
        
        .salary-item.total {
          background: #dbeafe;
          border-left-color: #1d4ed8;
          font-weight: bold;
        }
        
        .salary-item.deduction {
          border-left-color: #ef4444;
        }
        
        .salary-item.deduction.total {
          background: #fef2f2;
          border-left-color: #dc2626;
        }
        
        .salary-item.final {
          background: #dcfce7;
          border-left-color: #16a34a;
          font-size: 18px;
          font-weight: bold;
        }
        
        .item-label {
          color: #374151;
        }
        
        .item-value {
          color: #1f2937;
          font-weight: 500;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 2px solid #e5e7eb;
        }
        
        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        
        .btn-primary:hover {
          background: #2563eb;
        }
        
        .btn-secondary {
          background: #6b7280;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #4b5563;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <TablerIcons.IconCurrencyDollar className="header-icon" size={32} />
            <div>
              <h1>Bảng lương cá nhân</h1>
              <p>Xem chi tiết lương theo tháng của bạn</p>
            </div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="month">Tháng:</label>
            <input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-input"
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : !data ? (
          <div className="p-6 text-gray-600">Không có dữ liệu trong tháng đã chọn.</div>
        ) : (
          <div className="table-wrapper">
            <table className="salary-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Phòng ban</th>
                  <th>Chức vụ</th>
                  <th>Lương cơ bản</th>
                  <th>Tổng công</th>
                  <th>Giờ làm thêm</th>
                  <th>Ngày đi muộn</th>
                  <th>Tiền phạt</th>
                  <th>Tổng lương</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{data.fullName}</td>
                  <td>{data.department || '—'}</td>
                  <td>{data.position || '—'}</td>
                  <td>{formatCurrency(getBasicSalaryFromRank(data.salaryRank))}</td>
                  <td>{(data.totalWorkDays || 0).toFixed(2)} ngày</td>
                  <td>{(data.totalOvertimeHours || 0).toFixed(2)}h</td>
                  <td>{data.totalLateDays || 0}</td>
                  <td>{formatCurrency(data.totalPenaltyAmount)}</td>
                  <td>
                    <strong className={Number(data.totalSalary) < 0 ? 'text-red-600' : ''}>
                      {formatCurrency(data.totalSalary)}
                    </strong>
                  </td>
                  <td>
                    <button 
                      onClick={handleViewDetails}
                      className="btn btn-primary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <TablerIcons.IconEye size={14} />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal chi tiết lương */}
      {salaryDetailModal.isOpen && (
        <div className="salary-detail-modal-overlay" onClick={closeSalaryDetailModal}>
          <div className="salary-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Phiếu lương chi tiết</h2>
              <button className="modal-close" onClick={closeSalaryDetailModal}>
                ×
              </button>
            </div>

            {salaryDetailModal.loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="loading-spinner"></div>
                <p style={{ marginTop: '16px', color: '#6b7280' }}>Đang tính toán chi tiết lương...</p>
              </div>
            ) : salaryDetailModal.employee && salaryDetailModal.salaryDetails ? (
              <>
                {/* Thông tin nhân viên - CSS MỚI ĐẸP */}
                <div className="employee-info">
                  <h3>Thông tin nhân viên</h3>
                  <div className="employee-details">
                    <div className="detail-item">
                      <span className="detail-label">Mã nhân viên:</span>
                      <span className="detail-value">{salaryDetailModal.employee.employeeCode}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Họ tên:</span>
                      <span className="detail-value">{salaryDetailModal.employee.employeeName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phòng ban:</span>
                      <span className="detail-value">{salaryDetailModal.employee.department}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Chức vụ:</span>
                      <span className="detail-value">{salaryDetailModal.employee.position}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Lương gốc (Rank):</span>
                      <span className="detail-value">{formatCurrency(salaryDetailModal.salaryDetails.baseSalary)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Số công làm:</span>
                      <span className="detail-value">{salaryDetailModal.salaryDetails.workDays}/26 ngày</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Tháng:</span>
                      <span className="detail-value">{selectedMonth}</span>
                    </div>
                  </div>
                </div>

                {/* Chi tiết lương với công thức mới */}
                <div className="salary-breakdown">
                  {/* Khoản thu */}
                  <div className="salary-section">
                    <h3 className="section-title">Khoản thu</h3>
                    <div className="salary-items">
                      <div className="salary-item">
                        <span className="item-label">Lương cơ bản ({salaryDetailModal.salaryDetails.workDays}/26 công)</span>
                        <span className="item-value">{formatCurrency(salaryDetailModal.salaryDetails.basicSalary)}</span>
                      </div>
                      <div className="salary-item">
                        <span className="item-label">Phụ cấp xăng xe</span>
                        <span className="item-value">{formatCurrency(salaryDetailModal.salaryDetails.transportAllowance)}</span>
                      </div>
                      <div className="salary-item">
                        <span className="item-label">Phụ cấp nhà ở</span>
                        <span className="item-value">{formatCurrency(salaryDetailModal.salaryDetails.housingAllowance)}</span>
                      </div>
                      <div className="salary-item">
                        <span className="item-label">Phụ cấp ăn uống</span>
                        <span className="item-value">{formatCurrency(salaryDetailModal.salaryDetails.mealAllowance)}</span>
                      </div>
                      <div className="salary-item">
                        <span className="item-label">Số tiền tăng ca ({salaryDetailModal.salaryDetails.overtimeHours}h)</span>
                        <span className="item-value">{formatCurrency(salaryDetailModal.salaryDetails.overtimePay)}</span>
                      </div>
                      <div className="salary-item total">
                        <span className="item-label">TỔNG PHỤ CẤP</span>
                        <span className="item-value">{formatCurrency(salaryDetailModal.salaryDetails.totalGross)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Khoản trừ */}
                  <div className="salary-section">
                    <h3 className="section-title">Khoản trừ</h3>
                    <div className="salary-items">
                      <div className="salary-item deduction">
                        <span className="item-label">Bảo hiểm</span>
                        <span className="item-value">{formatCurrency(salaryDetailModal.salaryDetails.insurance)}</span>
                      </div>
                      <div className="salary-item deduction">
                        <span className="item-label">Tiền phạt</span>
                        <span className="item-value">{formatCurrency(salaryDetailModal.salaryDetails.penalties)}</span>
                      </div>
                      <div className="salary-item deduction total">
                        <span className="item-label">TỔNG TRỪ</span>
                        <span className="item-value">{formatCurrency(salaryDetailModal.salaryDetails.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Số tiền thực lãnh */}
                  <div className="salary-section">
                    <div className="salary-items">
                      <div className="salary-item final">
                        <span className="item-label">SỐ TIỀN THỰC LÃNH</span>
                        <span className="item-value">{formatCurrency(salaryDetailModal.salaryDetails.totalSalary)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={closeSalaryDetailModal}>
                    <TablerIcons.IconX size={16} />
                    Đóng
                  </button>
                  <button className="btn btn-primary" onClick={exportSalarySlip}>
                    <TablerIcons.IconDownload size={16} />
                    Xuất phiếu lương
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#6b7280' }}>Không thể tính toán chi tiết lương</p>
                <button className="btn btn-secondary" onClick={closeSalaryDetailModal}>
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


