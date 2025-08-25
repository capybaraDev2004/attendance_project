// backend/routes/face.routes.js
const express = require('express');
const { enrollFace, getEnrollments, faceAttendance } = require('../controllers/face.controller');

const router = express.Router();

// Lưu vector 128 chiều vào MongoDB
router.post('/enroll', enrollFace);

// Lấy danh sách đăng ký khuôn mặt
router.get('/enrollments', getEnrollments);

// Chấm công bằng khuôn mặt
router.post('/attendance', faceAttendance);

module.exports = router;
