// backend/routes/devices.routes.js
const express = require('express');
const { listActive } = require('../controllers/devices.controller');

const router = express.Router();

router.get('/', listActive);

module.exports = router;
