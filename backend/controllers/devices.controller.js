// backend/controllers/devices.controller.js
const { pool } = require('../config/database');

// Lấy danh sách tất cả thiết bị
async function listAll(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT device_id, device_code, device_name, location, is_active,
             created_at, updated_at
      FROM devices
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

// Lấy danh sách thiết bị đang hoạt động (is_active = 1)
async function listActive(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT device_id, device_code, device_name, location, is_active,
             created_at, updated_at
      FROM devices
      WHERE is_active = 1
      ORDER BY device_id ASC
    `);

    return res.json({ success: true, devices: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

// Tạo thiết bị mới
async function createDevice(req, res, next) {
  try {
    const { device_code, device_name, location, is_active = 1 } = req.body;
    if (!device_code || !device_name) {
      return res.status(400).json({ success: false, message: 'Thiếu device_code hoặc device_name' });
    }

    // Kiểm tra trùng mã thiết bị
    const [exists] = await pool.execute('SELECT device_id FROM devices WHERE device_code = ?', [device_code]);
    if (exists.length > 0) {
      return res.status(400).json({ success: false, message: 'Mã thiết bị đã tồn tại' });
    }

    const [result] = await pool.execute(
      'INSERT INTO devices (device_code, device_name, location, is_active) VALUES (?, ?, ?, ?)',
      [device_code, device_name, location || null, is_active ? 1 : 0]
    );

    return res.status(201).json({
      success: true,
      message: 'Tạo thiết bị thành công',
      data: {
        device_id: result.insertId,
        device_code,
        device_name,
        location: location || null,
        is_active: is_active ? 1 : 0
      }
    });
  } catch (err) {
    next(err);
  }
}

// Cập nhật thiết bị
async function updateDevice(req, res, next) {
  try {
    const { id } = req.params;
    const { device_code, device_name, location, is_active } = req.body;

    // Kiểm tra tồn tại
    const [rows] = await pool.execute('SELECT device_id FROM devices WHERE device_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
    }

    // Kiểm tra trùng mã thiết bị nếu có chỉnh
    if (device_code) {
      const [dup] = await pool.execute(
        'SELECT device_id FROM devices WHERE device_code = ? AND device_id != ?',
        [device_code, id]
      );
      if (dup.length > 0) {
        return res.status(400).json({ success: false, message: 'Mã thiết bị đã tồn tại' });
      }
    }

    const fields = [];
    const values = [];
    if (device_code !== undefined) { fields.push('device_code = ?'); values.push(device_code); }
    if (device_name !== undefined) { fields.push('device_name = ?'); values.push(device_name); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu để cập nhật' });
    }

    values.push(id);
    await pool.execute(`UPDATE devices SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?`, values);

    return res.json({ success: true, message: 'Cập nhật thiết bị thành công' });
  } catch (err) {
    next(err);
  }
}

// Xóa thiết bị
async function deleteDevice(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute('SELECT device_id FROM devices WHERE device_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
    }

    await pool.execute('DELETE FROM devices WHERE device_id = ?', [id]);
    return res.json({ success: true, message: 'Xóa thiết bị thành công' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAll, listActive, createDevice, updateDevice, deleteDevice };
