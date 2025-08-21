// backend/routes/index.js
const express = require('express');

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const attendanceRoutes = require('./attendance.routes');
const devicesRoutes = require('./devices.routes');
const systemRoutes = require('./system.routes');

const router = express.Router();

// Group route theo prefix để frontend giữ nguyên URL
router.use('/api/auth', authRoutes);
router.use('/api/users', usersRoutes);
router.use('/api/attendance', attendanceRoutes);
router.use('/api/devices', devicesRoutes);

// Non-API utilities
router.use('/', systemRoutes);

module.exports = router;
