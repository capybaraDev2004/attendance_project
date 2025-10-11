// backend/routes/face.routes.js
const express = require('express');
const { enrollFace, getEnrollments, faceAttendance, faceAttendanceCurrent, getCheckinHistory, updateEnrollment, deleteEnrollment, toggleEnrollment } = require('../controllers/face.controller');

const router = express.Router();

// Lưu vector 128 chiều vào MongoDB
router.post('/enroll', enrollFace);

// Lấy danh sách đăng ký khuôn mặt
router.get('/enrollments', getEnrollments);

// Cập nhật template (sửa tên/descriptor/trạng thái)
router.put('/enroll/:userID', updateEnrollment);

// Xóa template theo userID
router.delete('/enroll/:userID', deleteEnrollment);

// Bật/tắt template theo userID
router.patch('/enroll/:userID/toggle', toggleEnrollment);

// Chấm công bằng khuôn mặt (so khớp toàn bộ - tuỳ chọn)
router.post('/attendance', faceAttendance);

// Chấm công bằng khuôn mặt (chỉ so khớp người đăng nhập hiện tại)
router.post('/attendance/current', faceAttendanceCurrent);

// Lấy lịch sử check-in
router.get('/checkin/history', getCheckinHistory);

module.exports = router;
