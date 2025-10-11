# Debug Guide - Shifts API Issues

## Vấn đề hiện tại
Trang Shift Management báo lỗi khi tải dữ liệu từ database, mặc dù database đã có dữ liệu.

## Các bước debug

### 1. Kiểm tra Backend Server
```bash
# Chạy backend server
cd backend
npm start
```

Kiểm tra xem server có chạy trên port 3001 không:
- Mở browser và truy cập: http://localhost:3001
- Hoặc kiểm tra console log của backend

### 2. Test API trực tiếp
Chạy file test: `test_api.bat` hoặc `node test_shifts_api.js`

### 3. Kiểm tra Database Connection
```sql
-- Kiểm tra dữ liệu trong bảng shifts
SELECT * FROM shifts;

-- Kiểm tra cấu trúc bảng
DESCRIBE shifts;
```

### 4. Kiểm tra Frontend Console
1. Mở Developer Tools (F12)
2. Vào tab Console
3. Click nút "Test API" trong trang Shift Management
4. Xem các log messages

### 5. Các lỗi có thể gặp

#### Lỗi CORS
```
Access to fetch at 'http://localhost:3001/api/shifts' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Giải pháp**: Kiểm tra CORS settings trong backend

#### Lỗi Connection Refused
```
Failed to fetch
```
**Giải pháp**: Backend server không chạy hoặc chạy sai port

#### Lỗi 404
```
HTTP error! status: 404
```
**Giải pháp**: Route không được đăng ký đúng cách

#### Lỗi 500
```
HTTP error! status: 500
```
**Giải pháp**: Lỗi database hoặc server

### 6. Kiểm tra Routes
Đảm bảo trong `backend/routes/index.js` có:
```javascript
router.use('/api/shifts', shiftsRoutes);
```

### 7. Kiểm tra Controller
Đảm bảo `backend/controllers/shifts.controller.js` export đúng:
```javascript
module.exports = {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  toggleShiftStatus
};
```

## Cải tiến đã thực hiện

### 1. Enhanced Error Handling
- Thêm detailed logging cho tất cả API calls
- Hiển thị error messages cho user
- Kiểm tra response status và success flag

### 2. Debug Tools
- Thêm nút "Test API" để debug
- Console logging cho tất cả requests/responses
- Test script để kiểm tra API độc lập

### 3. User Experience
- Loading states
- Success/error notifications
- Proper error messages

## Cách sử dụng

1. **Mở trang Shift Management**
2. **Click nút "Test API"** để xem debug info
3. **Kiểm tra Console** (F12) để xem chi tiết
4. **Chạy test script** nếu cần debug sâu hơn

## Troubleshooting

Nếu vẫn gặp lỗi:

1. **Restart backend server**
2. **Kiểm tra database connection**
3. **Xem backend logs** để tìm lỗi cụ thể
4. **Kiểm tra network tab** trong DevTools
5. **Verify API endpoints** bằng Postman hoặc curl
