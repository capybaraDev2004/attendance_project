const { pool } = require('../config/database');

// Lưu trữ trạng thái quét thẻ tạm thời (production nên dùng Redis)
const scanSessions = new Map();

// ===================== BẮT ĐẦU QUÉT =====================
async function startScan(req, res, next) {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID là bắt buộc' });
        }

        // Kiểm tra user
        const [userRows] = await pool.execute(
            'SELECT userID, fullName, rfid_uid FROM users WHERE userID = ?',
            [userId]
        );
        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
        }
        const user = userRows[0];

        // Đã có thẻ?
        if (user.rfid_uid) {
            return res.status(400).json({ success: false, message: 'Nhân viên này đã có thẻ RFID' });
        }

        // Tạo sessionId
        const sessionId = `scan_${userId}_${Date.now()}`;
        scanSessions.set(sessionId, {
            userId,
            status: 'scanning',
            startTime: new Date(),
            rfidUid: null,
            message: null,
        });

        console.log('=== SESSION CREATED ===', { sessionId, userId, total: scanSessions.size });

        // Gửi lệnh đến Arduino (không bắt buộc)
        try {
            await sendArduinoCommand('START_SCAN', { sessionId, userName: user.fullName });
        } catch (e) {
            console.log('Arduino không khả dụng, tiếp tục chế độ demo:', e.message);
        }

        return res.json({ success: true, message: 'Bắt đầu quét thẻ', sessionId });
    } catch (err) {
        next(err);
    }
}

// ===================== TRẠNG THÁI QUÉT (hỗ trợ sessionId & userId) =====================
async function getScanStatus(req, res, next) {
    try {
        // Ưu tiên /by-session/:sessionId; fallback /scan-status/:userId
        const { sessionId: sessionParam } = req.params;
        const fallbackParam = req.params.userId;

        let sid = sessionParam || fallbackParam || null;
        let session = null;

        // 1) Nếu param trùng key trong Map → xem là sessionId
        if (sid && scanSessions.has(sid)) {
            session = scanSessions.get(sid);
        } else if (sid && String(sid).startsWith('scan_') && !scanSessions.has(sid)) {
            // FE truyền sessionId nhưng đã hết hạn/xoá
            return res.status(404).json({
                success: false,
                status: 'not_found',
                message: 'Session không tồn tại hoặc đã hết hạn',
            });
        } else {
            // 2) Param là userId → lấy session MỚI NHẤT theo userId
            const userId = fallbackParam || null;
            if (userId) {
                let latest = null;
                let latestId = null;
                for (const [id, s] of scanSessions.entries()) {
                    if (String(s.userId) === String(userId)) {
                        if (!latest || new Date(s.startTime) > new Date(latest.startTime)) {
                            latest = s;
                            latestId = id;
                        }
                    }
                }
                if (latest) {
                    sid = latestId;
                    session = latest;
                }
            }
        }

        // 3) Không có session
        if (!session) {
            return res.status(404).json({
                success: false,
                status: 'not_found',
                message: 'Không tìm thấy session quét thẻ cho tham số đã cung cấp',
            });
        }

        // 4) Timeout 30s nếu đang scanning
        const elapsedSec = (Date.now() - new Date(session.startTime).getTime()) / 1000;
        if (session.status === 'scanning' && elapsedSec > 30) {
            session.status = 'timeout';
            session.message = 'Hết thời gian chờ quét thẻ';
            // Dọn session sau 15s để FE kịp nhận trạng thái cuối
            setTimeout(() => scanSessions.delete(sid), 15000);
        }

        return res.json({
            success: session.status === 'completed',
            status: session.status, // 'scanning' | 'completed' | 'error' | 'timeout'
            message: session.message || null,
            rfidUid: session.rfidUid || null,
            userId: session.userId,
            sessionId: sid,
            startedAt: session.startTime,
        });
    } catch (err) {
        console.error('Error in getScanStatus:', err);
        next(err);
    }
}

