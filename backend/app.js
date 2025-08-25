// backend/app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();

// Middlewares chung
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// Serve static files cho face-api weights
app.use('/api/face_api/weights', express.static(path.join(__dirname, 'api/face_api/weights')));

// Định tuyến
app.use(routes);

// Xử lý 404 và lỗi tổng
app.use(notFound);
app.use(errorHandler);

module.exports = app;
