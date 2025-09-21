// backend/routes/positions.routes.js
const express = require('express');
const router = express.Router();
const positionsController = require('../controllers/positions.controller');

// Routes cho quản lý chức vụ
router.get('/', positionsController.getAllPositions);           // Lấy danh sách tất cả chức vụ
router.get('/:id', positionsController.getPositionById);       // Lấy chức vụ theo ID
router.get('/:id/employees', positionsController.getEmployeesByPosition); // Lấy danh sách nhân viên theo chức vụ
router.post('/', positionsController.createPosition);          // Tạo chức vụ mới
router.put('/:id', positionsController.updatePosition);         // Cập nhật chức vụ
router.delete('/:id', positionsController.deletePosition);      // Xóa chức vụ

module.exports = router;
