// attendance_project/backend/index.js
// Backend Express tối giản: Đăng nhập và map role employee -> customer

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// Tạo pool kết nối MySQL (XAMPP)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'attendance_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Đăng nhập đơn giản: kiểm tra userName/password và trả về role
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate đầu vào đơn giản
  if (!username || !password) {
    return res.status(400).json({ message: 'Thiếu username hoặc password' });
  }

  try {
    // Truy vấn người dùng
    const [rows] = await pool.execute(
      'SELECT userID, fullName, userName, role FROM users WHERE userName = ? AND password = ? LIMIT 1',
      [username, password]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
    }

    const user = rows[0];

    // Map role 'employee' -> 'customer' để phù hợp yêu cầu
    const role = user.role === 'admin' ? 'admin' : 'customer';

    // Tạo token đơn giản (base64 của payload) - chỉ demo, không dùng cho production
    // Comment: Token này không an toàn, nhưng đáp ứng yêu cầu "không cần cấu hình phức tạp"
    const payload = {
      userID: user.userID,
      fullName: user.fullName,
      userName: user.userName,
      role
    };
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');

    return res.json({
      success: true,
      user: payload,
      role,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// Test kết nối database
app.get('/test-db', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ 
      success: true, 
      message: 'Kết nối database thành công',
      time: new Date().toISOString()
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi kết nối database',
      error: err.message
    });
  }
});

// API lấy danh sách người dùng (loại trừ userName, password, updated_at)
app.get('/api/users', async (req, res) => {
  try {
    console.log('Đang lấy danh sách người dùng...');
    
    const [rows] = await pool.execute(`
      SELECT 
        userID, 
        fullName, 
        address, 
        role, 
        email, 
        phone, 
        dateOfBirth, 
        gender, 
        position, 
        status, 
        created_at
      FROM users 
      ORDER BY userID ASC
    `);

    console.log(`Đã lấy được ${rows.length} người dùng`);
    
    // Đảm bảo sắp xếp lại theo ID tăng dần
    const sortedUsers = rows.sort((a, b) => a.userID - b.userID);
    
    return res.json({
      success: true,
      users: sortedUsers,
      count: sortedUsers.length
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách người dùng:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách người dùng',
      error: err.message
    });
  }
});

// API check in/out cho admin
app.post('/api/attendance/check-in', async (req, res) => {
  const { user_id, device_id, check_time } = req.body;
  
  if (!user_id || !device_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Thiếu thông tin user_id hoặc device_id' 
    });
  }

  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const checkInTime = check_time || new Date().toISOString();
    
    // Kiểm tra xem đã có bản ghi attendance cho ngày hôm nay chưa
    const [existingRecords] = await pool.execute(
      'SELECT * FROM attendance WHERE user_id = ? AND work_date = ?',
      [user_id, currentDate]
    );

    if (existingRecords.length > 0) {
      // Cập nhật check_in nếu chưa có
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
      // Tạo bản ghi mới
      await pool.execute(
        'INSERT INTO attendance (user_id, work_date, check_in, device_in_id) VALUES (?, ?, ?, ?)',
        [user_id, currentDate, checkInTime, device_id]
      );
    }

    // Lấy thông tin user để trả về
    const [userInfo] = await pool.execute(
      'SELECT fullName FROM users WHERE userID = ?',
      [user_id]
    );

    res.json({
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
    console.error('Check in error:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi check in',
      error: err.message
    });
  }
});

app.post('/api/attendance/check-out', async (req, res) => {
  const { user_id, device_id, check_time } = req.body;
  
  if (!user_id || !device_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Thiếu thông tin user_id hoặc device_id' 
    });
  }

  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const checkOutTime = check_time || new Date().toISOString();
    
    // Kiểm tra xem đã có bản ghi attendance cho ngày hôm nay chưa
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

    // Cập nhật check_out
    await pool.execute(
      'UPDATE attendance SET check_out = ?, device_out_id = ?, updated_at = NOW() WHERE attendance_id = ?',
      [checkOutTime, device_id, existingRecords[0].attendance_id]
    );

    // Lấy thông tin user để trả về
    const [userInfo] = await pool.execute(
      'SELECT fullName FROM users WHERE userID = ?',
      [user_id]
    );

    res.json({
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
    console.error('Check out error:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi check out',
      error: err.message
    });
  }
});

// API lấy danh sách thiết bị
app.get('/api/devices', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT device_id, device_code, device_name, location, is_active
      FROM devices 
      WHERE is_active = 1
      ORDER BY device_id ASC
    `);

    res.json({
      success: true,
      devices: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách thiết bị:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách thiết bị',
      error: err.message
    });
  }
});

// API lấy lịch sử attendance
app.get('/api/attendance/history', async (req, res) => {
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
    
    res.json({
      success: true,
      attendance: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('Lỗi khi lấy lịch sử attendance:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi máy chủ khi lấy lịch sử attendance',
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API đang chạy tại http://localhost:${PORT}`);
});
