# Hướng dẫn Debug Dropdown Không Hiển Thị Nhân Viên

## Vấn đề hiện tại
- Database có 12 users, chỉ 1 user có rfid_uid, 11 users có rfid_uid = NULL
- Dropdown hiển thị "Tìm thấy 0 nhân viên chưa có thẻ"
- Cần tìm nguyên nhân và khắc phục

## Các bước debug

### Bước 1: Restart Backend
1. Mở Command Prompt
2. Chạy file `restart_backend.bat` hoặc:
   ```bash
   cd backend
   npm install
   npm start
   ```

### Bước 2: Kiểm tra Console Log
1. Mở modal "Thêm thẻ nhân viên"
2. Mở Developer Tools (F12)
3. Vào tab Console
4. Xem các log:
   - "API Response:"
   - "All users:"
   - "Total users:"
   - "User 1:", "User 2:", etc.
   - "Users without card:"
   - "Count users without card:"

### Bước 3: Sử dụng nút Debug
Trong modal, click các nút:
- **"Debug RFID"**: Kiểm tra endpoint test
- **"Test API"**: Kiểm tra API users trực tiếp

### Bước 4: Kiểm tra Backend Log
Trong terminal chạy backend, xem log:
- "=== DEBUG RFID DATA ==="
- Thông tin từng user
- "Users without card: X"
- "Users with card: Y"

### Bước 5: Test API trực tiếp
Mở browser, truy cập:
```
http://localhost:3001/api/users/test/rfid
```

## Các nguyên nhân có thể

### 1. Backend chưa restart
- **Triệu chứng**: API trả về dữ liệu cũ
- **Khắc phục**: Restart backend

### 2. Database connection issue
- **Triệu chứng**: API trả về lỗi
- **Khắc phục**: Kiểm tra database connection

### 3. Logic lọc sai
- **Triệu chứng**: API trả về đúng nhưng frontend lọc sai
- **Khắc phục**: Sửa logic filter

### 4. Data type issue
- **Triệu chứng**: rfid_uid có type khác với expected
- **Khắc phục**: Điều chỉnh logic so sánh

## Kết quả mong đợi

### Console Log mong đợi:
```
API Response: {success: true, users: [...], count: 12}
All users: [12 users array]
Total users: 12
User 1: {userID: 1, fullName: "Vũ Minh Quân", rfid_uid: "9375790C", ...}
User 2: {userID: 2, fullName: "Capybara", rfid_uid: null, ...}
...
Users without card: [11 users array]
Count users without card: 11
```

### Backend Log mong đợi:
```
=== DEBUG RFID DATA ===
User 1: {userID: 1, fullName: "Vũ Minh Quân", rfid_uid: "9375790C", rfid_uid_type: "string", rfid_uid_is_null: false}
User 2: {userID: 2, fullName: "Capybara", rfid_uid: null, rfid_uid_type: "object", rfid_uid_is_null: true}
...
Users without card: 11
Users with card: 1
```

## Nếu vẫn không hoạt động

### Kiểm tra Network Tab
1. F12 → Network tab
2. Mở modal
3. Xem request `/api/users`
4. Kiểm tra response

### Kiểm tra Database trực tiếp
```sql
SELECT userID, fullName, rfid_uid, 
       CASE 
         WHEN rfid_uid IS NULL THEN 'NULL'
         WHEN rfid_uid = '' THEN 'EMPTY'
         ELSE rfid_uid
       END as rfid_status
FROM users 
ORDER BY userID;
```

### Test với curl
```bash
curl http://localhost:3001/api/users
```

## Liên hệ hỗ trợ
Nếu vẫn không giải quyết được, hãy cung cấp:
1. Console log từ frontend
2. Backend log từ terminal
3. Response từ API test endpoint
4. Screenshot của Network tab
