// backend/routes/index.js
const express = require('express');

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const attendanceRoutes = require('./attendance.routes');
const devicesRoutes = require('./devices.routes');
const systemRoutes = require('./system.routes');
const faceRoutes = require('./face.routes'); // thêm nhóm route khuôn mặt

const router = express.Router();

// Group route theo prefix để frontend giữ nguyên URL
router.use('/api/auth', authRoutes);
router.use('/api/users', usersRoutes);
router.use('/api/attendance', attendanceRoutes);
router.use('/api/devices', devicesRoutes);
router.use('/api/face', faceRoutes); // đăng ký API khuôn mặt

// Non-API utilities
router.use('/', systemRoutes);

module.exports = router;