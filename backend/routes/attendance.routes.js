// backend/routes/attendance.routes.js
const express = require('express');
const { checkIn, checkOut, history, userHistory, recordsByMonth } = require('../controllers/attendance.controller');

const router = express.Router();

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/history', history);
router.get('/user-history/:user_id', userHistory);
// Tổng hợp attendance_records theo tháng
router.get('/records', recordsByMonth);

module.exports = router;
