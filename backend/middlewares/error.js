// backend/middlewares/error.js

// 404 Not Found
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: 'Endpoint không tồn tại'
  });
}

// Error Handler mặc định
function errorHandler(err, req, res, next) {
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Da du luot cham cong hom nay',
      limit: 'daily_once'
    });
  }
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Loi may chu'
  });
}


module.exports = { notFound, errorHandler };
