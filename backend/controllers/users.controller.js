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
        rfid_uid,
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

    const [rows] = await pool.execute(
      'SELECT userID, fullName, role, status FROM users WHERE rfid_uid = ? LIMIT 1',
      [uid]
    );

    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

// Test endpoint để kiểm tra dữ liệu rfid_uid
async function testRfidData(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        userID, 
        fullName, 
        rfid_uid,
        position
      FROM users 
      ORDER BY userID ASC
    `);

    // Debug: Log từng user
    console.log('=== DEBUG RFID DATA ===');
    rows.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        userID: user.userID,
        fullName: user.fullName,
        rfid_uid: user.rfid_uid,
        rfid_uid_type: typeof user.rfid_uid,
        rfid_uid_is_null: user.rfid_uid === null,
        rfid_uid_is_undefined: user.rfid_uid === undefined
      });
    });

    const usersWithoutCard = rows.filter(user =>
      !user.rfid_uid || user.rfid_uid === null || user.rfid_uid === '' || user.rfid_uid === 'NULL'
    );

    const usersWithCard = rows.filter(user =>
      user.rfid_uid && user.rfid_uid !== null && user.rfid_uid !== '' && user.rfid_uid !== 'NULL'
    );

    console.log('Users without card:', usersWithoutCard.length);
    console.log('Users with card:', usersWithCard.length);

    return res.json({
      success: true,
      users: rows,
      count: rows.length,
      debug: {
        usersWithoutCard: usersWithoutCard,
        usersWithCard: usersWithCard,
        summary: {
          total: rows.length,
          withoutCard: usersWithoutCard.length,
          withCard: usersWithCard.length
        }
      }
    });
  } catch (err) {
    console.error('Error in testRfidData:', err);
    next(err);
  }
}

// Endpoint đơn giản để test dữ liệu
async function debugUsers(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT userID, fullName, rfid_uid, position 
      FROM users 
      ORDER BY userID ASC
    `);

    console.log('=== BACKEND DEBUG ===');
    console.log('Total users:', rows.length);

    rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} - rfid_uid: ${user.rfid_uid} (${typeof user.rfid_uid})`);
    });

    const withoutCard = rows.filter(u => !u.rfid_uid || u.rfid_uid === null);
    const withCard = rows.filter(u => u.rfid_uid && u.rfid_uid !== null);

    console.log('Users without card:', withoutCard.length);
    console.log('Users with card:', withCard.length);

    res.json({
      success: true,
      total: rows.length,
      withoutCard: withoutCard.length,
      withCard: withCard.length,
      users: rows
    });
  } catch (err) {
    console.error('Debug error:', err);
    next(err);
  }
}

module.exports = { getUsers, getByUID, testRfidData, debugUsers };