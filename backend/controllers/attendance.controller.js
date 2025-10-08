// backend/controllers/attendance.controller.js
const { pool } = require('../config/database');

// API đếm số lần chấm công hôm nay (theo số bản ghi attendance có check_in trong ngày)
async function getTodayCount(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM attendance
       WHERE work_date = CURDATE() AND check_in IS NOT NULL`
    );
    return res.json({ success: true, count: rows[0]?.count || 0 });
  } catch (err) {
    next(err);
  }
}

// Check-in cho admin
async function checkIn(req, res, next) {
  try {
    const { user_id, device_id, check_time } = req.body;

    if (!user_id || !device_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin user_id hoặc device_id'
      });
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const checkInTime = check_time || new Date().toISOString();

    // Kiểm tra tồn tại bản ghi trong ngày
    const [existingRecords] = await pool.execute(
      'SELECT * FROM attendance WHERE user_id = ? AND work_date = ?',
      [user_id, currentDate]
    );

    if (existingRecords.length > 0) {
      if (!existingRecords[0].check_in) {
        await pool.execute(
          'UPDATE attendance SET check_in = ?, device_in_id = ?, updated_at = NOW() WHERE attendance_id = ?',
          [checkInTime, device_id, existingRecords[0].attendance_id]
        );
      } else {
        return res.status(400).json({
          success: false,
          message: 'Nhân viên đã check in hôm nay'
        });
      }
    } else {
      await pool.execute(
        'INSERT INTO attendance (user_id, work_date, check_in, device_in_id) VALUES (?, ?, ?, ?)',
        [user_id, currentDate, checkInTime, device_id]
      );
    }

    const [userInfo] = await pool.execute(
      'SELECT fullName FROM users WHERE userID = ?',
      [user_id]
    );

    return res.json({
      success: true,
      message: 'Check in thành công',
      data: {
        user_id,
        user_name: userInfo[0]?.fullName,
        check_in: checkInTime,
        device_id
      }
    });
  } catch (err) {
    next(err);
  }
}

// Tính thống kê công và upsert vào bảng attendance_records
async function upsertAttendanceRecord({ userId, workDate, checkIn, checkOut }) {
  try {
    if (!checkIn || !checkOut) return; // chỉ xử lý khi đủ cả 2 mốc

    // Tính phút làm việc thực tế (trừ 60 phút ăn)
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const workedMinutesRaw = Math.max(0, Math.round((outDate.getTime() - inDate.getTime()) / 60000));
    const workedMinutes = Math.max(0, workedMinutesRaw - 60);

    const FULL_DAY_MINUTES = 8 * 60 + 30; // 8h30 = 510 phút

    // Tổng giờ làm trong ngày
    const totalHours = +(workedMinutes / 60).toFixed(2);
    const standardHours = 8; // giờ chuẩn hiển thị theo mô tả

    // Giờ vượt tính theo mốc 8h30 sau khi trừ ăn
    const overtimeMinutes = Math.max(0, workedMinutes - FULL_DAY_MINUTES);
    const overtimeHours = +(overtimeMinutes / 60).toFixed(2);

    // Tính work_unit theo yêu cầu
    // work_unit chỉ nhận 0, 0.25, 0.5, 0.75, 1 (không cộng giờ vượt)
    let workUnit = 0;
    if (workedMinutes >= FULL_DAY_MINUTES) {
      workUnit = 1;
    } else {
      const ratio = workedMinutes / FULL_DAY_MINUTES;
      if (ratio >= 0.75) workUnit = 0.75;
      else if (ratio >= 0.5) workUnit = 0.5;
      else if (ratio >= 0.25) workUnit = 0.25;
      else workUnit = 0;
    }

    // Upsert vào attendance_records
    const [exists] = await pool.execute(
      'SELECT recordID FROM attendance_records WHERE userID = ? AND work_date = ?',
      [userId, workDate]
    );

    if (exists.length > 0) {
      await pool.execute(
        `UPDATE attendance_records
         SET total_hours = ?, standard_hours = ?, overtime_hours = ?, work_unit = ?, updated_at = NOW()
         WHERE recordID = ?`,
        [totalHours, standardHours, overtimeHours, workUnit, exists[0].recordID]
      );
    } else {
      await pool.execute(
        `INSERT INTO attendance_records
         (userID, work_date, total_hours, standard_hours, overtime_hours, work_unit)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, workDate, totalHours, standardHours, overtimeHours, workUnit]
      );
    }
  } catch (err) {
    // Không throw để không chặn luồng chấm công; chỉ log ra server
    console.error('Failed to upsert attendance_records:', err);
  }
}

