# Hướng dẫn tắt warnings từ face-api.js

## Vấn đề
Có 175 warnings từ thư viện face-api.js liên quan đến source maps. Đây là warnings từ node_modules, không phải từ code của chúng ta.

## Giải pháp

### Cách 1: Tắt source map (Đơn giản nhất)
Tạo file `.env` trong thư mục frontend với nội dung:
```
GENERATE_SOURCEMAP=false
```

### Cách 2: Cài đặt react-app-rewired
```bash
cd attendance_project/frontend
npm install --save-dev react-app-rewired
```

Sau đó chạy:
```bash
npm start
```

### Cách 3: Cài đặt CRACO
```bash
cd attendance_project/frontend
npm install --save-dev @craco/craco
```

Sau đó chạy:
```bash
npm start
```

## Lưu ý
- Các warnings này không ảnh hưởng đến chức năng của ứng dụng
- Chúng chỉ là thông báo về source maps bị thiếu từ thư viện face-api.js
- Tắt source map sẽ làm giảm kích thước build nhưng khó debug hơn

## Khuyến nghị
Sử dụng Cách 1 (tạo file .env) vì đơn giản và hiệu quả nhất.
