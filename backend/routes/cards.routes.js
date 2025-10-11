const express = require('express');
const {
    startScan,
    getScanStatus,
    handleScanResult,
    getCards,
    deleteCard,
    testCards,
    cancelScan,
} = require('../controllers/cards.controller');

const router = express.Router();

// Bắt đầu quét thẻ
router.post('/start-scan', startScan);

// Poll theo SESSION (khuyến nghị)
router.get('/scan-status/by-session/:sessionId', getScanStatus);

// Poll theo USER (tương thích phiên bản cũ)
router.get('/scan-status/:userId', getScanStatus);

// Thiết bị gửi kết quả
router.post('/scan-result', handleScanResult);

// Danh sách / Xoá thẻ
router.get('/', getCards);
router.delete('/:userId', deleteCard);

// Test
router.get('/test', testCards);

// Hủy quét
router.post('/cancel-scan', cancelScan);

module.exports = router;
