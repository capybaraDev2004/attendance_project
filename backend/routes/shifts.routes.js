// backend/routes/shifts.routes.js
const express = require('express');
const router = express.Router();
const shiftsController = require('../controllers/shifts.controller');

// Routes cho quản lý ca làm việc
router.get('/', shiftsController.getAllShifts);           // Lấy danh sách tất cả ca làm việc
router.get('/:id', shiftsController.getShiftById);        // Lấy thông tin ca làm việc theo ID
router.post('/', shiftsController.createShift);           // Tạo ca làm việc mới
router.put('/:id', shiftsController.updateShift);         // Cập nhật thông tin ca làm việc
router.delete('/:id', shiftsController.deleteShift);      // Xóa ca làm việc
router.patch('/:id/toggle', shiftsController.toggleShiftStatus); // Bật/tắt trạng thái ca làm việc

module.exports = router;
