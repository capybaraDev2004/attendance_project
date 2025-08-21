// backend/app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();

// Middlewares chung
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// Định tuyến
app.use(routes);

// Xử lý 404 và lỗi tổng
app.use(notFound);
app.use(errorHandler);

module.exports = app;
