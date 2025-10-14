# 🔧 Fix RFID Endpoint Error

## ❌ **Lỗi hiện tại:**
```
[HTTP] code=404
[HTTP] resp={"success":false,"message":"Endpoint không tồn tại"}
```

## ✅ **Nguyên nhân:**
Endpoint `/api/attendance/scan-rfid` chưa được định nghĩa trong routes.

## 🛠️ **Cách sửa:**

### **Bước 1: Cập nhật routes**
File `backend/routes/attendance.routes.js` đã được cập nhật:
```javascript
const { checkIn, checkOut, history, userHistory, recordsByMonth, getTodayCount, payrollByMonth, scanRFID } = require('../controllers/attendance.controller');

router.post('/scan-rfid', scanRFID);
```

### **Bước 2: Cập nhật database (nếu cần)**
Chạy file SQL để thêm cột `rfid_uid` vào bảng `attendance`:
```sql
ALTER TABLE `attendance` 
ADD COLUMN `rfid_uid` varchar(50) DEFAULT NULL 
AFTER `user_id`;
```

### **Bước 3: Restart backend**
Chạy file `restart_backend.bat` hoặc:
```bash
cd backend
node server.js
```

### **Bước 4: Test lại**
Quét thẻ RFID và kiểm tra log:
- ✅ Thành công: `[HTTP] code=200`
- ❌ Lỗi: Kiểm tra database và UID

## 📋 **Kiểm tra:**
1. Backend đang chạy trên port 3001
2. Database có bảng `rfid` với dữ liệu
3. UID `9375790C` có trong bảng `rfid`
4. User có `status = 'active'`
5. Card có `cardStatus = 'active'`

## 🎯 **Kết quả mong đợi:**
```
[HTTP] code=200
[HTTP] resp={"success":true,"action":"Check-in","message":"✅ [Tên nhân viên] Check-in"}
```