// Check-out cho admin
async function checkOut(req, res, next) {
  try {
    const { user_id, device_id, check_time } = req.body;

    if (!user_id || !device_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin user_id hoặc device_id'
      });
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const checkOutTime = check_time || new Date().toISOString();

    const [existingRecords] = await pool.execute(
      'SELECT * FROM attendance WHERE user_id = ? AND work_date = ?',
      [user_id, currentDate]
    );

    if (existingRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nhân viên chưa check in hôm nay'
      });
    }

    if (existingRecords[0].check_out) {
      return res.status(400).json({
        success: false,
        message: 'Nhân viên đã check out hôm nay'
      });
    }

    await pool.execute(
      'UPDATE attendance SET check_out = ?, device_out_id = ?, updated_at = NOW() WHERE attendance_id = ?',
      [checkOutTime, device_id, existingRecords[0].attendance_id]
    );

    // Lấy lại bản ghi vừa cập nhật để tính công và cập nhật attendance_records
    const [updatedRows] = await pool.execute(
      'SELECT work_date, check_in, check_out FROM attendance WHERE attendance_id = ?',
      [existingRecords[0].attendance_id]
    );
    const updated = updatedRows[0];
    await upsertAttendanceRecord({
      userId: user_id,
      workDate: updated.work_date,
      checkIn: updated.check_in,
      checkOut: updated.check_out
    });

    const [userInfo] = await pool.execute(
      'SELECT fullName FROM users WHERE userID = ?',
      [user_id]
    );

    return res.json({
      success: true,
      message: 'Check out thành công',
      data: {
        user_id,
        user_name: userInfo[0]?.fullName,
        check_out: checkOutTime,
        device_id
      }
    });
  } catch (err) {
    next(err);
  }
}

// Lịch sử chấm công
async function history(req, res, next) {
  try {
    const { start_date, end_date, user_id, device_id } = req.query;

    let query = `
      SELECT 
        a.attendance_id,
        a.user_id,
        u.fullName,
        a.work_date,
        a.check_in,
        a.check_out,
        a.device_in_id,
        a.device_out_id,
        d1.device_name as device_in_name,
        d2.device_name as device_out_name
      FROM attendance a
      JOIN users u ON a.user_id = u.userID
      LEFT JOIN devices d1 ON a.device_in_id = d1.device_id
      LEFT JOIN devices d2 ON a.device_out_id = d2.device_id
      WHERE 1=1
    `;

    const params = [];

    if (start_date) {
      query += ' AND a.work_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND a.work_date <= ?';
      params.push(end_date);
    }
    if (user_id && user_id !== 'all') {
      query += ' AND a.user_id = ?';
      params.push(user_id);
    }
    if (device_id && device_id !== 'all') {
      query += ' AND (a.device_in_id = ? OR a.device_out_id = ?)';
      params.push(device_id, device_id);
    }

    query += ' ORDER BY a.work_date DESC, a.check_in DESC';

    const [rows] = await pool.execute(query, params);

    return res.json({
      success: true,
      attendance: rows,
      count: rows.length
    });
  } catch (err) {
    next(err);
  }
}

