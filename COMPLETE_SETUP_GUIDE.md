# Hướng dẫn hoàn chỉnh - Thêm thẻ nhân viên

## ✅ Đã hoàn thành

### 1. **Backend APIs**
- ✅ `POST /api/cards/start-scan` - Bắt đầu quét thẻ
- ✅ `GET /api/cards/scan-status/:userId` - Kiểm tra trạng thái quét
- ✅ `POST /api/cards/cancel-scan` - Hủy quét thẻ
- ✅ `POST /api/cards/scan-result` - Xử lý kết quả từ Arduino
- ✅ Arduino communication với error handling

### 2. **Frontend**
- ✅ Modal thêm thẻ với dropdown chọn nhân viên
- ✅ Nút "Hủy quét thẻ" khi đang quét
- ✅ Nút "Đóng" khi không quét
- ✅ Real-time status updates
- ✅ Error handling và timeout

### 3. **Arduino Code**
- ✅ Chế độ chấm công bình thường
- ✅ Chế độ thêm thẻ mới
- ✅ Web server để nhận lệnh từ backend
- ✅ LCD hiển thị trạng thái
- ✅ Buzzer: 1 bíp thành công, 3 bíp lỗi
- ✅ Timeout 30 giây

## 🔧 Cách sử dụng

### **Bước 1: Upload Arduino Code**
1. Mở Arduino IDE
2. Copy code Arduino đã cung cấp
3. Cấu hình WiFi và IP backend
4. Upload vào ESP8266

### **Bước 2: Cấu hình Backend**
1. Cập nhật IP Arduino trong `backend/controllers/cards.controller.js`:
   ```javascript
   const arduinoIP = '192.168.1.25'; // IP thực tế của Arduino
   ```

2. Restart backend:
   ```bash
   cd backend
   npm start
   ```

### **Bước 3: Sử dụng**
1. Admin vào Dashboard
2. Click "Thêm thẻ mới"
3. Chọn nhân viên từ dropdown
4. Click "Bắt đầu quét thẻ"
5. Arduino hiển thị "Mời quét thẻ..."
6. Quét thẻ RFID:
   - **Thành công**: 1 bíp + "Thêm thẻ OK"
   - **Lỗi**: 3 bíp + "Lỗi thêm thẻ"
7. Admin có thể hủy quét bất kỳ lúc nào

## 🎯 Luồng hoạt động

### **Khi bắt đầu quét:**
1. Frontend gọi `POST /api/cards/start-scan`
2. Backend tạo session và gửi lệnh đến Arduino
3. Arduino chuyển sang chế độ `ADD_CARD_MODE`
4. LCD hiển thị "Mời quét thẻ..."
5. Frontend bắt đầu polling status

### **Khi quét thẻ:**
1. Arduino nhận thẻ RFID
2. Kiểm tra thẻ đã tồn tại chưa
3. Gửi kết quả về backend
4. Backend cập nhật database
5. Arduino hiển thị kết quả và bíp
6. Frontend nhận kết quả và đóng modal

### **Khi hủy quét:**
1. Admin click "Hủy quét thẻ"
2. Frontend gọi `POST /api/cards/cancel-scan`
3. Backend xóa session và gửi lệnh đến Arduino
4. Arduino về chế độ bình thường
5. LCD hiển thị "Mời quét..."

## 🚨 Xử lý lỗi

### **Thẻ đã tồn tại:**
- Arduino: 3 bíp + "Lỗi thêm thẻ"
- Frontend: Hiển thị "Thẻ đã được sử dụng"

### **Thẻ không hợp lệ:**
- Arduino: 3 bíp + "Lỗi thêm thẻ"
- Frontend: Hiển thị "Thẻ không hợp lệ"

### **Timeout:**
- Arduino: Tự động về chế độ bình thường
- Frontend: Hiển thị "Hết thời gian chờ"

### **Arduino không khả dụng:**
- Backend: Tiếp tục hoạt động (demo mode)
- Frontend: Hiển thị thông báo lỗi

## 📊 Kết quả mong đợi

### **Thành công:**
- ✅ Arduino hiển thị "Mời quét thẻ..."
- ✅ Quét thẻ mới → 1 bíp + "Thêm thẻ OK"
- ✅ Database được cập nhật
- ✅ Modal đóng tự động

### **Lỗi:**
- ✅ Quét thẻ cũ → 3 bíp + "Lỗi thêm thẻ"
- ✅ Hiển thị thông báo lỗi chi tiết
- ✅ Admin có thể thử lại

### **Hủy quét:**
- ✅ Admin click "Hủy quét thẻ"
- ✅ Arduino về chế độ bình thường
- ✅ Modal hiển thị "Đã hủy quét thẻ"
