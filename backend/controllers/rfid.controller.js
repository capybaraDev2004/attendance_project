const { pool } = require('../config/database');

/**
 * Controller quản lý thẻ RFID
 * Tương tác trực tiếp với bảng rfid trong database
 */

// Lấy danh sách tất cả thẻ RFID
async function getAllRfidCards(req, res, next) {
  try {
    console.log('Đang thực hiện query lấy danh sách thẻ RFID...');
    
    const [rows] = await pool.execute(`
      SELECT 
        r.rfid_uid,
        r.userID,
        r.cardStatus,
        u.fullName,
        u.position
      FROM rfid r
      LEFT JOIN users u ON r.userID = u.userID
      ORDER BY r.rfid_uid ASC
    `);

    console.log('Kết quả query từ database:', rows);

    // Chuyển đổi dữ liệu để phù hợp với frontend
    const rfidCards = rows.map(row => ({
      id: row.rfid_uid,
      cardCode: row.rfid_uid,
      status: row.cardStatus,
      isAssigned: row.userID !== null,
      assignedTo: row.fullName || null,
      assignedToId: row.userID || null,
      position: row.position || null,
      createdAt: new Date().toISOString().split('T')[0]
    }));

    console.log('Dữ liệu đã chuyển đổi:', rfidCards);

    // Đảm bảo luôn trả về array, không phải undefined
    const finalData = Array.isArray(rfidCards) ? rfidCards : [];

    res.json({
      success: true,
      data: finalData,
      message: 'Lấy danh sách thẻ RFID thành công',
      count: finalData.length
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách thẻ RFID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách thẻ RFID',
      error: error.message
    });
  }
}

// Lấy danh sách nhân viên chưa được gán thẻ
async function getAvailableUsers(req, res, next) {
  try {
    console.log('Đang thực hiện query lấy danh sách nhân viên chưa gán thẻ...');
    
    const [rows] = await pool.execute(`
      SELECT 
        u.userID,
        u.fullName,
        u.position
      FROM users u
      LEFT JOIN rfid r ON u.userID = r.userID
      WHERE r.userID IS NULL
      ORDER BY u.fullName ASC
    `);

    console.log('Kết quả query nhân viên từ database:', rows);

    const availableUsers = rows.map(row => ({
      id: row.userID,
      name: row.fullName,
      position: row.position
    }));

    console.log('Dữ liệu nhân viên đã chuyển đổi:', availableUsers);

    // Đảm bảo luôn trả về array, không phải undefined
    const finalUsersData = Array.isArray(availableUsers) ? availableUsers : [];

    res.json({
      success: true,
      data: finalUsersData,
      message: 'Lấy danh sách nhân viên chưa gán thẻ thành công',
      count: finalUsersData.length
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách nhân viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách nhân viên',
      error: error.message
    });
  }
}

// Thêm thẻ RFID mới
async function addRfidCard(req, res, next) {
  try {
    const { cardCode, status } = req.body;

    // Kiểm tra thẻ đã tồn tại chưa
    const [existingCard] = await pool.execute(
      'SELECT rfid_uid FROM rfid WHERE rfid_uid = ?',
      [cardCode]
    );

    if (existingCard.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã thẻ đã tồn tại trong hệ thống'
      });
    }

    // Thêm thẻ mới
    await pool.execute(
      'INSERT INTO rfid (rfid_uid, cardStatus) VALUES (?, ?)',
      [cardCode, status || 'inactive']
    );

    res.json({
      success: true,
      message: 'Thêm thẻ RFID thành công'
    });
  } catch (error) {
    console.error('Lỗi thêm thẻ RFID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi thêm thẻ RFID',
      error: error.message
    });
  }
}

