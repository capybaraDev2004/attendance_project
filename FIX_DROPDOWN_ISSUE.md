# Hướng dẫn sửa lỗi dropdown không hiển thị nhân viên

## Vấn đề
Dropdown chọn nhân viên trong modal "Thêm thẻ nhân viên" không hiển thị danh sách nhân viên, mặc dù trong database đã có cột `rfid_uid` và có dữ liệu.

## Nguyên nhân có thể
1. Backend chưa được restart sau khi thêm cột `rfid_uid`
2. Logic lọc dữ liệu trong frontend không đúng
3. Dữ liệu `rfid_uid` trong database có format khác với expected

## Các bước khắc phục

### 1. Restart Backend
```bash
cd backend
npm install axios
npm start
```

### 2. Kiểm tra dữ liệu database
Chạy query SQL sau để kiểm tra:
```sql
SELECT userID, fullName, rfid_uid, position 
FROM users 
ORDER BY userID;
```

### 3. Test API endpoint
Mở browser và truy cập:
```
http://localhost:3001/api/users/test/rfid
```

Endpoint này sẽ trả về thông tin debug về dữ liệu RFID.

### 4. Kiểm tra Console
1. Mở Developer Tools (F12)
2. Vào tab Console
3. Mở modal "Thêm thẻ nhân viên"
4. Xem log trong console:
   - "All users:" - danh sách tất cả users
   - "Users without card:" - danh sách users chưa có thẻ

### 5. Sử dụng nút Debug
Trong modal, nếu không có nhân viên nào hiển thị, sẽ có nút "Debug" để kiểm tra dữ liệu.

## Code đã được cập nhật

### Frontend (AddCardModal.jsx)
- Thêm logic lọc dữ liệu mạnh mẽ hơn
- Thêm debug logging
- Thêm nút test để kiểm tra dữ liệu
- Hiển thị thông báo khi không có nhân viên

### Backend (users.controller.js)
- Thêm endpoint test `/api/users/test/rfid`
- Trả về thông tin debug về dữ liệu RFID

## Kết quả mong đợi
Sau khi khắc phục, dropdown sẽ hiển thị:
- Capybara - Giám đốc điều hành
- Nguyễn Tiến Toán - Lập trình viên Junior  
- Đào Văn Tâm - Chuyên viên nhân sự

(Vì userID 1 - Vũ Minh Quân đã có rfid_uid = "9375790C")

## Nếu vẫn không hoạt động
1. Kiểm tra network tab trong Developer Tools
2. Xem response của API `/api/users`
3. Kiểm tra format dữ liệu `rfid_uid` trong database
4. Đảm bảo backend đang chạy trên port 3001
