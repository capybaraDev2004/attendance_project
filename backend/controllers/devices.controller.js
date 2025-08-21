// backend/controllers/devices.controller.js
const { pool } = require('../config/database');

// Lấy danh sách thiết bị bật (is_active = 1)
async function listActive(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT device_id, device_code, device_name, location, is_active
      FROM devices 
      WHERE is_active = 1
      ORDER BY device_id ASC
    `);

    return res.json({
      success: true,
      devices: rows,
      count: rows.length
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listActive };
