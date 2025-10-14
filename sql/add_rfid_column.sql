-- Thêm cột rfid_uid vào bảng attendance (nếu cần)
-- Chạy lệnh này nếu bảng attendance chưa có cột rfid_uid

ALTER TABLE `attendance` 
ADD COLUMN `rfid_uid` varchar(50) DEFAULT NULL 
AFTER `user_id`;

-- Thêm index cho cột rfid_uid
ALTER TABLE `attendance` 
ADD INDEX `idx_attendance_rfid_uid` (`rfid_uid`);

-- Thêm foreign key constraint (tùy chọn)
-- ALTER TABLE `attendance` 
-- ADD CONSTRAINT `fk_attendance_rfid` 
-- FOREIGN KEY (`rfid_uid`) REFERENCES `rfid` (`rfid_uid`) 
-- ON DELETE SET NULL ON UPDATE CASCADE;