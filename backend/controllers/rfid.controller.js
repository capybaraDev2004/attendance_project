// const { pool } = require('../config/database');

// /**
//  * Controller quản lý thẻ RFID
//  * Tương tác trực tiếp với bảng rfid trong database
//  */

// // Lấy danh sách tất cả thẻ RFID
// async function getAllRfidCards(req, res, next) {
//   try {
//     console.log('Đang thực hiện query lấy danh sách thẻ RFID...');

//     const [rows] = await pool.execute(`
//       SELECT 
//         r.rfid_uid,
//         r.userID,
//         r.cardStatus,
//         u.fullName,
//         u.position
//       FROM rfid r
//       LEFT JOIN users u ON r.userID = u.userID
//       ORDER BY r.rfid_uid ASC
//     `);

//     console.log('Kết quả query từ database:', rows);

//     // Chuyển đổi dữ liệu để phù hợp với frontend
//     const rfidCards = rows.map(row => ({
//       id: row.rfid_uid,
//       cardCode: row.rfid_uid,
//       status: row.cardStatus,
//       isAssigned: row.userID !== null,
//       assignedTo: row.fullName || null,
//       assignedToId: row.userID || null,
//       position: row.position || null,
//       createdAt: new Date().toISOString().split('T')[0]
//     }));

//     console.log('Dữ liệu đã chuyển đổi:', rfidCards);

//     // Đảm bảo luôn trả về array, không phải undefined
//     const finalData = Array.isArray(rfidCards) ? rfidCards : [];

//     res.json({
//       success: true,
//       data: finalData,
//       message: 'Lấy danh sách thẻ RFID thành công',
//       count: finalData.length
//     });
//   } catch (error) {
//     console.error('Lỗi lấy danh sách thẻ RFID:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Lỗi lấy danh sách thẻ RFID',
//       error: error.message
//     });
//   }
// }

// // Lấy danh sách nhân viên chưa được gán thẻ
// async function getAvailableUsers(req, res, next) {
//   try {
//     console.log('Đang thực hiện query lấy danh sách nhân viên chưa gán thẻ...');

//     const [rows] = await pool.execute(`
//       SELECT 
//         u.userID,
//         u.fullName,
//         u.position
//       FROM users u
//       LEFT JOIN rfid r ON u.userID = r.userID
//       WHERE r.userID IS NULL
//       ORDER BY u.fullName ASC
//     `);

//     console.log('Kết quả query nhân viên từ database:', rows);

//     const availableUsers = rows.map(row => ({
//       id: row.userID,
//       name: row.fullName,
//       position: row.position
//     }));

//     console.log('Dữ liệu nhân viên đã chuyển đổi:', availableUsers);

//     // Đảm bảo luôn trả về array, không phải undefined
//     const finalUsersData = Array.isArray(availableUsers) ? availableUsers : [];

//     res.json({
//       success: true,
//       data: finalUsersData,
//       message: 'Lấy danh sách nhân viên chưa gán thẻ thành công',
//       count: finalUsersData.length
//     });
//   } catch (error) {
//     console.error('Lỗi lấy danh sách nhân viên:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Lỗi lấy danh sách nhân viên',
//       error: error.message
//     });
//   }
// }

// // Thêm thẻ RFID mới
// async function addRfidCard(req, res, next) {
//   try {
//     const { cardCode, status } = req.body;

//     // Kiểm tra thẻ đã tồn tại chưa
//     const [existingCard] = await pool.execute(
//       'SELECT rfid_uid FROM rfid WHERE rfid_uid = ?',
//       [cardCode]
//     );

//     if (existingCard.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Mã thẻ đã tồn tại trong hệ thống'
//       });
//     }

//     // Thêm thẻ mới
//     await pool.execute(
//       'INSERT INTO rfid (rfid_uid, cardStatus) VALUES (?, ?)',
//       [cardCode, status || 'inactive']
//     );

