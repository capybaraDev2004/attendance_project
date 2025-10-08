import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import * as TablerIcons from '@tabler/icons-react';
import './SalaryManagement.css';

/**
 * Component quản lý tính lương cho admin
 * Hiển thị danh sách nhân viên với thông tin lương, công làm việc và các khoản phạt
 */
const SalaryManagement = () => {
  const [salaryData, setSalaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Tự động tính API base theo origin hoặc biến môi trường
  const computeApiBase = () => {
    const envBase = process.env.REACT_APP_API_BASE_URL;
    if (envBase && envBase.trim()) return envBase.replace(/\/$/, '');
    const origin = window.location.origin;
    return origin.includes(':3000') ? origin.replace(':3000', ':3001') : origin;
  };

  // Hàm load dữ liệu lương từ backend
  const loadSalaryData = useCallback(async () => {
    setLoading(true);
    try {
      const API_BASE = computeApiBase();
      const monthParam = selectedMonth;
      const url = `${API_BASE}/api/attendance/payroll?month=${encodeURIComponent(monthParam)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tải dữ liệu lương');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi dữ liệu lương');

      // Map dữ liệu backend -> dữ liệu hiển thị
      const mapped = (data.data || []).map((item) => ({
        id: item.userID,
        employeeCode: `NV${String(item.userID).padStart(3, '0')}`,
        employeeName: item.fullName,
        department: item.department || '—',
        position: item.position || '—',
        totalWorkDays: item.totalWorkDays,
        totalOvertimeHours: item.totalOvertimeHours,
        totalPenaltyAmount: item.totalPenaltyAmount,
        totalSalary: item.totalSalary,
        salaryRank: item.salaryRank
      }));

      setSalaryData(mapped);
      toast.success('Tải dữ liệu lương thành công!');
    } catch (error) {
      toast.error('Có lỗi khi tải dữ liệu lương!');
      console.error('Error loading salary data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  // Load dữ liệu khi component mount và khi selectedMonth thay đổi
  useEffect(() => {
    loadSalaryData();
  }, [loadSalaryData]);

  // Hàm format số tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Đã bỏ hàm formatDate vì không sử dụng

  // Lọc dữ liệu theo từ khóa tìm kiếm
  const filteredData = salaryData.filter(employee =>
    (employee.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Hàm xem chi tiết lương
  const handleViewDetails = (employee) => {
    toast.info(`Xem chi tiết lương của ${employee.employeeName}`);
    // TODO: Implement modal hoặc navigate to detail page
  };

  // Hàm xuất báo cáo
  const handleExportReport = () => {
    toast.success('Xuất báo cáo lương thành công!');
    // TODO: Implement export functionality
  };

  return (
    <div className="salary-management-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <TablerIcons.IconCurrencyDollar className="header-icon" size={32} />
            <div>
              <h1>Quản lý tính lương</h1>
              <p>Quản lý và tính toán lương cho nhân viên</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={handleExportReport}
            >
              <TablerIcons.IconDownload size={20} />
              Xuất báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="search">Tìm kiếm:</label>
            <div className="search-input-wrapper">
              <TablerIcons.IconSearch className="search-icon" size={20} />
              <input
                id="search"
                type="text"
                placeholder="Tìm theo tên, mã nhân viên, phòng ban..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
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

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <TablerIcons.IconUsers size={24} />
          </div>
          <div className="stat-content">
            <h3>{filteredData.length}</h3>
            <p>Tổng nhân viên</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <TablerIcons.IconCurrencyDollar size={24} />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(filteredData.reduce((sum, emp) => sum + emp.totalSalary, 0))}</h3>
            <p>Tổng quỹ lương</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <TablerIcons.IconClock size={24} />
          </div>
          <div className="stat-content">
            <h3>{filteredData.reduce((sum, emp) => sum + emp.totalOvertimeHours, 0).toFixed(1)}h</h3>
            <p>Tổng giờ làm thêm</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <TablerIcons.IconAlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(filteredData.reduce((sum, emp) => sum + emp.totalPenaltyAmount, 0))}</h3>
            <p>Tổng tiền phạt</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="salary-table">
                <thead>
                  <tr>
                    <th>Mã nhân viên</th>
                    <th>Tên nhân viên</th>
                    <th>Phòng ban</th>
                    <th>Chức vụ</th>
                    <th>Tổng công</th>
                    <th>Giờ làm thêm</th>
                    <th>Tiền phạt</th>
                    <th>Tổng lương</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <span className="employee-code">{employee.employeeCode}</span>
                      </td>
                      <td>
                        <div className="employee-info">
                          <span className="employee-name">{employee.employeeName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="department">{employee.department}</span>
                      </td>
                      <td>
                        <span className="position">{employee.position}</span>
                      </td>
                      <td>
                        <span className="work-days">{employee.totalWorkDays} ngày</span>
                      </td>
                      <td>
                        <span className="overtime">{employee.totalOvertimeHours}h</span>
                      </td>
                      <td>
                        <span className={`penalty ${employee.totalPenaltyAmount > 0 ? 'has-penalty' : 'no-penalty'}`}>
                          {formatCurrency(employee.totalPenaltyAmount)}
                        </span>
                      </td>
                      <td>
                        <span className={`total-salary ${employee.totalSalary < 0 ? 'negative' : ''}`}>
                          {formatCurrency(employee.totalSalary)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleViewDetails(employee)}
                          title="Xem chi tiết"
                        >
                          <TablerIcons.IconEye size={16} />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} trong tổng số {filteredData.length} kết quả
                </div>
                <div className="pagination-controls">
                  <button
                    className="btn btn-sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <TablerIcons.IconChevronLeft size={16} />
                    Trước
                  </button>
                  
                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`btn btn-sm ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    className="btn btn-sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                    <TablerIcons.IconChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SalaryManagement;
