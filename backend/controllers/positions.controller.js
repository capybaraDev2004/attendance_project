// backend/controllers/positions.controller.js
const { pool } = require('../config/database');

// Lấy danh sách tất cả chức vụ
async function getAllPositions(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        title,
        code,
        description,
        department,
        level,
        CAST(employeeCount AS UNSIGNED) AS employeeCount,
        CAST(salaryMin AS UNSIGNED) AS salaryMin,
        CAST(salaryMax AS UNSIGNED) AS salaryMax,
        CAST(status AS UNSIGNED) AS status,
        created_at
      FROM positions 
      ORDER BY id ASC
    `);

    return res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách chức vụ:', err);
    next(err);
  }
}

// Lấy chức vụ theo ID
async function getPositionById(req, res, next) {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT 
        id,
        title,
        code,
        description,
        department,
        level,
        CAST(employeeCount AS UNSIGNED) AS employeeCount,
        CAST(salaryMin AS UNSIGNED) AS salaryMin,
        CAST(salaryMax AS UNSIGNED) AS salaryMax,
        CAST(status AS UNSIGNED) AS status,
        created_at
      FROM positions 
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chức vụ'
      });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('Lỗi khi lấy chức vụ:', err);
    next(err);
  }
}

// Tạo chức vụ mới
async function createPosition(req, res, next) {
  try {
    const {
      title,
      code,
      description,
      department,
      level,
      salaryMin,
      salaryMax,
      status,
      employeeCount
    } = req.body;

    // Kiểm tra mã chức vụ đã tồn tại chưa
    const [existingRows] = await pool.execute(
      'SELECT id FROM positions WHERE code = ?',
      [code]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã chức vụ đã tồn tại'
      });
    }

    const [result] = await pool.execute(`
      INSERT INTO positions (
        title, code, description, department, level, 
        salaryMin, salaryMax, status, employeeCount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      title,
      code,
      description || '',
      department,
      level,
      salaryMin || null,
      salaryMax || null,
      status || 1,
      (Number.isFinite(parseInt(employeeCount)) ? parseInt(employeeCount) : 0)
    ]);

    // Lấy chức vụ vừa tạo (ép kiểu các cột số để frontend nhận đúng dạng)
    const [newPosition] = await pool.execute(
      `SELECT 
        id,
        title,
        code,
        description,
        department,
        level,
        CAST(employeeCount AS UNSIGNED) AS employeeCount,
        CAST(salaryMin AS UNSIGNED) AS salaryMin,
        CAST(salaryMax AS UNSIGNED) AS salaryMax,
        CAST(status AS UNSIGNED) AS status,
        created_at
      FROM positions WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json(newPosition[0]);
  } catch (err) {
    console.error('Lỗi khi tạo chức vụ:', err);
    next(err);
  }
}

// Cập nhật chức vụ
async function updatePosition(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      code,
      description,
      department,
      level,
      salaryMin,
      salaryMax,
      status,
      employeeCount
    } = req.body;

    // Kiểm tra chức vụ có tồn tại không
    const [existingRows] = await pool.execute(
      'SELECT id FROM positions WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chức vụ'
      });
    }

    // Kiểm tra mã chức vụ đã tồn tại chưa (trừ chức vụ hiện tại)
    const [duplicateRows] = await pool.execute(
      'SELECT id FROM positions WHERE code = ? AND id != ?',
      [code, id]
    );

    if (duplicateRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã chức vụ đã tồn tại'
      });
    }

    await pool.execute(`
      UPDATE positions SET
        title = ?,
        code = ?,
        description = ?,
        department = ?,
        level = ?,
        salaryMin = ?,
        salaryMax = ?,
        status = ?,
        employeeCount = ?
      WHERE id = ?
    `, [
      title,
      code,
      description || '',
      department,
      level,
      salaryMin || null,
      salaryMax || null,
      status || 1,
      (Number.isFinite(parseInt(employeeCount)) ? parseInt(employeeCount) : 0),
      id
    ]);

    // Lấy chức vụ đã cập nhật (ép kiểu số)
    const [updatedPosition] = await pool.execute(
      `SELECT 
        id,
        title,
        code,
        description,
        department,
        level,
        CAST(employeeCount AS UNSIGNED) AS employeeCount,
        CAST(salaryMin AS UNSIGNED) AS salaryMin,
        CAST(salaryMax AS UNSIGNED) AS salaryMax,
        CAST(status AS UNSIGNED) AS status,
        created_at
      FROM positions WHERE id = ?`,
      [id]
    );

    return res.json(updatedPosition[0]);
  } catch (err) {
    console.error('Lỗi khi cập nhật chức vụ:', err);
    next(err);
  }
}

// Xóa chức vụ
async function deletePosition(req, res, next) {
  try {
    const { id } = req.params;

    // Kiểm tra chức vụ có tồn tại không
    const [existingRows] = await pool.execute(
      'SELECT id FROM positions WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chức vụ'
      });
    }

    // Kiểm tra có nhân viên nào đang sử dụng chức vụ này không
    const [employeeRows] = await pool.execute(
      'SELECT userID FROM users WHERE position = ?',
      [id]
    );

    if (employeeRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa chức vụ đang có nhân viên sử dụng'
      });
    }

    await pool.execute('DELETE FROM positions WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Xóa chức vụ thành công'
    });
  } catch (err) {
    console.error('Lỗi khi xóa chức vụ:', err);
    next(err);
  }
}

module.exports = {
  getAllPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition
};
