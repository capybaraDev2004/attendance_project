// backend/routes/rfid.routes.js
const express = require('express');
const router = express.Router();
const rfidController = require('../controllers/rfid.controller');

// Lấy danh sách tất cả thẻ RFID
router.get('/', rfidController.getAllRfidCards);

// Danh sách nhân viên CHƯA được gán thẻ
router.get('/available-users', rfidController.getAvailableUsers);

// ✅ Danh sách thẻ CHƯA gán (dropdown cho admin)
router.get('/unassigned', rfidController.listUnassigned);

// Thêm thẻ RFID (tạo thủ công)
router.post('/', rfidController.addRfidCard);

// Cập nhật thông tin thẻ
router.put('/:cardCode', rfidController.updateRfidCard);

// Xóa thẻ
router.delete('/:cardCode', rfidController.deleteRfidCard);

// Gán / Hủy gán thẻ cho nhân viên
router.post('/:cardCode/assign', rfidController.assignCardToUser);
router.post('/:cardCode/unassign', rfidController.unassignCard);

module.exports = router;
