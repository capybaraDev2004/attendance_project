// backend/routes/devices.routes.js
const express = require('express');
const { listAll, listActive, createDevice, updateDevice, deleteDevice } = require('../controllers/devices.controller');

const router = express.Router();

// Danh sách tất cả thiết bị
router.get('/', listAll);
// Danh sách thiết bị đang active
router.get('/active', listActive);
// Tạo thiết bị
router.post('/', createDevice);
// Cập nhật thiết bị
router.put('/:id', updateDevice);
// Xóa thiết bị
router.delete('/:id', deleteDevice);

module.exports = router;