// Cập nhật thông tin thẻ RFID
async function updateRfidCard(req, res, next) {
  try {
    const { cardCode } = req.params;
    const { newCardCode, status } = req.body;

    // Kiểm tra thẻ có tồn tại không
    const [existingCard] = await pool.execute(
      'SELECT rfid_uid FROM rfid WHERE rfid_uid = ?',
      [cardCode]
    );

    if (existingCard.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thẻ RFID'
      });
    }

    // Kiểm tra mã thẻ mới có trùng không (nếu có thay đổi)
    if (newCardCode && newCardCode !== cardCode) {
      const [duplicateCard] = await pool.execute(
        'SELECT rfid_uid FROM rfid WHERE rfid_uid = ?',
        [newCardCode]
      );

      if (duplicateCard.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã thẻ mới đã tồn tại trong hệ thống'
        });
      }
    }

    // Cập nhật thông tin thẻ
    const updateFields = [];
    const updateValues = [];

    if (newCardCode && newCardCode !== cardCode) {
      updateFields.push('rfid_uid = ?');
      updateValues.push(newCardCode);
    }

    if (status) {
      updateFields.push('cardStatus = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có thông tin nào để cập nhật'
      });
    }

    updateValues.push(cardCode);

    await pool.execute(
      `UPDATE rfid SET ${updateFields.join(', ')} WHERE rfid_uid = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Cập nhật thẻ RFID thành công'
    });
  } catch (error) {
    console.error('Lỗi cập nhật thẻ RFID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thẻ RFID',
      error: error.message
    });
  }
}

// Xóa thẻ RFID
async function deleteRfidCard(req, res, next) {
  try {
    const { cardCode } = req.params;

    // Kiểm tra thẻ có tồn tại không
    const [existingCard] = await pool.execute(
      'SELECT rfid_uid FROM rfid WHERE rfid_uid = ?',
      [cardCode]
    );

    if (existingCard.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thẻ RFID'
      });
    }

    // Xóa thẻ
    await pool.execute(
      'DELETE FROM rfid WHERE rfid_uid = ?',
      [cardCode]
    );

    res.json({
      success: true,
      message: 'Xóa thẻ RFID thành công'
    });
  } catch (error) {
    console.error('Lỗi xóa thẻ RFID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa thẻ RFID',
      error: error.message
    });
  }
}

// Gán thẻ cho nhân viên
async function assignCardToUser(req, res, next) {
  try {
    const { cardCode } = req.params;
    const { userId } = req.body;

    // Kiểm tra thẻ có tồn tại không
    const [existingCard] = await pool.execute(
      'SELECT rfid_uid, userID FROM rfid WHERE rfid_uid = ?',
      [cardCode]
    );

    if (existingCard.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thẻ RFID'
      });
    }

    // Kiểm tra nhân viên có tồn tại không
    const [existingUser] = await pool.execute(
      'SELECT userID FROM users WHERE userID = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhân viên'
      });
    }

    // Kiểm tra nhân viên đã được gán thẻ chưa
    const [assignedCard] = await pool.execute(
      'SELECT rfid_uid FROM rfid WHERE userID = ?',
      [userId]
    );

    if (assignedCard.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nhân viên này đã được gán thẻ RFID khác'
      });
    }

    // Gán thẻ cho nhân viên
    await pool.execute(
      'UPDATE rfid SET userID = ? WHERE rfid_uid = ?',
      [userId, cardCode]
    );

    res.json({
      success: true,
      message: 'Gán thẻ RFID cho nhân viên thành công'
    });
  } catch (error) {
    console.error('Lỗi gán thẻ RFID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi gán thẻ RFID',
      error: error.message
    });
  }
}

// Hủy gán thẻ (set userID = NULL)
async function unassignCard(req, res, next) {
  try {
    const { cardCode } = req.params;

    // Kiểm tra thẻ có tồn tại không
    const [existingCard] = await pool.execute(
      'SELECT rfid_uid FROM rfid WHERE rfid_uid = ?',
      [cardCode]
    );

    if (existingCard.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thẻ RFID'
      });
    }

    // Hủy gán thẻ
    await pool.execute(
      'UPDATE rfid SET userID = NULL WHERE rfid_uid = ?',
      [cardCode]
    );

    res.json({
      success: true,
      message: 'Hủy gán thẻ RFID thành công'
    });
  } catch (error) {
    console.error('Lỗi hủy gán thẻ RFID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hủy gán thẻ RFID',
      error: error.message
    });
  }
}

module.exports = {
  getAllRfidCards,
  getAvailableUsers,
  addRfidCard,
  updateRfidCard,
  deleteRfidCard,
  assignCardToUser,
  unassignCard
};
