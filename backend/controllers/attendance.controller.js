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
        u.rfid_code,
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

module.exports = { checkIn, checkOut, history };
