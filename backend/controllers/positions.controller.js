// backend/controllers/positions.controller.js
const { pool } = require('../config/database');

// Lấy danh sách tất cả chức vụ
async function getAllPositions(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        p.ID as id,
        p.Title as title,
        p.Code as code,
        p.Description as description,
        p.Department as department,
        p.Level as level,
        CAST(p.EmployeeCount AS UNSIGNED) AS employeeCount,
        CAST(p.SalaryMin AS UNSIGNED) AS salaryMin,
        CAST(p.SalaryMax AS UNSIGNED) AS salaryMax,
        CAST(p.Status AS UNSIGNED) AS status,
        p.created_at,
        COALESCE(actual_employees.actualCount, 0) AS actualEmployeeCount
      FROM positions p
      LEFT JOIN (
        SELECT 
          position,
          COUNT(*) as actualCount
        FROM users 
        WHERE status = 'active'
        GROUP BY position
      ) actual_employees ON TRIM(p.Title) = TRIM(actual_employees.position)
      ORDER BY p.ID ASC
    `);

    // Log để debug
    console.log('Positions data:', rows.map(r => ({
      id: r.id,
      title: r.title,
      employeeCount: r.employeeCount,
      actualEmployeeCount: r.actualEmployeeCount
    })));

    return res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách chức vụ:', err);
    next(err);
  }
}

// Lấy danh sách nhân viên theo chức vụ
async function getEmployeesByPosition(req, res, next) {
  try {
    const { id } = req.params;
    
    console.log('Getting employees for position ID:', id);
    
    // Lấy thông tin chức vụ trước
    const [positionRows] = await pool.execute(
      'SELECT * FROM positions WHERE ID = ?',
      [id]
    );

    if (positionRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chức vụ'
      });
    }

    const position = positionRows[0];
    console.log('Position found:', position.Title);

    // Lấy danh sách nhân viên có chức vụ này (chỉ nhân viên đang hoạt động)
    const [employeeRows] = await pool.execute(`
      SELECT 
        userID,
        fullName,
        userName,
        email,
        phone,
        dateOfBirth,
        gender,
        status,
        created_at
      FROM users 
      WHERE position = ? AND status = 'active'
      ORDER BY fullName ASC
    `, [position.Title]);

    console.log('Active employees found:', employeeRows.length);

    return res.json({
      position: {
        id: position.ID,
        title: position.Title,
        code: position.Code,
        description: position.Description,
        department: position.Department,
        level: position.Level,
        employeeCount: position.EmployeeCount,
        salaryMin: position.SalaryMin,
        salaryMax: position.SalaryMax,
        status: position.Status,
        created_at: position.created_at
      },
      employees: employeeRows
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách nhân viên theo chức vụ:', err);
    next(err);
  }
}

// Lấy chức vụ theo ID
async function getPositionById(req, res, next) {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT 
        p.ID as id,
        p.Title as title,
        p.Code as code,
        p.Description as description,
        p.Department as department,
        p.Level as level,
        CAST(p.EmployeeCount AS UNSIGNED) AS employeeCount,
        CAST(p.SalaryMin AS UNSIGNED) AS salaryMin,
        CAST(p.SalaryMax AS UNSIGNED) AS salaryMax,
        CAST(p.Status AS UNSIGNED) AS status,
        p.created_at,
        COALESCE(actual_employees.actualCount, 0) AS actualEmployeeCount
      FROM positions p
      LEFT JOIN (
        SELECT 
          position,
          COUNT(*) as actualCount
        FROM users 
        WHERE status = 'active'
        GROUP BY position
      ) actual_employees ON TRIM(p.Title) = TRIM(actual_employees.position)
      WHERE p.ID = ?
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
      'SELECT ID FROM positions WHERE Code = ?',
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
        Title, Code, Description, Department, Level, 
        SalaryMin, SalaryMax, Status, EmployeeCount, created_at
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
        p.ID as id,
        p.Title as title,
        p.Code as code,
        p.Description as description,
        p.Department as department,
        p.Level as level,
        CAST(p.EmployeeCount AS UNSIGNED) AS employeeCount,
        CAST(p.SalaryMin AS UNSIGNED) AS salaryMin,
        CAST(p.SalaryMax AS UNSIGNED) AS salaryMax,
        CAST(p.Status AS UNSIGNED) AS status,
        p.created_at,
        COALESCE(actual_employees.actualCount, 0) AS actualEmployeeCount
      FROM positions p
      LEFT JOIN (
        SELECT 
          position,
          COUNT(*) as actualCount
        FROM users 
        WHERE status = 'active'
        GROUP BY position
      ) actual_employees ON TRIM(p.Title) = TRIM(actual_employees.position)
      WHERE p.ID = ?`,
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
      'SELECT ID FROM positions WHERE ID = ?',
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
      'SELECT ID FROM positions WHERE Code = ? AND ID != ?',
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
        Title = ?,
        Code = ?,
        Description = ?,
        Department = ?,
        Level = ?,
        SalaryMin = ?,
        SalaryMax = ?,
        Status = ?,
        EmployeeCount = ?
      WHERE ID = ?
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
        p.ID as id,
        p.Title as title,
        p.Code as code,
        p.Description as description,
        p.Department as department,
        p.Level as level,
        CAST(p.EmployeeCount AS UNSIGNED) AS employeeCount,
        CAST(p.SalaryMin AS UNSIGNED) AS salaryMin,
        CAST(p.SalaryMax AS UNSIGNED) AS salaryMax,
        CAST(p.Status AS UNSIGNED) AS status,
        p.created_at,
        COALESCE(actual_employees.actualCount, 0) AS actualEmployeeCount
      FROM positions p
      LEFT JOIN (
        SELECT 
          position,
          COUNT(*) as actualCount
        FROM users 
        WHERE status = 'active'
        GROUP BY position
      ) actual_employees ON TRIM(p.Title) = TRIM(actual_employees.position)
      WHERE p.ID = ?`,
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
      'SELECT ID FROM positions WHERE ID = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chức vụ'
      });
    }

    // Lấy tên chức vụ để kiểm tra nhân viên
    const [positionRows] = await pool.execute(
      'SELECT Title FROM positions WHERE ID = ?',
      [id]
    );

    const positionTitle = positionRows[0].Title;

    // Kiểm tra có nhân viên nào đang sử dụng chức vụ này không (chỉ kiểm tra nhân viên đang hoạt động)
    const [employeeRows] = await pool.execute(
      'SELECT userID FROM users WHERE position = ? AND status = "active"',
      [positionTitle]
    );

    if (employeeRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa chức vụ đang có nhân viên hoạt động sử dụng'
      });
    }

    await pool.execute('DELETE FROM positions WHERE ID = ?', [id]);

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
  getEmployeesByPosition,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition
};