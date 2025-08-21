// backend/routes/attendance.routes.js
const express = require('express');
const { checkIn, checkOut, history } = require('../controllers/attendance.controller');

const router = express.Router();

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/history', history);

module.exports = router;
