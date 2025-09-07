# Cấu hình ngưỡng nhận diện khuôn mặt - NGHIÊM NGẶT

## Vấn đề hiện tại
- Ảnh người khác vẫn được nhận diện là khớp với template trong MongoDB
- Ngưỡng hiện tại quá lỏng, cần điều chỉnh nghiêm ngặt hơn

## Ngưỡng mới (CỰC KỲ NGHIÊM NGẶT)

Thêm vào file `.env` của backend:

```bash
# Ngưỡng Euclidean distance - CỰC KỲ NGHIÊM NGẶT
# Giá trị càng thấp càng nghiêm ngặt
# Mặc định mới: 0.25 (giảm từ 0.4)
FACE_THRESHOLD_EUCLIDEAN=0.25

# Ngưỡng Cosine similarity - CỰC KỲ NGHIÊM NGẶT  
# Giá trị càng cao càng nghiêm ngặt
# Mặc định mới: 0.85 (tăng từ 0.7)
FACE_THRESHOLD_COSINE=0.85
```

## Giải thích ngưỡng mới

### Euclidean Distance: 0.25 (thay vì 0.4)
- **Ý nghĩa**: Khoảng cách giữa 2 vector phải rất nhỏ
- **Quy tắc**: `distance ≤ 0.25` → Khớp
- **Tác động**: Chỉ khớp với khuôn mặt rất giống nhau

### Cosine Similarity: 0.85 (thay vì 0.7)
- **Ý nghĩa**: Góc giữa 2 vector phải rất nhỏ (gần như cùng hướng)
- **Quy tắc**: `similarity ≥ 0.85` → Khớp
- **Tác động**: Chỉ khớp với khuôn mặt có đặc điểm rất tương đồng

## Logic kiểm tra kép

```javascript
// Phải đạt CẢ 2 điều kiện:
const isEuclideanMatch = distance <= 0.25;    // Euclidean ≤ 0.25
const isCosineMatch = cosineSim >= 0.85;     // Cosine ≥ 0.85

// Chỉ khớp khi: isEuclideanMatch && isCosineMatch
```

## Kết quả mong đợi

Với ngưỡng mới:
- **Ảnh người khác**: Sẽ báo "KHÔNG KHỚP" 
- **Ảnh chính mình**: Sẽ báo "KHỚP HOÀN TOÀN"

## Điều chỉnh thêm (nếu cần)

### Nếu vẫn báo khớp với người khác:
```bash
# Nghiêm ngặt hơn nữa
FACE_THRESHOLD_EUCLIDEAN=0.2
FACE_THRESHOLD_COSINE=0.9
```

### Nếu không khớp với chính mình:
```bash
# Lỏng hơn một chút
FACE_THRESHOLD_EUCLIDEAN=0.3
FACE_THRESHOLD_COSINE=0.8
```

## Test ngưỡng

1. **Restart backend server**
2. **Thử quét khuôn mặt người khác** - bây giờ sẽ báo "KHÔNG KHỚP"
3. **Xem log terminal** để thấy kết quả:

```bash
�� Kết quả so khớp: { euclideanDistance: 0.38, cosineSimilarity: 0.93 }
🔍 Chi tiết kiểm tra khớp: { 
  euclideanMatch: false,  // 0.38 > 0.25
  cosineMatch: true,      // 0.93 >= 0.85
  overallMatch: false     // false && true = false
}
❌ Khuôn mặt KHÔNG KHỚP: { euclideanMatch: false, cosineMatch: true }
```

## Monitoring

Theo dõi log để xem kết quả:
- `🧮 Kết quả tính toán`: Hiển thị khoảng cách và độ tương đồng
- `🔍 Chi tiết kiểm tra khớp`: Hiển thị từng điều kiện
- `❌ Khuôn mặt KHÔNG KHỚP` hoặc `✅ Khuôn mặt KHỚP HOÀN TOÀN!`

## Lưu ý quan trọng

1. **Ngưỡng mới rất nghiêm ngặt** - có thể cần điều chỉnh
2. **Test với nhiều ảnh khác nhau** để tìm ngưỡng phù hợp
3. **Backup ngưỡng cũ** trước khi thay đổi
4. **Monitor log** để đảm bảo hoạt động đúng
