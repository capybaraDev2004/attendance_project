# 🔧 Fix Duplicate Entry Error

## ❌ **Lỗi hiện tại:**
```
[HTTP] code=500
[HTTP] resp={"success":false,"message":"Lỗi máy chủ","error":"Duplicate entry '1-2025-10-12' for key 'uniq_att_user_date'"}
```

## ✅ **Nguyên nhân:**
Constraint `uniq_att_user_date` chỉ cho phép 1 bản ghi duy nhất cho mỗi user trong mỗi ngày, nhưng hệ thống cần hỗ trợ nhiều ca làm việc.

## 🛠️ **Cách sửa:**

### **Bước 1: Xóa constraint unique**
Chạy SQL này trong phpMyAdmin:
```sql
ALTER TABLE `attendance` 
DROP INDEX `uniq_att_user_date`;
```

### **Bước 2: Thêm lại index thông thường**
```sql
ALTER TABLE `attendance` 
ADD INDEX `idx_att_user_date` (`user_id`, `work_date`);
```

### **Bước 3: Restart backend**
Chạy file `restart_backend.bat` hoặc:
```bash
cd backend
node server.js
```

## 📋 **Logic chấm công mới:**

1. **Lần đầu quét**: Tạo check-in mới
2. **Lần 2 quét**: Cập nhật check-out cho bản ghi hiện tại
3. **Lần 3 quét**: Tạo check-in mới (ca thứ 2)
4. **Lần 4 quét**: Cập nhật check-out cho ca thứ 2
5. **Và cứ thế...**

## 🎯 **Kết quả mong đợi:**
```
[HTTP] code=200
[HTTP] resp={"success":true,"action":"Check-in","message":"✅ [Tên nhân viên] Check-in"}
```

## ⚠️ **Lưu ý:**
- Hệ thống sẽ hỗ trợ nhiều ca làm việc trong ngày
- Mỗi ca sẽ có 1 bản ghi riêng biệt
- Index vẫn được duy trì để tối ưu hiệu suất truy vấn

