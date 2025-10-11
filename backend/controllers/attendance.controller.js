// backend/controllers/attendance.controller.js
const { pool } = require('../config/database');

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

    // Helper: lấy yyyy-MM-dd theo múi giờ local
    const toLocalYMD = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    // Biến đổi thành danh sách đầy đủ: header từng ngày + mọi lần in/out
    let actualRecordCount = 0;
    const processedData = [];
    let lastDateHeader = '';

    rows.forEach(record => {
      const checkInObj = record.check_in ? new Date(record.check_in) : null;
      const workDateObj = record.work_date ? new Date(record.work_date) : null;
      const checkOutObj = record.check_out ? new Date(record.check_out) : null;

      const displayDate = checkInObj
        ? toLocalYMD(checkInObj)
        : (workDateObj ? toLocalYMD(workDateObj) : (checkOutObj ? toLocalYMD(checkOutObj) : ''));

      if (displayDate && displayDate !== lastDateHeader) {
        processedData.push({
          id: `date_${displayDate}`,
          date: displayDate,
          time: '',
          type: 'DATE_HEADER',
          status: '',
          location: '',
          isDateHeader: true
        });
        lastDateHeader = displayDate;
      }

      if (checkInObj) {
        actualRecordCount++;
        const [sh, sm] = startTime.split(':');
        const expectedStart = new Date(checkInObj.getFullYear(), checkInObj.getMonth(), checkInObj.getDate(), parseInt(sh), parseInt(sm), 0, 0);
        const minutesLate = Math.floor((checkInObj.getTime() - expectedStart.getTime()) / 60000);
        let status = 'Đúng giờ';
        if (minutesLate > 0) status = `Muộn ${formatTime(minutesLate)}`;
        else if (minutesLate < -5) status = 'Sớm';

        processedData.push({
          id: `${record.attendance_id}_in`,
          date: displayDate,
          time: `${String(checkInObj.getHours()).padStart(2, '0')}:${String(checkInObj.getMinutes()).padStart(2, '0')}`,
          type: 'Check-in',
          status,
          location: record.device_in_location || record.device_in_name || 'Văn phòng chính',
          isLate: minutesLate > 0,
          minutesLate: minutesLate > 0 ? minutesLate : 0
        });
      }

      if (checkOutObj) {
        actualRecordCount++;
        const [eh, em] = endTime.split(':');
        const expectedEnd = new Date(checkOutObj.getFullYear(), checkOutObj.getMonth(), checkOutObj.getDate(), parseInt(eh), parseInt(em), 0, 0);
        const minutesDelta = Math.floor((checkOutObj.getTime() - expectedEnd.getTime()) / 60000);
        let status = 'Đúng giờ';
        if (minutesDelta < -5) status = `Sớm ${Math.abs(minutesDelta)} phút`;
        else if (minutesDelta > 0) status = `Tăng ca ${formatTime(minutesDelta)}`;

        processedData.push({
          id: `${record.attendance_id}_out`,
          date: displayDate,
          time: `${String(checkOutObj.getHours()).padStart(2, '0')}:${String(checkOutObj.getMinutes()).padStart(2, '0')}`,
          type: 'Check-out',
          status,
          location: record.device_out_location || record.device_out_name || 'Văn phòng chính',
          isOvertime: minutesDelta > 0,
          minutesOvertime: minutesDelta > 0 ? minutesDelta : 0
        });
      }
    });

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


/* -------------------------------------------------------
   ESP8266 RFID: nhiều lần quét trong ngày (pairing logic)
   - Nếu bản ghi mới nhất của hôm nay chưa có check_out -> set check_out
   - Ngược lại -> tạo bản ghi check_in mới
   - Sau khi ghi DB -> emit realtime bằng socket.io
------------------------------------------------------- */
async function scanRFID(req, res, next) {
  try {
    const { uid, device_id } = req.body;
    const io = req.app.get('io');

    if (!uid || !device_id) {
      return res.status(400).json({ success: false, message: 'Thiếu uid hoặc device_id' });
    }

    // Tìm user theo UID
    const [userRows] = await pool.execute(
      'SELECT userID, fullName FROM users WHERE rfid_uid = ? AND status = 1 LIMIT 1',
      [uid]
    );
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'UID không hợp lệ' });
    }
    const user = userRows[0];

    // Lấy bản ghi mới nhất hôm nay
    const [lastRows] = await pool.execute(
      `SELECT * FROM attendance 
       WHERE user_id = ? AND work_date = CURDATE()
       ORDER BY attendance_id DESC LIMIT 1`,
      [user.userID]
    );

    let action, recordId;
    if (!lastRows.length || (lastRows[0].check_in && lastRows[0].check_out)) {
      // Tạo bản ghi check-in mới
      const [result] = await pool.execute(
        `INSERT INTO attendance (user_id, rfid_uid, work_date, check_in, device_in_id, status)
         VALUES (?, ?, CURDATE(), NOW(), ?, 'present')`,
        [user.userID, uid, device_id]
      );
      recordId = result.insertId;
      action = 'Check-in';
    } else {
      // Cập nhật check-out
      await pool.execute(
        `UPDATE attendance 
           SET check_out = NOW(), device_out_id = ?, updated_at = NOW()
         WHERE attendance_id = ?`,
        [device_id, lastRows[0].attendance_id]
      );
      recordId = lastRows[0].attendance_id;
      action = 'Check-out';
    }

    // Emit realtime payload
    const now = new Date();
    const payload = {
      id: recordId,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().substring(0, 5),
      type: action,
      status: 'Đúng giờ',
      location: 'RFID Device',
      userName: user.fullName
    };

    if (io) {
      io.emit('attendanceUpdate', payload);
      console.log('📡 Emit attendanceUpdate:', payload);
    }

    return res.json({
      success: true,
      action,
      message: `✅ ${user.fullName} ${action}`,
      data: payload
    });
  } catch (err) {
    console.error('❌ scanRFID error:', err);
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

module.exports = { checkIn, checkOut, history, userHistory, recordsByMonth, scanRFID };