// ===================== THIẾT BỊ TRẢ KẾT QUẢ =====================
async function handleScanResult(req, res, next) {
    try {
        const { sessionId, rfidUid, success, message } = req.body;

        if (!sessionId || !rfidUid) {
            return res.status(400).json({
                success: false,
                message: 'Session ID và RFID UID là bắt buộc',
            });
        }

        const session = scanSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session không tồn tại' });
        }

        if (success) {
            // Thẻ đã gán cho ai chưa?
            const [existingCard] = await pool.execute(
                'SELECT userID, fullName FROM users WHERE rfid_uid = ?',
                [rfidUid]
            );
            if (existingCard.length > 0) {
                session.status = 'error';
                session.message = `Thẻ đã được sử dụng bởi ${existingCard[0].fullName}`;
                try {
                    await sendArduinoCommand('SCAN_ERROR', { message: 'Thẻ đã được sử dụng', beepCount: 3 });
                } catch { }
                return res.json({ success: false, message: session.message });
            }

            // Gán thẻ cho user
            await pool.execute('UPDATE users SET rfid_uid = ? WHERE userID = ?', [
                rfidUid,
                session.userId,
            ]);

            session.status = 'completed';
            session.rfidUid = rfidUid;
            session.message = 'Thêm thẻ thành công';

            try {
                await sendArduinoCommand('SCAN_SUCCESS', { message: 'Thêm thẻ thành công', beepCount: 1 });
            } catch { }

            // Dọn session sau 15s
            setTimeout(() => scanSessions.delete(sessionId), 15000);

            return res.json({ success: true, message: 'Thêm thẻ thành công', rfidUid });
        } else {
            session.status = 'error';
            session.message = message || 'Lỗi khi quét thẻ';
            try {
                await sendArduinoCommand('SCAN_ERROR', { message: session.message, beepCount: 3 });
            } catch { }
            // Dọn sau 15s
            setTimeout(() => scanSessions.delete(sessionId), 15000);

            return res.json({ success: false, message: session.message });
        }
    } catch (err) {
        next(err);
    }
}

// ===================== GỬI LỆNH ARDUINO =====================
async function sendArduinoCommand(command, data) {
    const axios = require('axios');
    try {
        const arduinoIP = '192.168.1.29';

        if (command === 'START_SCAN') {
            const r = await axios.post(`http://${arduinoIP}/start-add-card`, {
                sessionId: data.sessionId,
                userName: data.userName,
            }, { timeout: 5000 });

            const ok = r.status === 200 && r.data && r.data.success === true;
            console.log('Arduino start scan response:', r.status, r.data);
            return { success: ok, raw: r.data };
        }

        if (command === 'CANCEL_SCAN') {
            const r = await axios.post(`http://${arduinoIP}/cancel-add-card`, {}, { timeout: 5000 });
            const ok = r.status === 200 && r.data && r.data.success === true;
            console.log('Arduino cancel scan response:', r.status, r.data);
            return { success: ok, raw: r.data };
        }

        return { success: true };
    } catch (error) {
        console.error('Arduino communication error:',
            error.message,
            error.response?.status ? `status=${error.response.status}` : '',
            error.response?.data ? `resp=${JSON.stringify(error.response.data)}` : ''
        );
        return { success: false, message: 'Arduino không khả dụng' };
    }
}


// ===================== DANH SÁCH / XOÁ THẺ =====================
async function getCards(req, res, next) {
    try {
        const [rows] = await pool.execute(`
      SELECT userID, fullName, rfid_uid, position, status, created_at
      FROM users
      WHERE rfid_uid IS NOT NULL
      ORDER BY userID ASC
    `);
        return res.json({ success: true, cards: rows, count: rows.length });
    } catch (err) {
        next(err);
    }
}

async function deleteCard(req, res, next) {
    try {
        const { userId } = req.params;
        const [result] = await pool.execute(
            'UPDATE users SET rfid_uid = NULL WHERE userID = ?',
            [userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên hoặc nhân viên chưa có thẻ',
            });
        }
        return res.json({ success: true, message: 'Xóa thẻ thành công' });
    } catch (err) {
        next(err);
    }
}

// ===================== TEST =====================
async function testCards(req, res, next) {
    try {
        res.json({
            success: true,
            message: 'Cards API hoạt động bình thường',
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
}

// ===================== HỦY QUÉT =====================
async function cancelScan(req, res, next) {
    try {
        const { sessionId, userId } = req.body || {};

        // Ưu tiên theo sessionId
        if (sessionId && scanSessions.has(sessionId)) {
            scanSessions.delete(sessionId);
            try { await sendArduinoCommand('CANCEL_SCAN', {}); } catch { }
            return res.json({ success: true, message: 'Đã hủy quét thẻ theo sessionId' });
        }

        // Fallback theo userId → xoá phiên scanning mới nhất
        if (userId) {
            let targetId = null;
            let latest = null;
            for (const [sid, s] of scanSessions.entries()) {
                if (String(s.userId) === String(userId) && s.status === 'scanning') {
                    if (!latest || new Date(s.startTime) > new Date(latest.startTime)) {
                        latest = s;
                        targetId = sid;
                    }
                }
            }
            if (targetId) {
                scanSessions.delete(targetId);
                try { await sendArduinoCommand('CANCEL_SCAN', {}); } catch { }
                return res.json({ success: true, message: 'Đã hủy quét thẻ theo userId' });
            }
        }

        return res.status(404).json({ success: false, message: 'Không tìm thấy session để hủy' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    startScan,
    getScanStatus,
    handleScanResult,
    getCards,
    deleteCard,
    testCards,
    cancelScan,
};
