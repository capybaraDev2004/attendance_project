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
// Lấy theo UID RFID
async function getByUID(req, res) {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: 'uid required' });

    const [rows] = await pool.execute('SELECT * FROM users WHERE uid = ?', [uid]);

    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

// Thêm người dùng mới (chỉ có thông tin cá nhân, chưa có tài khoản)
async function createUser(req, res, next) {
  try {
    const { 
      fullName, 
      email, 
      phone, 
      dateOfBirth, 
      gender, 
      address, 
      position, 
      role = 'employee',
      status = 'active'
    } = req.body;

    // Validation
    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên và email là bắt buộc'
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const [existingEmail] = await pool.execute(
      'SELECT userID FROM users WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Kiểm tra phone đã tồn tại chưa (nếu có)
    if (phone) {
      const [existingPhone] = await pool.execute(
        'SELECT userID FROM users WHERE phone = ?',
        [phone]
      );

      if (existingPhone.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng'
        });
      }
    }

    // Tạo user mới
    const [result] = await pool.execute(`
      INSERT INTO users (
        fullName, email, phone, dateOfBirth, gender, 
        address, position, role, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      fullName, email, phone || null, dateOfBirth || null, gender || null,
      address || null, position || null, role, status
    ]);

    return res.json({
      success: true,
      message: 'Thêm người dùng thành công',
      userID: result.insertId
    });
  } catch (err) {
    next(err);
  }
}

// Cập nhật thông tin người dùng
async function updateUser(req, res, next) {
  try {
    const { userID } = req.params;
    const { 
      fullName, 
      email, 
      phone, 
      dateOfBirth, 
      gender, 
      address, 
      position, 
      role,
      status
    } = req.body;

    // Validation
    if (!userID) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu userID'
      });
    }

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên và email là bắt buộc'
      });
    }

    // Kiểm tra user có tồn tại không
    const [existingUser] = await pool.execute(
      'SELECT userID FROM users WHERE userID = ?',
      [userID]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra email đã tồn tại chưa (trừ user hiện tại)
    const [existingEmail] = await pool.execute(
      'SELECT userID FROM users WHERE email = ? AND userID != ?',
      [email, userID]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Kiểm tra phone đã tồn tại chưa (nếu có)
    if (phone) {
      const [existingPhone] = await pool.execute(
        'SELECT userID FROM users WHERE phone = ? AND userID != ?',
        [phone, userID]
      );

      if (existingPhone.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng'
        });
      }
    }

    // Cập nhật user
    await pool.execute(`
      UPDATE users SET 
        fullName = ?, email = ?, phone = ?, dateOfBirth = ?, 
        gender = ?, address = ?, position = ?, role = ?, 
        status = ?, updated_at = NOW()
      WHERE userID = ?
    `, [
      fullName, email, phone || null, dateOfBirth || null, 
      gender || null, address || null, position || null, 
      role, status, userID
    ]);

    return res.json({
      success: true,
      message: 'Cập nhật người dùng thành công'
    });
  } catch (err) {
    next(err);
  }
}

// Xóa người dùng
async function deleteUser(req, res, next) {
  try {
    const { userID } = req.params;

    if (!userID) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu userID'
      });
    }

    // Kiểm tra user có tồn tại không
    const [existingUser] = await pool.execute(
      'SELECT userID, role FROM users WHERE userID = ?',
      [userID]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Không cho phép xóa admin
    if (existingUser[0].role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản quản trị viên'
      });
    }

    // Xóa user
    await pool.execute('DELETE FROM users WHERE userID = ?', [userID]);

    return res.json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (err) {
    next(err);
  }
}

// Tạo tài khoản cho người dùng (username/password)
async function createAccount(req, res, next) {
  try {
    const { userID } = req.params;
    const { username, password } = req.body;

    if (!userID || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin userID, username hoặc password'
      });
    }

    // Kiểm tra user có tồn tại không
    const [existingUser] = await pool.execute(
      'SELECT userID, userName FROM users WHERE userID = ?',
      [userID]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra đã có tài khoản chưa
    if (existingUser[0].userName) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng đã có tài khoản'
      });
    }

    // Kiểm tra username đã tồn tại chưa
    const [existingUsername] = await pool.execute(
      'SELECT userID FROM users WHERE userName = ?',
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập đã được sử dụng'
      });
    }

    // Tạo tài khoản
    await pool.execute(
      'UPDATE users SET userName = ?, password = ?, updated_at = NOW() WHERE userID = ?',
      [username, password, userID]
    );

    return res.json({
      success: true,
      message: 'Tạo tài khoản thành công'
    });
  } catch (err) {
    next(err);
  }
}

// Cấp lại mật khẩu
async function resetPassword(req, res, next) {
  try {
    const { userID } = req.params;
    const { password } = req.body;

    if (!userID || !password) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin userID hoặc password'
      });
    }

    // Kiểm tra user có tồn tại không
    const [existingUser] = await pool.execute(
      'SELECT userID, userName FROM users WHERE userID = ?',
      [userID]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra đã có tài khoản chưa
    if (!existingUser[0].userName) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng chưa có tài khoản'
      });
    }

    // Cập nhật mật khẩu
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE userID = ?',
      [password, userID]
    );

    return res.json({
      success: true,
      message: 'Cấp lại mật khẩu thành công'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  createAccount, 
  resetPassword,
  getByUID };

