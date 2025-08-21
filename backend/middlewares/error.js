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
  // Log lỗi server-side
  // Lưu ý: Có thể mở rộng để phân loại lỗi (DB, Validation, Auth, ...)
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ',
    error: err?.message
  });
}

module.exports = { notFound, errorHandler };
