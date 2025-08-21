// backend/controllers/system.controller.js
const { pool } = require('../config/database');

// Health check
function health(req, res) {
  res.json({ ok: true, time: new Date().toISOString() });
}

// Test DB connection
async function testDb(req, res, next) {
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
    res.status(500).json({
      success: false,
      message: 'Lỗi kết nối database',
      error: err.message
    });
  }
}

module.exports = { health, testDb };
