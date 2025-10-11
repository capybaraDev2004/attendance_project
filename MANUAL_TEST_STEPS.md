# Hướng dẫn test thủ công

## Bước 1: Test Backend API
Mở browser và truy cập:
```
http://localhost:3001/api/users/debug
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "total": 12,
  "withoutCard": 11,
  "withCard": 1,
  "users": [...]
}
```

## Bước 2: Test API Users chính
Truy cập:
```
http://localhost:3001/api/users
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "users": [
    {
      "userID": 1,
      "fullName": "Vũ Minh Quân",
      "rfid_uid": "9375790C",
      ...
    },
    {
      "userID": 2,
      "fullName": "Capybara", 
      "rfid_uid": null,
      ...
    },
    ...
  ],
  "count": 12
}
```

## Bước 3: Kiểm tra Backend Log
Trong terminal chạy backend, xem log:
```
=== BACKEND DEBUG ===
Total users: 12
1. Vũ Minh Quân - rfid_uid: 9375790C (string)
2. Capybara - rfid_uid: null (object)
3. Nguyễn Tiến Toán - rfid_uid: null (object)
...
Users without card: 11
Users with card: 1
```

## Bước 4: Test Frontend
1. Mở modal "Thêm thẻ nhân viên"
2. Kiểm tra dropdown có hiển thị 11 nhân viên không
3. Xem console log (F12)

## Nếu vẫn không hoạt động

### Kiểm tra Database
Chạy SQL:
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

### Kiểm tra Network Tab
1. F12 → Network tab
2. Mở modal
3. Xem request `/api/users`
4. Kiểm tra response

## Kết quả mong đợi cuối cùng
- Backend API trả về đúng JSON
- Frontend nhận được 11 users chưa có thẻ
- Dropdown hiển thị danh sách nhân viên
