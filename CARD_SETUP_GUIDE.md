# Hướng dẫn cài đặt tính năng "Thêm thẻ nhân viên"

## Tổng quan
Tính năng này cho phép Admin thêm thẻ RFID mới cho nhân viên thông qua giao diện web và thiết bị Arduino.

## Cài đặt Database

### 1. Thêm cột rfid_uid vào bảng users
Chạy script SQL sau trong database:

```sql
-- Thêm cột rfid_uid vào bảng users
ALTER TABLE `users` ADD COLUMN `rfid_uid` VARCHAR(50) NULL DEFAULT NULL AFTER `status`;

-- Thêm index cho rfid_uid để tối ưu tìm kiếm
ALTER TABLE `users` ADD UNIQUE INDEX `idx_rfid_uid` (`rfid_uid`);

-- Thêm comment cho cột
ALTER TABLE `users` MODIFY COLUMN `rfid_uid` VARCHAR(50) NULL DEFAULT NULL COMMENT 'UID của thẻ RFID';
```

## Cài đặt Backend

### 1. Cài đặt dependencies
```bash
cd backend
npm install axios
```

### 2. Cấu hình IP Arduino
Trong file `backend/controllers/cards.controller.js`, cập nhật IP Arduino:
```javascript
const arduinoIP = '192.168.1.25'; // Thay đổi IP này theo IP thực tế của Arduino
```

## Cài đặt Arduino

### 1. Upload code
- Upload file `arduino/rfid_card_reader.ino` lên ESP8266
- Cấu hình WiFi trong code:
  ```cpp
  const char* WIFI_SSID  = "VIETTEL_EfastXZx";
  const char* WIFI_PASS  = "N3V05438";
  ```

### 2. Cấu hình IP Backend
Trong code Arduino, cập nhật IP backend:
```cpp
const char* SERVER_HOST = "192.168.1.24";  // IP backend
const int   SERVER_PORT = 3001;
```

### 3. Kết nối phần cứng
- RC522: SS=D2, RST=D1
- LCD I2C: SDA=D3, SCL=D4
- Buzzer: D8
- SPI: SCK=D5, MISO=D6, MOSI=D7

## Sử dụng

### 1. Truy cập Admin Dashboard
- Đăng nhập với tài khoản admin
- Vào trang Dashboard
- Click nút "Thêm thẻ mới" trong phần "Thêm thẻ nhân viên"

### 2. Quy trình thêm thẻ
1. Chọn nhân viên từ dropdown (chỉ hiển thị nhân viên chưa có thẻ)
2. Click "Bắt đầu quét thẻ"
3. Màn hình LCD Arduino sẽ hiển thị "Mời quét thẻ..."
4. Đưa thẻ RFID lên đầu đọc
5. Kết quả:
   - **Thành công**: 1 tiếng bíp, hiển thị "Thêm thẻ OK"
   - **Lỗi**: 3 tiếng bíp, hiển thị thông báo lỗi

### 3. Các trường hợp lỗi
- **Thẻ đã tồn tại**: "Thẻ đã được sử dụng bởi [Tên nhân viên]"
- **Hết thời gian**: Sau 30 giây không quét thẻ
- **Lỗi kết nối**: Không thể kết nối với Arduino hoặc backend

## API Endpoints

### Backend APIs
- `POST /api/cards/start-scan` - Bắt đầu quét thẻ
- `GET /api/cards/scan-status/:userId` - Kiểm tra trạng thái quét
- `POST /api/cards/scan-result` - Xử lý kết quả quét từ Arduino
- `GET /api/cards` - Lấy danh sách thẻ RFID
- `DELETE /api/cards/:userId` - Xóa thẻ RFID

### Arduino APIs
- `POST /start-add-card` - Bắt đầu chế độ thêm thẻ
- `GET /status` - Kiểm tra trạng thái Arduino

## Troubleshooting

### 1. Arduino không kết nối được WiFi
- Kiểm tra SSID và password WiFi
- Kiểm tra tín hiệu WiFi
- Reset ESP8266

### 2. Backend không kết nối được Arduino
- Kiểm tra IP Arduino trong code backend
- Kiểm tra Arduino có chạy web server không
- Kiểm tra firewall/network

### 3. Thẻ không được nhận diện
- Kiểm tra kết nối RC522
- Kiểm tra nguồn điện
- Thử thẻ RFID khác

### 4. LCD không hiển thị
- Kiểm tra kết nối I2C
- Kiểm tra địa chỉ I2C (mặc định 0x27)
- Kiểm tra nguồn điện

## Bảo mật

### 1. Chỉ Admin mới có quyền thêm thẻ
- Kiểm tra role trong middleware authentication
- Frontend chỉ hiển thị nút cho admin

### 2. Validation dữ liệu
- Kiểm tra user tồn tại
- Kiểm tra thẻ chưa được sử dụng
- Timeout cho session quét thẻ

### 3. Logging
- Log tất cả hoạt động thêm thẻ
- Log lỗi kết nối Arduino
- Log thay đổi database

## Mở rộng

### 1. Quản lý nhiều thiết bị Arduino
- Thêm bảng devices trong database
- Load balancing giữa các thiết bị
- Health check cho thiết bị

### 2. Thông báo real-time
- Sử dụng WebSocket
- Push notification
- Email notification

### 3. Backup và restore
- Export/import danh sách thẻ
- Backup database định kỳ
- Restore từ backup
