// backend/controllers/users.controller.js
const { pool } = require('../config/database');

// Lấy danh sách người dùng (ẩn username/password)
// Giữ nguyên response như backend cũ để frontend không phải chỉnh sửa
async function getUsers(req, res, next) {
  try {
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

    // Sắp xếp ID tăng dần (bảo toàn hành vi cũ)
    const sortedUsers = rows.sort((a, b) => a.userID - b.userID);

    return res.json({
      success: true,
      users: sortedUsers,
      count: sortedUsers.length
    });
  } catch (err) {
    // Đẩy lỗi cho error handler chung
    next(err);
  }
}

module.exports = { getUsers };