//     res.json({
//       success: true,
//       message: 'Thêm thẻ RFID thành công'
//     });
//   } catch (error) {
//     console.error('Lỗi thêm thẻ RFID:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Lỗi thêm thẻ RFID',
//       error: error.message
//     });
//   }
// }

// // Cập nhật thông tin thẻ RFID
// async function updateRfidCard(req, res, next) {
//   try {
//     const { cardCode } = req.params;
//     const { newCardCode, status } = req.body;

//     // Kiểm tra thẻ có tồn tại không
//     const [existingCard] = await pool.execute(
//       'SELECT rfid_uid FROM rfid WHERE rfid_uid = ?',
//       [cardCode]
//     );

//     if (existingCard.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Không tìm thấy thẻ RFID'
//       });
//     }

//     // Kiểm tra mã thẻ mới có trùng không (nếu có thay đổi)
//     if (newCardCode && newCardCode !== cardCode) {
//       const [duplicateCard] = await pool.execute(
//         'SELECT rfid_uid FROM rfid WHERE rfid_uid = ?',
//         [newCardCode]
//       );

//       if (duplicateCard.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'Mã thẻ mới đã tồn tại trong hệ thống'
//         });
//       }
//     }

//     // Cập nhật thông tin thẻ
//     const updateFields = [];
//     const updateValues = [];

//     if (newCardCode && newCardCode !== cardCode) {
//       updateFields.push('rfid_uid = ?');
//       updateValues.push(newCardCode);
//     }

//     if (status) {
//       updateFields.push('cardStatus = ?');
//       updateValues.push(status);
//     }

//     if (updateFields.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Không có thông tin nào để cập nhật'
//       });
//     }

//     updateValues.push(cardCode);

//     await pool.execute(
//       `UPDATE rfid SET ${updateFields.join(', ')} WHERE rfid_uid = ?`,
//       updateValues
//     );

//     res.json({
//       success: true,
//       message: 'Cập nhật thẻ RFID thành công'
//     });
//   } catch (error) {
//     console.error('Lỗi cập nhật thẻ RFID:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Lỗi cập nhật thẻ RFID',
//       error: error.message
//     });
//   }
// }

// // Xóa thẻ RFID
// async function deleteRfidCard(req, res, next) {
//   try {
//     const { cardCode } = req.params;

//     // Kiểm tra thẻ có tồn tại không
//     const [existingCard] = await pool.execute(
//       'SELECT rfid_uid FROM rfid WHERE rfid_uid = ?',
//       [cardCode]
//     );

//     if (existingCard.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Không tìm thấy thẻ RFID'
//       });
//     }

//     // Xóa thẻ
//     await pool.execute(
//       'DELETE FROM rfid WHERE rfid_uid = ?',
//       [cardCode]
//     );

//     res.json({
//       success: true,
//       message: 'Xóa thẻ RFID thành công'
//     });
//   } catch (error) {
//     console.error('Lỗi xóa thẻ RFID:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Lỗi xóa thẻ RFID',
//       error: error.message
//     });
//   }
// }

// // Gán thẻ cho nhân viên
// async function assignCardToUser(req, res, next) {
//   try {
//     const { cardCode } = req.params;
//     const { userId } = req.body;

//     // Kiểm tra thẻ có tồn tại không
//     const [existingCard] = await pool.execute(
//       'SELECT rfid_uid, userID FROM rfid WHERE rfid_uid = ?',
//       [cardCode]
//     );

//     if (existingCard.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Không tìm thấy thẻ RFID'
//       });
//     }

//     // Kiểm tra nhân viên có tồn tại không
//     const [existingUser] = await pool.execute(
//       'SELECT userID FROM users WHERE userID = ?',
//       [userId]
//     );

//     if (existingUser.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Không tìm thấy nhân viên'
//       });
//     }

