// backend/routes/users.routes.js
const express = require('express');
const { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  createAccount, 
  resetPassword 
} = require('../controllers/users.controller');

const router = express.Router();

// Lấy danh sách người dùng
router.get('/', getUsers);

// Thêm người dùng mới
router.post('/', createUser);

// Cập nhật thông tin người dùng
router.put('/:userID', updateUser);

// Xóa người dùng
router.delete('/:userID', deleteUser);

// Tạo tài khoản cho người dùng
router.post('/:userID/account', createAccount);

// Cấp lại mật khẩu
router.put('/:userID/password', resetPassword);

module.exports = router;
