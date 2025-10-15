// backend/routes/attendance.routes.js
const express = require('express');
const {
    checkIn, checkOut, history, userHistory,
    recordsByMonth, getTodayCount, payrollByMonth, scanRFID
} = require('../controllers/attendance.controller');

const router = express.Router();

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/history', history);
router.get('/user-history/:user_id', userHistory);
router.get('/records', recordsByMonth);
router.get('/payroll', payrollByMonth);
router.get('/today-count', getTodayCount);

// 👇 thêm dòng này
router.post('/scan-rfid', scanRFID);

module.exports = router;
