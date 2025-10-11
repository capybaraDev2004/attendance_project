# Khắc phục lỗi Backend không chạy

## Vấn đề hiện tại
- Lỗi: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- Nguyên nhân: Backend không chạy hoặc API endpoint không tồn tại
- Kết quả: Frontend nhận HTML thay vì JSON

## Các bước khắc phục

### Bước 1: Kiểm tra Backend có chạy không
```bash
node check_backend.js
```

### Bước 2: Start Backend
```bash
node start_backend.js
```

Hoặc thủ công:
```bash
cd backend
npm install
npm start
```

### Bước 3: Kiểm tra Port
Backend cần chạy trên port 3001. Kiểm tra:
- Terminal hiển thị: `Server running on port 3001`
- Không có lỗi database connection

### Bước 4: Test API
Mở browser, truy cập:
```
http://localhost:3001/api/users
```

Kết quả mong đợi:
```json
{
  "success": true,
  "users": [...],
  "count": 12
}
```

### Bước 5: Kiểm tra Database
Đảm bảo database connection hoạt động:
- MySQL server đang chạy
- Database `attendance_app` tồn tại
- Bảng `users` có dữ liệu

## Các lỗi thường gặp

### 1. Port 3001 đã được sử dụng
```bash
# Tìm process sử dụng port 3001
netstat -ano | findstr :3001

# Kill process (thay PID bằng số thực tế)
taskkill /PID <PID> /F
```

### 2. Database connection failed
- Kiểm tra MySQL service
- Kiểm tra connection string trong `backend/config/database.js`
- Kiểm tra username/password database

### 3. Dependencies chưa cài
```bash
cd backend
npm install
```

### 4. CORS issue
Kiểm tra file `backend/app.js` có CORS middleware:
```javascript
app.use(cors());
```

## Script tự động

### Windows (restart_backend.bat)
```batch
@echo off
echo Stopping any existing backend processes...
taskkill /F /IM node.exe 2>nul

echo Starting backend...
cd backend
npm install
npm start
pause
```

### Linux/Mac (restart_backend.sh)
```bash
#!/bin/bash
echo "Stopping any existing backend processes..."
pkill -f "node.*backend" 2>/dev/null

echo "Starting backend..."
cd backend
npm install
npm start
```

## Kiểm tra sau khi fix

1. **Backend log**: Không có lỗi, hiển thị "Server running on port 3001"
2. **API test**: `http://localhost:3001/api/users` trả về JSON
3. **Frontend**: Modal hiển thị danh sách nhân viên
4. **Console**: Không có lỗi "Unexpected token '<'"

## Nếu vẫn không hoạt động

1. Kiểm tra firewall
2. Kiểm tra antivirus blocking
3. Thử port khác (3002, 3003, etc.)
4. Kiểm tra Node.js version
5. Xóa node_modules và cài lại

## Liên hệ hỗ trợ
Cung cấp thông tin:
- Backend log từ terminal
- Kết quả `node check_backend.js`
- Screenshot lỗi
- Node.js version: `node --version`
