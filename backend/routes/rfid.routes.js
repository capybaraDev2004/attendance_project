const express = require('express');
const router = express.Router();
const rfidController = require('../controllers/rfid.controller');

/**
 * Routes quản lý thẻ RFID
 * Tương tác với bảng rfid trong database
 */

// Lấy danh sách tất cả thẻ RFID
router.get('/', rfidController.getAllRfidCards);

// Lấy danh sách nhân viên chưa được gán thẻ
router.get('/available-users', rfidController.getAvailableUsers);

// Thêm thẻ RFID mới
router.post('/', rfidController.addRfidCard);

// Cập nhật thông tin thẻ RFID
router.put('/:cardCode', rfidController.updateRfidCard);

// Xóa thẻ RFID
router.delete('/:cardCode', rfidController.deleteRfidCard);

// Gán thẻ cho nhân viên
router.post('/:cardCode/assign', rfidController.assignCardToUser);

// Hủy gán thẻ
router.post('/:cardCode/unassign', rfidController.unassignCard);

module.exports = router;
