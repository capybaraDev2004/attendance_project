// backend/routes/users.routes.js
const express = require('express');
const { getUsers, getByUID, testRfidData, debugUsers } = require('../controllers/users.controller');

const router = express.Router();

router.get('/', getUsers);
router.get('/by-uid/:uid', getByUID);
router.get('/test/rfid', testRfidData); // Test endpoint
router.get('/debug', debugUsers); // Debug endpoint
module.exports = router;