//     // Kiểm tra nhân viên đã được gán thẻ chưa
//     const [assignedCard] = await pool.execute(
//       'SELECT rfid_uid FROM rfid WHERE userID = ?',
//       [userId]
//     );

//     if (assignedCard.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Nhân viên này đã được gán thẻ RFID khác'
//       });
//     }

//     // Gán thẻ cho nhân viên
//     await pool.execute(
//       'UPDATE rfid SET userID = ? WHERE rfid_uid = ?',
//       [userId, cardCode]
//     );

//     res.json({
//       success: true,
//       message: 'Gán thẻ RFID cho nhân viên thành công'
//     });
//   } catch (error) {
//     console.error('Lỗi gán thẻ RFID:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Lỗi gán thẻ RFID',
//       error: error.message
//     });
//   }
// }

// // Hủy gán thẻ (set userID = NULL)
// async function unassignCard(req, res, next) {
//   try {
//     const { cardCode } = req.params;

//     // Kiểm tra thẻ có tồn tại không
//     const [existingCard] = await pool.execute(
//       'SELECT rfid_uid FROM rfid WHERE rfid_uid = ?',
//       [cardCode]
//     );

//     if (existingCard.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Không tìm thấy thẻ RFID'
//       });
//     }

//     // Hủy gán thẻ
//     await pool.execute(
//       'UPDATE rfid SET userID = NULL WHERE rfid_uid = ?',
//       [cardCode]
//     );

//     res.json({
//       success: true,
//       message: 'Hủy gán thẻ RFID thành công'
//     });
//   } catch (error) {
//     console.error('Lỗi hủy gán thẻ RFID:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Lỗi hủy gán thẻ RFID',
//       error: error.message
//     });
//   }
// }
// async function listUnassigned(req, res, next) {
//   try {
//     const [rows] = await pool.execute(
//       `SELECT rfid_uid AS cardCode, cardStatus AS status
//        FROM rfid
//        WHERE userID IS NULL OR userID = 0`
//     );
//     res.json({ success: true, count: rows.length, data: rows });
//   } catch (e) { next(e); }
// }

// module.exports = {
//   getAllRfidCards,
//   getAvailableUsers,
//   addRfidCard,
//   updateRfidCard,
//   deleteRfidCard,
//   assignCardToUser,
//   unassignCard,
//   listUnassigned
// };
const { pool } = require('../config/database');

/**
 * Controller quản lý thẻ RFID (bảng rfid)
 * Có emit socket để FE tự refresh.
 */

// Lấy danh sách tất cả thẻ RFID
async function getAllRfidCards(req, res, next) {
  try {
    const TODAY_SQL = "DATE(CONVERT_TZ(NOW(), @@session.time_zone, '+07:00'))";

    const [rows] = await pool.execute(`
      SELECT 
        r.rfid_uid,
        r.userID,
        r.cardStatus,
        u.fullName,
        u.position,
        -- có ca mở hôm nay? (đã vào, chưa ra)
        EXISTS(
          SELECT 1 FROM attendance a
          WHERE a.user_id = r.userID
            AND a.work_date = ${TODAY_SQL}
            AND a.check_in IS NOT NULL
            AND a.check_out IS NULL
        ) AS hasOpenAttendance
      FROM rfid r
      LEFT JOIN users u ON r.userID = u.userID
      ORDER BY r.rfid_uid ASC
    `);

    const rfidCards = rows.map(row => ({
      id: row.rfid_uid,
      cardCode: row.rfid_uid,
      status: row.cardStatus,
      isAssigned: row.userID !== null,
      assignedTo: row.fullName || null,
      assignedToId: row.userID || null,
      position: row.position || null,
      hasOpenAttendance: !!row.hasOpenAttendance, // NEW
      createdAt: new Date().toISOString().split('T')[0]
    }));

    res.json({ success: true, data: rfidCards, message: 'Lấy danh sách thẻ RFID thành công', count: rfidCards.length });
  } catch (error) {
    console.error('Lỗi lấy danh sách thẻ RFID:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách thẻ RFID', error: error.message });
  }
}

