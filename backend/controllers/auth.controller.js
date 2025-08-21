// backend/controllers/auth.controller.js
const { pool } = require('../config/database');

// Đăng nhập: kiểm tra username/password → trả về token base64 và role (employee → customer)
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Thiếu username hoặc password' });
    }

    const [rows] = await pool.execute(
      'SELECT userID, fullName, userName, role FROM users WHERE userName = ? AND password = ? LIMIT 1',
      [username, password]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
    }

    const user = rows[0];
    const role = user.role === 'admin' ? 'admin' : 'customer';

    // Token demo: base64 payload (không dùng cho production)
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
    next(err);
  }
}

module.exports = { login };
