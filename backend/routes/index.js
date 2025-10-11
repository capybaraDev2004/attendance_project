// backend/routes/index.js
const express = require('express');

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const attendanceRoutes = require('./attendance.routes');
const devicesRoutes = require('./devices.routes');
const systemRoutes = require('./system.routes');
const faceRoutes = require('./face.routes'); // thêm nhóm route khuôn mặt
const shiftsRoutes = require('./shifts.routes'); // thêm nhóm route ca làm việc
const positionsRoutes = require('./positions.routes'); // nhóm route chức vụ
const rfidRoutes = require('./rfid.routes'); // nhóm route quản lý thẻ RFID

const router = express.Router();

// Group route theo prefix để frontend giữ nguyên URL
router.use('/api/auth', authRoutes);
router.use('/api/users', usersRoutes);
router.use('/api/attendance', attendanceRoutes);
router.use('/api/devices', devicesRoutes);
router.use('/api/face', faceRoutes); // đăng ký API khuôn mặt
router.use('/api/shifts', shiftsRoutes); // đăng ký API ca làm việc
router.use('/api/positions', positionsRoutes); // đăng ký API chức vụ
router.use('/api/rfid', rfidRoutes); // đăng ký API quản lý thẻ RFID

// Non-API utilities
router.use('/', systemRoutes);

module.exports = router;
