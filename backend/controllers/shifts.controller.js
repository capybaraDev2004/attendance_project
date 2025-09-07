// backend/controllers/shifts.controller.js
const { pool } = require('../config/database');

// Lấy danh sách tất cả ca làm việc
const getAllShifts = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        shift_id,
        shift_name,
        TIME_FORMAT(start_time, '%H:%i') as start_time,
        TIME_FORMAT(end_time, '%H:%i') as end_time,
        break_duration,
        description,
        is_active,
        created_at,
        updated_at
      FROM shifts 
      ORDER BY start_time ASC
    `);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách ca làm việc thành công',
      data: rows
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách ca làm việc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách ca làm việc',
      error: error.message
    });
  }
};

// Lấy thông tin ca làm việc theo ID
const getShiftById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT 
        shift_id,
        shift_name,
        TIME_FORMAT(start_time, '%H:%i') as start_time,
        TIME_FORMAT(end_time, '%H:%i') as end_time,
        break_duration,
        description,
        is_active,
        created_at,
        updated_at
      FROM shifts 
      WHERE shift_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca làm việc'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin ca làm việc thành công',
      data: rows[0]
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin ca làm việc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin ca làm việc',
      error: error.message
    });
  }
};

// Tạo ca làm việc mới
const createShift = async (req, res) => {
  try {
    const { shift_name, start_time, end_time, break_duration = 0, description } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!shift_name || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Tên ca, giờ bắt đầu và giờ kết thúc là bắt buộc'
      });
    }

    // Kiểm tra xem tên ca đã tồn tại chưa
    const [existingShift] = await pool.execute(
      'SELECT shift_id FROM shifts WHERE shift_name = ?',
      [shift_name]
    );

    if (existingShift.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên ca làm việc đã tồn tại'
      });
    }

    // Kiểm tra giờ bắt đầu và kết thúc hợp lệ
    if (start_time >= end_time) {
      return res.status(400).json({
        success: false,
        message: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc'
      });
    }

    // Tạo ca làm việc mới
    const [result] = await pool.execute(`
      INSERT INTO shifts (shift_name, start_time, end_time, break_duration, description)
      VALUES (?, ?, ?, ?, ?)
    `, [shift_name, start_time, end_time, break_duration, description]);

    res.status(201).json({
      success: true,
      message: 'Tạo ca làm việc thành công',
      data: {
        shift_id: result.insertId,
        shift_name,
        start_time,
        end_time,
        break_duration,
        description
      }
    });
  } catch (error) {
    console.error('Lỗi khi tạo ca làm việc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo ca làm việc',
      error: error.message
    });
  }
};

// Cập nhật thông tin ca làm việc
const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { shift_name, start_time, end_time, break_duration, description } = req.body;

    // Kiểm tra ca làm việc có tồn tại không
    const [existingShift] = await pool.execute(
      'SELECT shift_id FROM shifts WHERE shift_id = ?',
      [id]
    );

    if (existingShift.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca làm việc'
      });
    }

    // Kiểm tra tên ca có bị trùng không (nếu có thay đổi)
    if (shift_name) {
      const [duplicateShift] = await pool.execute(
        'SELECT shift_id FROM shifts WHERE shift_name = ? AND shift_id != ?',
        [shift_name, id]
      );

      if (duplicateShift.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Tên ca làm việc đã tồn tại'
        });
      }
    }

    // Kiểm tra giờ hợp lệ
    if (start_time && end_time && start_time >= end_time) {
      return res.status(400).json({
        success: false,
        message: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc'
      });
    }

    // Cập nhật thông tin
    const updateFields = [];
    const updateValues = [];

    if (shift_name) {
      updateFields.push('shift_name = ?');
      updateValues.push(shift_name);
    }
    if (start_time) {
      updateFields.push('start_time = ?');
      updateValues.push(start_time);
    }
    if (end_time) {
      updateFields.push('end_time = ?');
      updateValues.push(end_time);
    }
    if (break_duration !== undefined) {
      updateFields.push('break_duration = ?');
      updateValues.push(break_duration);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật'
      });
    }

    updateValues.push(id);

    await pool.execute(`
      UPDATE shifts 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE shift_id = ?
    `, updateValues);

    res.status(200).json({
      success: true,
      message: 'Cập nhật ca làm việc thành công'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật ca làm việc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật ca làm việc',
      error: error.message
    });
  }
};

// Xóa ca làm việc
const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ca làm việc có tồn tại không
    const [existingShift] = await pool.execute(
      'SELECT shift_id FROM shifts WHERE shift_id = ?',
      [id]
    );

    if (existingShift.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca làm việc'
      });
    }

    // Xóa ca làm việc
    await pool.execute('DELETE FROM shifts WHERE shift_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Xóa ca làm việc thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa ca làm việc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa ca làm việc',
      error: error.message
    });
  }
};

// Bật/tắt trạng thái ca làm việc
const toggleShiftStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ca làm việc có tồn tại không
    const [existingShift] = await pool.execute(
      'SELECT shift_id, is_active FROM shifts WHERE shift_id = ?',
      [id]
    );

    if (existingShift.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca làm việc'
      });
    }

    const newStatus = existingShift[0].is_active ? 0 : 1;

    await pool.execute(
      'UPDATE shifts SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE shift_id = ?',
      [newStatus, id]
    );

    res.status(200).json({
      success: true,
      message: `${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} ca làm việc thành công`,
      data: {
        shift_id: id,
        is_active: newStatus
      }
    });
  } catch (error) {
    console.error('Lỗi khi thay đổi trạng thái ca làm việc:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái ca làm việc',
      error: error.message
    });
  }
};

module.exports = {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  toggleShiftStatus
};
