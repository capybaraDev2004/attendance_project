# Test Cards API

## Vấn đề đã sửa
- ✅ Lỗi 500 khi gọi `/api/cards/start-scan`
- ✅ Arduino không bắt buộc phải kết nối
- ✅ Thêm error handling cho Arduino communication

## Các bước test

### Bước 1: Test Cards API cơ bản
Mở browser, truy cập:
```
http://localhost:3001/api/cards/test
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Cards API hoạt động bình thường",
  "timestamp": "2025-01-XX..."
}
```

### Bước 2: Test Start Scan API
Sử dụng Postman hoặc curl:
```bash
curl -X POST http://localhost:3001/api/cards/start-scan \
  -H "Content-Type: application/json" \
  -d '{"userId": 2}'
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Bắt đầu quét thẻ",
  "sessionId": "scan_2_1234567890"
}
```

### Bước 3: Test Frontend
1. Mở modal "Thêm thẻ nhân viên"
2. Chọn nhân viên (ví dụ: Capybara)
3. Click "Bắt đầu quét thẻ"
4. Kiểm tra console log

## Backend Log mong đợi
```
2025-01-XX - POST /api/cards/start-scan
Arduino communication error: connect ECONNREFUSED 192.168.1.25:80
Arduino không khả dụng, tiếp tục với chế độ demo: Không thể kết nối với thiết bị Arduino
```

## Nếu vẫn lỗi

### Kiểm tra Backend Log
Terminal backend phải hiển thị:
```
2025-01-XX - POST /api/cards/start-scan
```

### Kiểm tra Database
Đảm bảo user được chọn:
- Có tồn tại trong database
- Chưa có rfid_uid (NULL)

### Test với user khác
Thử với userID khác:
- 2 (Capybara)
- 3 (Nguyễn Tiến Toán)
- 4 (Đào Văn Tâm)

## Kết quả cuối cùng
- ✅ API `/api/cards/start-scan` trả về 200 OK
- ✅ Frontend nhận được response thành công
- ✅ Modal hiển thị "Mời quét thẻ RFID..."
- ✅ Không còn lỗi 500
