// backend/routes/system.routes.js
const express = require('express');
const { health, testDb } = require('../controllers/system.controller');

const router = express.Router();

router.get('/health', health);
router.get('/test-db', testDb);

module.exports = router;