// Lấy danh sách nhân viên CHƯA được gán thẻ (chỉ lấy active)
async function getAvailableUsers(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        u.userID,
        u.fullName,
        u.position
      FROM users u
      LEFT JOIN rfid r ON u.userID = r.userID
      WHERE r.userID IS NULL AND u.status = 'active'
      ORDER BY u.fullName ASC
    `);

    const availableUsers = rows.map(row => ({
      id: row.userID,
      name: row.fullName,
      position: row.position
    }));

    res.json({
      success: true,
      data: Array.isArray(availableUsers) ? availableUsers : [],
      message: 'Lấy danh sách nhân viên chưa gán thẻ thành công',
      count: availableUsers.length
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách nhân viên:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách nhân viên', error: error.message });
  }
}

// Thêm thẻ RFID mới (từ dropdown UID chưa gán hoặc nhập tay)
// - Nếu UID đã tồn tại và đang CHƯA gán -> chỉ cập nhật cardStatus (không báo lỗi)
// - Nếu UID đã tồn tại và ĐÃ gán -> báo trùng
async function addRfidCard(req, res, next) {
  try {
    const { cardCode, status } = req.body;
    const cardStatus = status || 'inactive';
    const io = req.app.get('io');

    if (!cardCode) {
      return res.status(400).json({ success: false, message: 'Thiếu cardCode' });
    }

    const [existing] = await pool.execute(
      'SELECT rfid_uid, userID, cardStatus FROM rfid WHERE rfid_uid = ?',
      [cardCode]
    );

    if (existing.length > 0) {
      const row = existing[0];
      if (row.userID == null) {
        // Đã có trong bảng rfid nhưng chưa gán -> cập nhật trạng thái
        await pool.execute('UPDATE rfid SET cardStatus = ? WHERE rfid_uid = ?', [cardStatus, cardCode]);

        if (io) io.emit('rfid:refresh', { reason: 'rfid_status_updated', cardCode });
        return res.json({ success: true, message: 'Cập nhật trạng thái thẻ chưa gán thành công' });
      }
      // Đã gán cho user khác -> báo lỗi
      return res.status(400).json({ success: false, message: 'Mã thẻ đã tồn tại và đã được gán' });
    }

    // Chưa tồn tại -> tạo mới (chưa gán)
    await pool.execute('INSERT INTO rfid (rfid_uid, cardStatus) VALUES (?, ?)', [cardCode, cardStatus]);

    if (io) io.emit('rfid:refresh', { reason: 'rfid_added', cardCode });

    res.json({ success: true, message: 'Thêm thẻ RFID thành công' });
  } catch (error) {
    console.error('Lỗi thêm thẻ RFID:', error);
    res.status(500).json({ success: false, message: 'Lỗi thêm thẻ RFID', error: error.message });
  }
}

// Cập nhật thông tin thẻ RFID (đổi UID, đổi status)
async function updateRfidCard(req, res, next) {
  try {
    const { cardCode } = req.params;
    const { newCardCode, status } = req.body;
    const io = req.app.get('io');

    const [existingCard] = await pool.execute(
      'SELECT rfid_uid FROM rfid WHERE rfid_uid = ?',
      [cardCode]
    );
    if (existingCard.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ RFID' });
    }

    const updateFields = [];
    const updateValues = [];

    if (newCardCode && newCardCode !== cardCode) {
      // check trùng
      const [dup] = await pool.execute('SELECT rfid_uid FROM rfid WHERE rfid_uid = ?', [newCardCode]);
      if (dup.length > 0) {
        return res.status(400).json({ success: false, message: 'Mã thẻ mới đã tồn tại' });
      }
      updateFields.push('rfid_uid = ?');
      updateValues.push(newCardCode);
    }

    if (status) {
      updateFields.push('cardStatus = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có thông tin nào để cập nhật' });
    }

    updateValues.push(cardCode);
    await pool.execute(`UPDATE rfid SET ${updateFields.join(', ')} WHERE rfid_uid = ?`, updateValues);

    if (io) io.emit('rfid:refresh', { reason: 'rfid_updated', cardCode: newCardCode || cardCode });

    res.json({ success: true, message: 'Cập nhật thẻ RFID thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật thẻ RFID:', error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật thẻ RFID', error: error.message });
  }
}

// Xóa thẻ RFID
// async function deleteRfidCard(req, res, next) {
//   try {
//     const { cardCode } = req.params;
//     const io = req.app.get('io');

//     const [existingCard] = await pool.execute('SELECT rfid_uid FROM rfid WHERE rfid_uid = ?', [cardCode]);
//     if (existingCard.length === 0) {
//       return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ RFID' });
//     }

//     await pool.execute('DELETE FROM rfid WHERE rfid_uid = ?', [cardCode]);

//     if (io) io.emit('rfid:refresh', { reason: 'rfid_deleted', cardCode });

//     res.json({ success: true, message: 'Xóa thẻ RFID thành công' });
//   } catch (error) {
//     console.error('Lỗi xóa thẻ RFID:', error);
//     res.status(500).json({ success: false, message: 'Lỗi xóa thẻ RFID', error: error.message });
//   }
// }
// Xóa thẻ RFID (chặn nếu đang gán / đang chấm công)
async function deleteRfidCard(req, res, next) {
  try {
    const { cardCode } = req.params;

    const TODAY_SQL = "DATE(CONVERT_TZ(NOW(), @@session.time_zone, '+07:00'))";

    // Lấy thông tin thẻ + kiểm tra có ca mở hôm nay không
    const [rows] = await pool.execute(
      `SELECT 
         r.rfid_uid, r.userID, u.fullName,
         EXISTS(
           SELECT 1 FROM attendance a
           WHERE a.user_id = r.userID
             AND a.work_date = ${TODAY_SQL}
             AND a.check_in IS NOT NULL
             AND a.check_out IS NULL
         ) AS hasOpenAttendance
       FROM rfid r
       LEFT JOIN users u ON u.userID = r.userID
       WHERE r.rfid_uid = ?
       LIMIT 1`,
      [cardCode]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ RFID' });
    }

    const card = rows[0];

    // CHỈ chặn xóa nếu thẻ đang được dùng để chấm công (chưa check-out)
    if (card.hasOpenAttendance) {
      return res.status(409).json({
        success: false,
        message: `Không thể xóa: thẻ đang được ${card.fullName || 'nhân viên'} dùng để chấm công (chưa check-out).`
      });
    }

    // Cho phép xóa trong các trường hợp còn lại (kể cả đã gán nhưng không có ca mở)
    await pool.execute(`DELETE FROM rfid WHERE rfid_uid = ?`, [cardCode]);

    // Phát realtime để FE tự refresh
    const io = req.app.get('io');
    if (io) io.emit('rfid:refresh', { reason: 'rfid_deleted', cardCode });

    return res.json({ success: true, message: 'Xóa thẻ RFID thành công' });
  } catch (error) {
    console.error('Lỗi xóa thẻ RFID:', error);
    res.status(500).json({ success: false, message: 'Lỗi xóa thẻ RFID', error: error.message });
  }
}


// Gán thẻ cho nhân viên
async function assignCardToUser(req, res, next) {
  try {
    const { cardCode } = req.params;
    const { userId } = req.body;

    // Thẻ có tồn tại?
    const [cardRows] = await pool.execute(
      `SELECT r.rfid_uid, r.userID, r.cardStatus, u.fullName
       FROM rfid r
       LEFT JOIN users u ON u.userID = r.userID
       WHERE r.rfid_uid = ? LIMIT 1`,
      [cardCode]
    );
    if (cardRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ RFID' });
    }
    const card = cardRows[0];

    // User có tồn tại?
    const [userRows] = await pool.execute(
      'SELECT userID, fullName FROM users WHERE userID = ? AND status = "active" LIMIT 1',
      [userId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
    }
    const targetUser = userRows[0];

    // Target user đã có thẻ khác?
    const [dupUserCard] = await pool.execute(
      'SELECT rfid_uid FROM rfid WHERE userID = ? LIMIT 1',
      [userId]
    );
    if (dupUserCard.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Nhân viên này đã có thẻ RFID khác. Vui lòng hủy gán thẻ cũ trước.'
      });
    }

    // Thẻ đang gán cho người khác?
    if (card.userID && Number(card.userID) !== Number(userId)) {
      // Nếu người đang giữ thẻ có ca mở hôm nay -> cấm gán
      const TODAY_SQL = "DATE(CONVERT_TZ(NOW(), @@session.time_zone, '+07:00'))";
      const [att] = await pool.execute(
        `SELECT attendance_id FROM attendance
         WHERE user_id = ?
           AND work_date = ${TODAY_SQL}
           AND check_in IS NOT NULL
           AND check_out IS NULL
         LIMIT 1`,
        [card.userID]
      );
      if (att.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Thẻ đang được dùng để chấm công (chưa check-out) bởi ${card.fullName || 'người khác'}. Hãy yêu cầu check-out hoặc hủy gán trước.`
        });
      }

      // Dù không còn ca mở vẫn yêu cầu unassign trước khi gán cho người khác (an toàn dữ liệu)
      return res.status(409).json({
        success: false,
        message: `Thẻ đang được gán cho ${card.fullName || 'người khác'}. Vui lòng hủy gán trước khi gán cho nhân viên mới.`
      });
    }

    // Gán (kể cả trường hợp card.userID null)
    await pool.execute(
      'UPDATE rfid SET userID = ? WHERE rfid_uid = ?',
      [userId, cardCode]
    );

    // Báo realtime để FE refresh
    const io = req.app.get('io');
    if (io) io.emit('rfid:refresh', { reason: 'rfid_assigned', cardCode, userId });

    res.json({ success: true, message: `Đã gán thẻ cho ${targetUser.fullName}` });
  } catch (error) {
    console.error('Lỗi gán thẻ RFID:', error);
    res.status(500).json({ success: false, message: 'Lỗi gán thẻ RFID', error: error.message });
  }
}


