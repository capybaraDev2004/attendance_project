# Debug Scan Status API

## Vấn đề đã sửa
- ✅ Thêm debug logging cho getScanStatus
- ✅ Log tất cả sessions khi kiểm tra
- ✅ Log session được tạo trong startScan
- ✅ Cải thiện error handling

## Các bước test

### Bước 1: Test Start Scan
1. Mở modal "Thêm thẻ nhân viên"
2. Chọn nhân viên (ví dụ: userID 5)
3. Click "Bắt đầu quét thẻ"

**Backend log mong đợi:**
```
2025-01-XX - POST /api/cards/start-scan
=== SESSION CREATED ===
SessionId: scan_5_1234567890
UserId: 5
Total sessions: 1
Arduino communication error: connect ECONNREFUSED 192.168.1.25:80
Arduino không khả dụng, tiếp tục với chế độ demo: Không thể kết nối với thiết bị Arduino
```

### Bước 2: Test Scan Status
Sau khi start scan, frontend sẽ gọi:
```
GET /api/cards/scan-status/5
```

**Backend log mong đợi:**
```
2025-01-XX - GET /api/cards/scan-status/5
=== GET SCAN STATUS ===
UserID: 5
ScanSessions size: 1
Session scan_5_1234567890: { userId: 5, status: 'scanning', startTime: '2025-01-XX...' }
Time diff: 1.234 seconds
Returning session status: scanning
```

### Bước 3: Kiểm tra Frontend
Frontend sẽ nhận được:
```json
{
  "status": "scanning",
  "success": false,
  "message": null
}
```

## Nếu vẫn lỗi

### Kiểm tra Backend Log
1. Xem có log "=== SESSION CREATED ===" không
2. Xem có log "=== GET SCAN STATUS ===" không
3. Kiểm tra sessionId có khớp không

### Kiểm tra Session Storage
Backend sử dụng Map để lưu sessions:
- Session được tạo trong startScan
- Session được tìm trong getScanStatus
- Session bị xóa khi timeout

### Test với user khác
Thử với userID khác:
- 2 (Capybara)
- 3 (Nguyễn Tiến Toán)
- 4 (Đào Văn Tâm)

## Kết quả mong đợi
- ✅ startScan tạo session thành công
- ✅ getScanStatus tìm thấy session
- ✅ API trả về 200 OK thay vì 500
- ✅ Frontend nhận được response đúng
- ✅ Modal hiển thị "Mời quét thẻ RFID..."
