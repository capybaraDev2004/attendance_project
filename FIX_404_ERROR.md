# Khắc phục lỗi 404 - API endpoints không tìm thấy

## Vấn đề hiện tại
- `GET /api/cards/scan-status/5` → 404 Not Found
- `POST /api/cards/cancel-scan` → 404 Not Found
- Backend có thể chưa được restart sau khi thêm routes mới

## Các bước khắc phục

### Bước 1: Restart Backend
```bash
# Chạy file batch
restart_backend_simple.bat

# Hoặc thủ công
cd backend
npm start
```

### Bước 2: Kiểm tra Backend Log
Terminal backend phải hiển thị:
```
API đang chạy tại http://localhost:3001
```

### Bước 3: Test API Endpoints
```bash
node test_endpoints.js
```

**Kết quả mong đợi:**
```
1. Testing /api/cards/test
   Status: 200
   Response: {"success":true,"message":"Cards API hoạt động bình thường"}

2. Testing /api/cards/start-scan
   Status: 200
   Response: {"success":true,"message":"Bắt đầu quét thẻ","sessionId":"..."}

3. Testing /api/cards/scan-status/5
   Status: 200
   Response: {"status":"scanning","success":false,"message":null}

4. Testing /api/cards/cancel-scan
   Status: 200
   Response: {"success":true,"message":"Đã hủy quét thẻ"}
```

### Bước 4: Kiểm tra Routes
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

## Nếu vẫn lỗi 404

### Kiểm tra Backend Log
1. Xem có log request không:
   ```
   2025-01-XX - GET /api/cards/scan-status/5
   2025-01-XX - POST /api/cards/cancel-scan
   ```

2. Nếu không có log → Backend không nhận được request

### Kiểm tra Routes Registration
Trong `backend/routes/index.js` phải có:
```javascript
router.use('/api/cards', cardsRoutes);
```

### Kiểm tra Controller Export
Trong `backend/controllers/cards.controller.js` phải có:
```javascript
module.exports = {
    startScan,
    getScanStatus,
    handleScanResult,
    getCards,
    deleteCard,
    testCards,
    cancelScan  // ← Phải có dòng này
};
```

### Kiểm tra Routes Import
Trong `backend/routes/cards.routes.js` phải có:
```javascript
const { 
  startScan, 
  getScanStatus, 
  handleScanResult, 
  getCards, 
  deleteCard,
  testCards,
  cancelScan  // ← Phải có dòng này
} = require('../controllers/cards.controller');
```

## Kết quả mong đợi sau khi fix
- ✅ Tất cả API endpoints trả về 200 OK
- ✅ Frontend có thể gọi scan-status và cancel-scan
- ✅ Modal hoạt động bình thường
- ✅ Admin có thể hủy quét thẻ

## Troubleshooting

### Nếu backend không start:
1. Kiểm tra port 3001 có bị chiếm không
2. Kiểm tra dependencies: `npm install`
3. Kiểm tra syntax error trong code

### Nếu routes không hoạt động:
1. Kiểm tra file `backend/routes/index.js`
2. Kiểm tra import/export trong controllers
3. Restart backend hoàn toàn
