Lưu ý:
- Sau khi tải trong kiểm tra đã đủ file node_modules chưa
- Cập nhật sql, hiện đang chạy với 2 hệ CSDL
    + Chính: xampp(file sql đã được export trong tệp sql, tên dabase = tên file)
    + Phụ: Mongodb(chỉ hỗ trợ với nhận diện khuôn mặt)
- Khi push code thì không đẩy vào main, hãy tạo branch riêng
- Push code xong nhắn zalo, tag all với mục đích thông báo(Có thể nói luôn là thay đổi mục nào để tiện đồng bộ)

- LƯU Ý ĐẶC BIỆT QUAN TRONGJGGGGGGGGGGGGGGGG!!!!!!!!!!!!!!!!!!!!!!!!
Trước khi đẩy code luôn luôn pull về trước rồi mới đẩy nhé, dưới đây là hướng dẫn chi tiết!
✅ Trường hợp 1: Pull về nhưng không có thay đổi gì trên GitHub
# Kiểm tra branch
git branch

# Đảm bảo đang ở main
git checkout main

# Kéo code mới nhất về
git pull origin main
# Nếu không có gì mới → báo: Already up to date.

# Thêm code bạn đã sửa
git add .

# Commit
git commit -m "Cập nhật code: đổi màu red → green"

# Đẩy code lên GitHub
git push origin main


--------------------------------------------------------------------------------------------------------------------------------------------------------------------

# ============================================
# ✅ TRƯỜNG HỢP 2: PULL VỀ CÓ CODE THAY ĐỔI
# ============================================

# 1. Đảm bảo bạn đang đứng ở branch main (nhánh chính)
git checkout main

# 2. Kéo code mới nhất từ GitHub về
git pull origin main

# ============================================
# 👉 Trường hợp A: Git tự merge được (không có conflict)
# ============================================
# Nếu Git báo: "Merge made by the 'ort' strategy."
# => Nghĩa là đã hợp nhất thành công, không cần chỉnh gì cả.
# Bạn chỉ cần push code mới nhất lên:
git push origin main

# ============================================
# 👉 Trường hợp B: Git báo có CONFLICT
# ============================================
# Git sẽ hiện thông báo kiểu:
# CONFLICT (content): Merge conflict in src/App.css
# Automatic merge failed; fix conflicts and then commit the result.

# 3. Mở file bị conflict, bạn sẽ thấy nội dung dạng:
# <<<<<<< HEAD
# h1 { color: green; }   # code hiện tại của bạn
# =======
# h1 { color: blue; }    # code từ GitHub (đồng đội đã push trước)
# >>>>>>> origin/main

# 4. Bạn phải chỉnh tay lại cho đúng ý.
# Ví dụ giữ code của bạn:
# h1 { color: green; }
#
# Hoặc gộp cả 2:
# h1 { color: green; font-weight: bold; }

# 5. Sau khi sửa xong, lưu lại file.
# Đánh dấu file đó đã được xử lý conflict:
git add src/App.css   # (thay bằng file thật sự bị conflict)
# Hoặc add tất cả file đã sửa:
git add .

# 6. Commit lại việc giải quyết conflict
git commit -m "Resolve conflict: hợp nhất code từ GitHub và local"

# 7. Cuối cùng, đẩy code hợp nhất lên GitHub
git push origin main

# ============================================
# 🚀 Sau bước này, code trên GitHub sẽ bao gồm:
# - Code mới nhất mà đồng đội push trước đó
# - Code mà bạn vừa merge và giải quyết conflict
# Không ai bị mất code cả!
# ============================================

