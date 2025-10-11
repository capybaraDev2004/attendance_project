# Hướng dẫn sửa lỗi triệt để

## Vấn đề đã xác định
- Frontend gọi API với URL tương đối `/api/users` 
- Server trả về HTML thay vì JSON (có thể là 404 page)
- Cần sử dụng URL đầy đủ `http://localhost:3001/api/users`

## Đã sửa

### 1. Frontend
- ✅ Sử dụng URL đầy đủ thay vì relative URL
- ✅ Thêm kiểm tra response status và content-type
- ✅ Tạo config file để quản lý API endpoints
- ✅ Thêm error handling chi tiết

### 2. Backend  
- ✅ Thêm debug middleware để log tất cả requests
- ✅ CORS đã được cấu hình đúng

## Các bước test

### Bước 1: Restart Backend
```bash
# Chạy file batch
restart_and_test.bat

# Hoặc thủ công
cd backend
npm start
```

### Bước 2: Kiểm tra Backend Log
Terminal backend phải hiển thị:
```
API đang chạy tại http://localhost:3001
2025-01-XX - GET /api/users
```

### Bước 3: Test API trực tiếp
Mở browser, truy cập:
```
http://localhost:3001/api/users
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "users": [...],
  "count": 12
}
```

### Bước 4: Test Frontend
1. Mở modal "Thêm thẻ nhân viên"
2. Kiểm tra console log (F12)
3. Dropdown phải hiển thị 11 nhân viên

## Nếu vẫn lỗi

### Kiểm tra Network Tab
1. F12 → Network tab
2. Mở modal
3. Xem request `/api/users`
4. Kiểm tra:
   - Status code (phải là 200)
   - Response headers (phải có `content-type: application/json`)
   - Response body (phải là JSON)

### Kiểm tra Backend Log
Terminal backend phải hiển thị:
```
2025-01-XX - GET /api/users
=== BACKEND DEBUG ===
Total users: 12
Users without card: 11
Users with card: 1
```

## Kết quả cuối cùng
- ✅ Backend log hiển thị request
- ✅ API trả về JSON đúng format
- ✅ Frontend nhận được 11 users
- ✅ Dropdown hiển thị danh sách nhân viên
- ✅ Không còn lỗi "Unexpected token '<'"

## Troubleshooting

### Nếu vẫn nhận HTML:
1. Kiểm tra port 3001 có đúng không
2. Kiểm tra backend có chạy không
3. Kiểm tra firewall/antivirus
4. Thử restart hoàn toàn

### Nếu API trả về lỗi:
1. Kiểm tra database connection
2. Kiểm tra MySQL service
3. Kiểm tra database có dữ liệu không