// Hủy gán thẻ
async function unassignCard(req, res, next) {
  try {
    const { cardCode } = req.params;
    const io = req.app.get('io');

    const [exists] = await pool.execute('SELECT rfid_uid FROM rfid WHERE rfid_uid = ?', [cardCode]);
    if (exists.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ RFID' });
    }

    await pool.execute('UPDATE rfid SET userID = NULL WHERE rfid_uid = ?', [cardCode]);

    if (io) io.emit('rfid:refresh', { reason: 'rfid_unassigned', cardCode });

    res.json({ success: true, message: 'Hủy gán thẻ RFID thành công' });
  } catch (error) {
    console.error('Lỗi hủy gán thẻ RFID:', error);
    res.status(500).json({ success: false, message: 'Lỗi hủy gán thẻ RFID', error: error.message });
  }
}

// Danh sách thẻ CHƯA gán (cho dropdown ở FE)
async function listUnassigned(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT rfid_uid AS cardCode, cardStatus AS status
       FROM rfid
       WHERE userID IS NULL OR userID = 0
       ORDER BY rfid_uid ASC`
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (e) {
    console.error('Lỗi listUnassigned:', e);
    res.status(500).json({ success: false, message: 'Lỗi lấy thẻ chưa gán', error: e.message });
  }
}

module.exports = {
  getAllRfidCards,
  getAvailableUsers,
  addRfidCard,
  updateRfidCard,
  deleteRfidCard,
  assignCardToUser,
  unassignCard,
  listUnassigned
};
