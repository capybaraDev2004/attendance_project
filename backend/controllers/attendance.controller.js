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
    let workUnit = 0;
    if (workedMinutes < FULL_DAY_MINUTES) {
      const ratio = workedMinutes / FULL_DAY_MINUTES;
      if (ratio >= 0.75) workUnit = 0.75;
      else if (ratio >= 0.5) workUnit = 0.5;
      else if (ratio >= 0.25) workUnit = 0.25;
      else workUnit = 0;
    } else {
      workUnit = +(1 + overtimeMinutes / 60).toFixed(2);
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

module.exports = { checkIn, checkOut, history, userHistory };
