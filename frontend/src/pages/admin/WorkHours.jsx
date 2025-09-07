import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import AdminButton from '../../components/AdminButton';
import { FaClock, FaExclamationTriangle, FaCalendarAlt, FaUserClock } from 'react-icons/fa';
import './WorkHours.css';

// ===== Cấu hình & Helpers đặt ngoài component để ổn định tham chiếu (fix ESLint deps) =====
const STANDARD_HOURS = 8;         // số giờ làm chuẩn trong ngày
const WORK_START = '08:00';       // giờ vào chuẩn để tính muộn/sớm

const toLocalDateISO = (input) => {
  if (!input) return '';
  try {
    if (typeof input === 'string' && (input.includes('T') || input.includes(' '))) {
      const d = new Date(input);
      if (!Number.isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    const d = new Date(input);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
};

const toLocalHHMM = (input) => {
  if (!input) return '';
  try {
    if (input instanceof Date) {
      return input.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (typeof input === 'string') {
      if (input.includes('T') || (input.includes('-') && input.includes(':'))) {
        const d = new Date(input);
        if (!Number.isNaN(d.getTime())) {
          return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
      }
      const m = input.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (m) {
        return `${m[1].padStart(2, '0')}:${m[2]}`;
      }
    }
    const d = new Date(input);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
};

const diffHours = (dateISO, checkInStr, checkOutStr) => {
  // tính số giờ giữa check-in/check-out theo local
  try {
    if (!dateISO || !checkInStr || !checkOutStr) return 0;
    const [ciH, ciM] = toLocalHHMM(checkInStr).split(':').map(Number);
    const [coH, coM] = toLocalHHMM(checkOutStr).split(':').map(Number);
    if ([ciH, ciM, coH, coM].some((v) => Number.isNaN(v))) return 0;
    const start = new Date(`${dateISO}T${String(ciH).padStart(2, '0')}:${String(ciM).padStart(2, '0')}:00`);
    const end = new Date(`${dateISO}T${String(coH).padStart(2, '0')}:${String(coM).padStart(2, '0')}:00`);
    const ms = end - start;
    if (Number.isNaN(ms) || ms <= 0) return 0;
    const hours = ms / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100;
  } catch {
    return 0;
  }
};

const calcOvertime = (hours) => {
  // Giờ làm thêm = tổng giờ - chuẩn nếu > 0
  const ot = Math.max(0, (parseFloat(hours || 0) - STANDARD_HOURS));
  return Math.round(ot * 100) / 100;
};

const minutesFromHHMM = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const buildStatusAndNotes = (checkIn, checkOut, totalHours) => {
  // Xác định trạng thái theo tổng giờ, và ghi chú muộn/sớm theo WORK_START
  let status = 'completed';
  let computedNotes = '';

  if (!checkIn && !checkOut) {
    return { status: 'absent', notes: 'Không có dữ liệu vào/ra' };
  }

  const total = parseFloat(totalHours || 0);
  if (total > STANDARD_HOURS) {
    const exceed = Math.round((total - STANDARD_HOURS) * 100) / 100;
    status = 'overtime'; // Làm thêm
    computedNotes = `Vượt ${exceed.toFixed(2)} giờ`;
  } else if (total < STANDARD_HOURS) {
    const lack = Math.round((STANDARD_HOURS - total) * 100) / 100;
    status = 'short'; // Thiếu giờ
    computedNotes = `Thiếu ${lack.toFixed(2)} giờ`;
  } else {
    status = 'completed';
    computedNotes = 'Đủ giờ';
  }

  // Tính muộn/sớm dựa vào giờ vào so với WORK_START
  const startMin = minutesFromHHMM(WORK_START);
  const inMin = minutesFromHHMM(checkIn);
  if (inMin != null && startMin != null) {
    const delta = inMin - startMin;
    if (delta > 0) {
      computedNotes += computedNotes ? ' • ' : '';
      computedNotes += `Đi muộn ${delta} phút`;
    } else if (delta < 0) {
      computedNotes += computedNotes ? ' • ' : '';
      computedNotes += `Đến sớm ${Math.abs(delta)} phút`;
    } else {
      computedNotes += computedNotes ? ' • ' : '';
      computedNotes += 'Đúng giờ';
    }
  }

  return { status, notes: computedNotes };
};

// ===== Component =====
const WorkHours = () => {
  const [workHours, setWorkHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorkHour, setSelectedWorkHour] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state cho sửa giờ làm việc
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    date: '',
    checkIn: '',
    checkOut: '',
    totalHours: '',
    overtime: '',
    status: 'completed',
    notes: ''
  });

  // Tải dữ liệu (dùng useCallback để không dính cảnh báo deps)
  const fetchWorkHours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/attendance/history`);
      const data = await response.json();

      if (!data?.success) {
        setWorkHours([]);
        setError('Không lấy được dữ liệu giờ làm việc từ máy chủ');
        setLoading(false);
        return;
      }

      const mapped = (data.attendance || []).map((row) => {
        const dateISO = toLocalDateISO(row.work_date);
        const checkIn = toLocalHHMM(row.check_in);
        const checkOut = toLocalHHMM(row.check_out);
        const total = diffHours(dateISO, checkIn, checkOut);
        const overtime = calcOvertime(total);
        const { status, notes } = buildStatusAndNotes(checkIn, checkOut, total);

        return {
          id: row.attendance_id,
          employeeName: row.fullName || 'Chưa rõ tên',
          employeeId: String(row.user_id || ''),
          date: dateISO,
          checkIn,
          checkOut,
          totalHours: total,
          overtime,
          status,
          notes,
          department: 'Chưa xác định',
          position: 'Chưa xác định'
        };
      });

      setWorkHours(mapped);
    } catch (err) {
      console.error('Lỗi fetch work hours:', err);
      setError('Lỗi khi tải danh sách giờ làm việc');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkHours();
  }, [fetchWorkHours]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Tính lại giá trị
      const computedTotal = diffHours(formData.date, formData.checkIn, formData.checkOut);
      const computedOvertime = calcOvertime(computedTotal);
      const { status, notes } = buildStatusAndNotes(formData.checkIn, formData.checkOut, computedTotal);

      // Xác nhận khi lưu
      const ok = window.confirm('Xác nhận cập nhật bản ghi này?');
      if (!ok) return;

      const payload = {
        ...formData,
        totalHours: computedTotal,
        overtime: computedOvertime,
        status,
        notes
      };

      // Cập nhật trong danh sách hiện tại (frontend)
      const updatedWorkHours = workHours.map(workHour =>
        workHour.id === selectedWorkHour.id ? { ...workHour, ...payload } : workHour
      );

      setWorkHours(updatedWorkHours);
      setShowEditModal(false);
      setSelectedWorkHour(null);

      // Reset form
      setFormData({
        employeeName: '',
        employeeId: '',
        date: '',
        checkIn: '',
        checkOut: '',
        totalHours: '',
        overtime: '',
        status: 'completed',
        notes: ''
      });
    } catch (err) {
      console.error('Lỗi lưu giờ làm việc:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const closeModal = () => {
    setShowEditModal(false);
    setSelectedWorkHour(null);
    setFormData({
      employeeName: '',
      employeeId: '',
      date: '',
      checkIn: '',
      checkOut: '',
      totalHours: '',
      overtime: '',
      status: 'completed',
      notes: ''
    });
  };

  // Lọc giờ làm việc theo trạng thái và tìm kiếm
  const filteredWorkHours = workHours.filter(workHour => {
    const matchesStatus = filterStatus === 'all' || workHour.status === filterStatus;
    const matchesSearch = (workHour.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (workHour.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (workHour.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Thống kê
  const totalRecords = workHours.length;
  const completedRecords = workHours.filter(w => w.status === 'completed').length;
  const lateRecords = workHours.filter(w => w.status === 'late').length;
  const overtimeRecords = workHours.filter(w => w.status === 'overtime').length;

  // Tính tổng giờ làm việc
  const totalWorkHours = workHours.reduce((sum, w) => sum + parseFloat(w.totalHours || 0), 0);
  const totalOvertime = workHours.reduce((sum, w) => sum + parseFloat(w.overtime || 0), 0);

  // Format trạng thái
  const formatStatus = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'overtime': return 'Làm thêm';
      case 'short': return 'Thiếu giờ';
      case 'late': return 'Đi muộn';
      case 'absent': return 'Vắng mặt';
      default: return 'Không xác định';
    }
  };

  // Format ngày
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <AdminLayout
        title="Quản lý giờ làm việc"
        subtitle="Theo dõi và quản lý giờ làm việc của nhân viên"
        icon={FaClock}
      >
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách giờ làm việc...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout
        title="Quản lý giờ làm việc"
        subtitle="Theo dõi và quản lý giờ làm việc của nhân viên"
        icon={FaClock}
      >
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h3>Đã xảy ra lỗi</h3>
          <p>{error}</p>
          <AdminButton onClick={fetchWorkHours} variant="primary">
            Thử lại
          </AdminButton>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Quản lý giờ làm việc"
      subtitle="Theo dõi và quản lý giờ làm việc của nhân viên"
      icon={FaClock}
    >
      <div className="work-hours-container">
        {/* Bộ lọc và tìm kiếm */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên nhân viên, mã nhân viên hoặc phòng ban..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label className="filter-label">Trạng thái:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Hoàn thành</option>
                <option value="overtime">Làm thêm</option>
                <option value="short">Thiếu giờ</option>
                <option value="late">Đi muộn</option>
                <option value="absent">Vắng mặt</option>
              </select>
            </div>
            
            <AdminButton onClick={fetchWorkHours} variant="outline" size="small">
              Làm mới
            </AdminButton>
          </div>
        </div>

        {/* Thống kê */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{totalRecords}</div>
            <div className="stat-label">Tổng bản ghi</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{completedRecords}</div>
            <div className="stat-label">Hoàn thành</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{lateRecords}</div>
            <div className="stat-label">Đi muộn</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{overtimeRecords}</div>
            <div className="stat-label">Làm thêm giờ</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalWorkHours.toFixed(2)}</div>
            <div className="stat-label">Tổng giờ làm</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalOvertime.toFixed(2)}</div>
            <div className="stat-label">Tổng giờ thêm</div>
          </div>
        </div>

        {/* Header */}
        <div className="section-header">
          <div className="header-content">
            <h3>Danh sách giờ làm việc</h3>
            <p>Tổng cộng: {filteredWorkHours.length} bản ghi</p>
          </div>
        </div>

        {/* Bảng giờ làm việc */}
        <div className="table-container">
          <table className="work-hours-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Nhân viên</th>
                <th>Ngày</th>
                <th>Giờ vào</th>
                <th>Giờ ra</th>
                <th>Tổng giờ</th>
                <th>Giờ thêm</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkHours.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    <div className="no-data-content">
                      <p>Không tìm thấy bản ghi nào</p>
                      <p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkHours.map((workHour, index) => (
                  <tr key={workHour.id} className="work-hour-row">
                    <td className="work-hour-stt">
                      <span className="stt-badge">{index + 1}</span>
                    </td>
                    <td className="work-hour-employee">
                      <div className="employee-info">
                        <strong>{workHour.employeeName}</strong>
                        <small>{workHour.employeeId} • {workHour.department}</small>
                      </div>
                    </td>
                    <td className="work-hour-date">
                      <div className="date-info">
                        <FaCalendarAlt className="calendar-icon" />
                        <span>{formatDate(workHour.date)}</span>
                      </div>
                    </td>
                    <td className="work-hour-checkin">
                      <div className="time-info">
                        <FaUserClock className="clock-icon" />
                        <span>{workHour.checkIn || '--'}</span>
                      </div>
                    </td>
                    <td className="work-hour-checkout">
                      <div className="time-info">
                        <FaUserClock className="clock-icon" />
                        <span>{workHour.checkOut || '--'}</span>
                      </div>
                    </td>
                    <td className="work-hour-total">
                      <span className="hours-badge">{(workHour.totalHours ?? 0).toFixed ? workHour.totalHours.toFixed(2) : Number(workHour.totalHours || 0).toFixed(2)}h</span>
                    </td>
                    <td className="work-hour-overtime">
                      {parseFloat(workHour.overtime || 0) > 0 ? (
                        <span className="overtime-badge">{(workHour.overtime ?? 0).toFixed ? workHour.overtime.toFixed(2) : Number(workHour.overtime || 0).toFixed(2)}h</span>
                      ) : (
                        <span className="no-overtime">--</span>
                      )}
                    </td>
                    <td className="work-hour-status">
                      <span className={`status-badge status-${workHour.status}`}>
                        {formatStatus(workHour.status)}
                      </span>
                    </td>
                    <td className="work-hour-notes">
                      <div className="notes-content">
                        {workHour.notes || 'Không có ghi chú'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal sửa giờ làm việc (có thể mở từ nơi khác nếu cần) */}
        {showEditModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Sửa bản ghi giờ làm việc</h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên nhân viên *</label>
                    <input
                      type="text"
                      name="employeeName"
                      value={formData.employeeName}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập tên nhân viên"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Mã nhân viên *</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập mã nhân viên"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Ngày làm việc *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Giờ vào *</label>
                    <input
                      type="time"
                      name="checkIn"
                      value={formData.checkIn}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Giờ ra *</label>
                    <input
                      type="time"
                      name="checkOut"
                      value={formData.checkOut}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tổng giờ làm việc</label>
                    <input
                      type="number"
                      name="totalHours"
                      value={formData.totalHours}
                      onChange={handleInputChange}
                      step="0.25"
                      min="0"
                      placeholder="8.0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Giờ làm thêm</label>
                    <input
                      type="number"
                      name="overtime"
                      value={formData.overtime}
                      onChange={handleInputChange}
                      step="0.25"
                      min="0"
                      placeholder="0.0"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="completed">Hoàn thành</option>
                    <option value="overtime">Làm thêm</option>
                    <option value="short">Thiếu giờ</option>
                    <option value="late">Đi muộn</option>
                    <option value="absent">Vắng mặt</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Ghi chú về giờ làm việc"
                    rows="3"
                  />
                </div>
                
                <div className="modal-footer">
                  <AdminButton type="button" onClick={closeModal} variant="outline">
                    Hủy
                  </AdminButton>
                  <AdminButton type="submit" variant="primary">
                    Cập nhật
                  </AdminButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default WorkHours;