// Hàm chuyển đổi phút thành giờ và phút
function formatTime(minutes) {
  if (minutes <= 0) return '';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} giờ ${remainingMinutes} phút`;
  } else if (hours > 0) {
    return `${hours} giờ`;
  } else {
    return `${remainingMinutes} phút`;
  }
}

// Hàm format ngày theo định dạng dd/mm/yyyy
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Lịch sử chấm công cho user hiện tại với tính toán trạng thái muộn giờ
async function userHistory(req, res, next) {
  try {
    const { user_id } = req.params;

    console.log('🔍 API userHistory được gọi với user_id:', user_id);

    if (!user_id) {
      console.error('❌ Thiếu user_id trong request');
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin user_id'
      });
    }

    // Test kết nối database trước
    try {
      const [testQuery] = await pool.execute('SELECT 1 as test');
      console.log('✅ Kết nối database thành công:', testQuery);
    } catch (dbError) {
      console.error('❌ Lỗi kết nối database:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Lỗi kết nối cơ sở dữ liệu'
      });
    }

    // Lấy thông tin ca làm việc mặc định (ca hành chính)
    console.log('📅 Đang lấy thông tin ca làm việc...');
    const [shifts] = await pool.execute(
      'SELECT * FROM shifts WHERE is_active = 1 ORDER BY shift_id LIMIT 1'
    );

    console.log('📅 Ca làm việc:', shifts);
    const defaultShift = shifts[0] || { start_time: '08:00:00', end_time: '17:30:00' };
    const startTime = defaultShift.start_time;
    const endTime = defaultShift.end_time;
    console.log('⏰ Thời gian ca làm việc:', { startTime, endTime });

    // Lấy lịch sử chấm công của user
    console.log('📊 Đang lấy lịch sử chấm công cho user:', user_id);
    const query = `
      SELECT 
        a.attendance_id,
        a.user_id,
        a.work_date,
        a.check_in,
        a.check_out,
        d1.device_name as device_in_name,
        d2.device_name as device_out_name,
        d1.location as device_in_location,
        d2.location as device_out_location
      FROM attendance a
      LEFT JOIN devices d1 ON a.device_in_id = d1.device_id
      LEFT JOIN devices d2 ON a.device_out_id = d2.device_id
      WHERE a.user_id = ?
      ORDER BY a.work_date DESC, a.check_in DESC
      LIMIT 50
    `;

    const [rows] = await pool.execute(query, [user_id]);
    console.log('📊 Dữ liệu attendance từ DB:', rows);

    // Nhóm dữ liệu theo ngày và xử lý
    const groupedByDate = {};
    let actualRecordCount = 0; // Đếm số bản ghi thực tế (không tính header ngày)

    rows.forEach(record => {
      const dateKey = record.work_date;
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: dateKey,
          checkIn: null,
          checkOut: null
        };
      }

      // Xử lý check-in
      if (record.check_in) {
        actualRecordCount++; // Tăng đếm cho mỗi check-in
        const checkInTime = new Date(record.check_in);
        const checkInTimeStr = checkInTime.toTimeString().substring(0, 5);
        const workDate = new Date(record.work_date);
        const expectedStartTime = new Date(workDate);
        const [hours, minutes] = startTime.split(':');
        expectedStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const timeDiff = checkInTime.getTime() - expectedStartTime.getTime();
        const minutesLate = Math.floor(timeDiff / (1000 * 60));

        let status = 'Đúng giờ';
        if (minutesLate > 0) {
          const lateText = formatTime(minutesLate);
          status = `Muộn ${lateText}`;
        } else if (minutesLate < -5) {
          status = 'Sớm';
        }

        groupedByDate[dateKey].checkIn = {
          id: `${record.attendance_id}_in`,
          time: checkInTimeStr,
          type: 'Check-in',
          status: status,
          location: record.device_in_location || record.device_in_name || 'Văn phòng chính',
          isLate: minutesLate > 0,
          minutesLate: minutesLate > 0 ? minutesLate : 0
        };
      }

      // Xử lý check-out
      if (record.check_out) {
        actualRecordCount++; // Tăng đếm cho mỗi check-out
        const checkOutTime = new Date(record.check_out);
        const checkOutTimeStr = checkOutTime.toTimeString().substring(0, 5);
        const workDate = new Date(record.work_date);
        const expectedEndTime = new Date(workDate);
        const [hours, minutes] = endTime.split(':');
        expectedEndTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const timeDiff = checkOutTime.getTime() - expectedEndTime.getTime();
        const minutesLate = Math.floor(timeDiff / (1000 * 60));

        let status = 'Đúng giờ';
        if (minutesLate < -5) {
          status = `Sớm ${Math.abs(minutesLate)} phút`;
        } else if (minutesLate > 0) {
          const overtimeText = formatTime(minutesLate);
          status = `Tăng ca ${overtimeText}`;
        }

        groupedByDate[dateKey].checkOut = {
          id: `${record.attendance_id}_out`,
          time: checkOutTimeStr,
          type: 'Check-out',
          status: status,
          location: record.device_out_location || record.device_out_name || 'Văn phòng chính',
          isOvertime: minutesLate > 0,
          minutesOvertime: minutesLate > 0 ? minutesLate : 0
        };
      }
    });

    // Chuyển đổi thành array và sắp xếp theo ngày giảm dần
    const processedData = Object.values(groupedByDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(dateGroup => {
        const result = [];

        // Thêm header ngày
        result.push({
          id: `date_${dateGroup.date}`,
          date: dateGroup.date,
          time: '',
          type: 'DATE_HEADER',
          status: '',
          location: '',
          isDateHeader: true
        });

        // Thêm check-in nếu có
        if (dateGroup.checkIn) {
          result.push({
            ...dateGroup.checkIn,
            date: dateGroup.date
          });
        }

        // Thêm check-out nếu có
        if (dateGroup.checkOut) {
          result.push({
            ...dateGroup.checkOut,
            date: dateGroup.date
          });
        }

        return result;
      }).flat();

    console.log('✅ Dữ liệu đã xử lý và nhóm theo ngày:', processedData);
    console.log('📊 Số bản ghi thực tế (không tính header):', actualRecordCount);

    return res.json({
      success: true,
      data: processedData,
      count: actualRecordCount, // Trả về số bản ghi thực tế
      totalDisplayed: processedData.length // Tổng số dòng hiển thị (bao gồm header)
    });
  } catch (err) {
    console.error('❌ Lỗi trong userHistory:', err);
    next(err);
  }
}
// API: Lấy tổng hợp attendance_records theo tháng và (tùy chọn) theo user
// Query: month=YYYY-MM hoặc start_date, end_date; user_id=optional
async function recordsByMonth(req, res, next) {
  try {
    const { month, start_date, end_date, user_id } = req.query;

    // Xác định khoảng thời gian
    let startDate = start_date;
    let endDate = end_date;
    if (month) {
      // Tạo khoảng [đầu tháng, cuối tháng]
      const [y, m] = month.split('-');
      const first = new Date(Number(y), Number(m) - 1, 1);
      const last = new Date(Number(y), Number(m), 0);
      startDate = first.toISOString().slice(0, 10);
      endDate = last.toISOString().slice(0, 10);
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số thời gian (month hoặc start_date/end_date)' });
    }

    // Tổng hợp theo userID
    let query = `
      SELECT ar.userID,
             u.fullName,
             COUNT(ar.recordID) AS working_days,
             COALESCE(SUM(ar.work_unit), 0) AS total_work_units,
             COALESCE(SUM(ar.total_hours), 0) AS total_hours,
             COALESCE(SUM(ar.overtime_hours), 0) AS total_overtime_hours
      FROM attendance_records ar
      JOIN users u ON u.userID = ar.userID
      WHERE ar.work_date BETWEEN ? AND ?
    `;
    const params = [startDate, endDate];
    if (user_id && user_id !== 'all') {
      query += ' AND ar.userID = ?';
      params.push(user_id);
    }
    query += ' GROUP BY ar.userID, u.fullName ORDER BY u.fullName ASC';

    const [rows] = await pool.execute(query, params);

    return res.json({
      success: true,
      range: { startDate, endDate },
      data: rows
    });
  } catch (err) {
    next(err);
  }
}

// API: Tổng hợp bảng lương theo tháng
// Query: month=YYYY-MM (ưu tiên) hoặc start_date, end_date
// Yêu cầu: lấy tất cả nhân viên active, lương cơ bản = salaryRank (nếu không có, dùng 0),
// tính: tổng công (sum work_unit làm tròn 0.25), tổng giờ làm thêm (sum overtime_hours),
// tổng ngày đi muộn (đếm số ngày attendance.check_in > start_time ca), tiền phạt = 50,000/ngày muộn
// công thức lương:
// - nếu đủ 26 công: total = base + (overtimeHours * 150% * base/26) - penalties
// - nếu < 26 công: total = (base/26 * actualDays) - penalties
async function payrollByMonth(req, res, next) {
  try {
    const { month, start_date, end_date, user_id } = req.query;

    // Xác định khoảng thời gian
    let startDate = start_date;
    let endDate = end_date;
    if (month) {
      const [y, m] = month.split('-');
      const first = new Date(Number(y), Number(m) - 1, 1);
      const last = new Date(Number(y), Number(m), 0);
      startDate = first.toISOString().slice(0, 10);
      endDate = last.toISOString().slice(0, 10);
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số thời gian (month hoặc start_date/end_date)' });
    }

    // Lấy ca làm việc để xác định giờ bắt đầu cho tính đi muộn
    const [shifts] = await pool.execute(
      'SELECT * FROM shifts WHERE is_active = 1 ORDER BY shift_id LIMIT 1'
    );
    const defaultShift = shifts[0] || { start_time: '08:00:00' };
    const startTime = defaultShift.start_time; // HH:MM:SS

    // Lấy tất cả nhân viên active, cùng thông tin vị trí để lấy phòng ban (nếu có)
    // Gỉa định users có cột position (title) để join với positions lấy department, đồng thời có salaryRank (nếu không có sẽ trả null)
    const [users] = await pool.execute(`
      SELECT 
        u.userID,
        u.fullName,
        u.position,
        u.status,
        COALESCE(u.salaryRank, 0) AS salaryRank,
        p.Department AS department
      FROM users u
      LEFT JOIN positions p ON TRIM(p.Title) = TRIM(u.position)
      WHERE u.status = 'active'
      ORDER BY u.fullName ASC
    `);

    // Tổng hợp attendance_records theo user trong khoảng
    let recordsQuery = `SELECT 
         ar.userID,
         COALESCE(SUM(ar.work_unit), 0) AS total_work_units,
         COALESCE(SUM(ar.overtime_hours), 0) AS total_overtime_hours
       FROM attendance_records ar
       WHERE ar.work_date BETWEEN ? AND ?`;
    const recParams = [startDate, endDate];
    if (user_id && user_id !== 'all') {
      recordsQuery += ' AND ar.userID = ?';
      recParams.push(user_id);
    }
    recordsQuery += ' GROUP BY ar.userID';
    const [records] = await pool.execute(recordsQuery, recParams);

    // Tính số ngày đi muộn từ bảng attendance dựa vào start_time của ca làm
    let lateQuery = `SELECT a.user_id AS userID, COUNT(*) AS late_days
       FROM attendance a
       WHERE a.work_date BETWEEN ? AND ?
         AND a.check_in IS NOT NULL
         AND TIME(a.check_in) > ?`;
    const lateParams = [startDate, endDate, startTime];
    if (user_id && user_id !== 'all') {
      lateQuery += ' AND a.user_id = ?';
      lateParams.push(user_id);
    }
    lateQuery += ' GROUP BY a.user_id';
    const [lateRows] = await pool.execute(lateQuery, lateParams);

    const userIdToRecord = new Map(records.map(r => [r.userID, r]));
    const userIdToLate = new Map(lateRows.map(r => [r.userID, r.late_days]));

    const LATE_PENALTY_PER_DAY = 50000; // 50,000 VND
    const REQUIRED_DAYS = 26;

    // Tổng hợp kết quả theo từng user active
    const activeUsers = (user_id && user_id !== 'all') ? users.filter(u => u.userID == user_id) : users;
    const result = activeUsers.map(u => {
      const rec = userIdToRecord.get(u.userID) || { total_work_units: 0, total_overtime_hours: 0 };
      const totalWorkUnits = Number(rec.total_work_units) || 0;
      const totalOvertimeHours = Number(rec.total_overtime_hours) || 0;
      // Làm tròn về bội số 0.25 để phù hợp quy ước work_unit
      const roundedWorkUnits = Math.round(totalWorkUnits * 4) / 4;
      const actualWorkingDays = Math.min(roundedWorkUnits, REQUIRED_DAYS);

      const lateDays = Number(userIdToLate.get(u.userID) || 0);
      const totalPenaltyAmount = lateDays * LATE_PENALTY_PER_DAY;

      const baseSalary = Number(u.salaryRank || 0);

      let totalSalary = 0;
      if (actualWorkingDays >= REQUIRED_DAYS) {
        // Đủ 26 công
        const overtimePayPerHour = 1.5 * (baseSalary / REQUIRED_DAYS);
        const overtimePay = totalOvertimeHours * overtimePayPerHour;
        totalSalary = baseSalary + overtimePay - totalPenaltyAmount;
      } else {
        // Không đủ 26 công
        const dailyRate = baseSalary / REQUIRED_DAYS;
        totalSalary = dailyRate * actualWorkingDays - totalPenaltyAmount;
      }

      return {
        userID: u.userID,
        fullName: u.fullName,
        department: u.department || null,
        position: u.position || null,
        salaryRank: baseSalary,
        totalWorkDays: +actualWorkingDays.toFixed(2),
        totalOvertimeHours: +Number(totalOvertimeHours || 0).toFixed(2),
        totalLateDays: lateDays,
        totalPenaltyAmount,
        totalSalary: Math.round(totalSalary) // cho phép âm theo yêu cầu, làm tròn VND
      };
    });

    return res.json({
      success: true,
      range: { startDate, endDate },
      count: result.length,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkIn, checkOut, history, userHistory, recordsByMonth, getTodayCount, payrollByMonth };
