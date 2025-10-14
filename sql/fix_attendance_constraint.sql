-- Xóa constraint unique để cho phép nhiều ca làm việc trong ngày
-- Chạy lệnh này để sửa lỗi "Duplicate entry"

ALTER TABLE `attendance` 
DROP INDEX `uniq_att_user_date`;

-- Thêm lại index thông thường (không unique)
ALTER TABLE `attendance` 
ADD INDEX `idx_att_user_date` (`user_id`, `work_date`);

