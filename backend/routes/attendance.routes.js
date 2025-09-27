// backend/routes/attendance.routes.js
const express = require('express');
const { checkIn, checkOut, history, userHistory, recordsByMonth, getTodayCount } = require('../controllers/attendance.controller');

const router = express.Router();

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/history', history);
router.get('/user-history/:user_id', userHistory);
// Tổng hợp attendance_records theo tháng
router.get('/records', recordsByMonth);
// Đếm số lần chấm công hôm nay
router.get('/today-count', getTodayCount);

module.exports = router;
