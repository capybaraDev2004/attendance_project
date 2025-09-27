// backend/routes/users.routes.js
const express = require('express');
const { getUsers ,getByUID } = require('../controllers/users.controller');

const router = express.Router();

router.get('/', getUsers);
router.get('/by-uid/:uid', getByUID);
module.exports = router;
