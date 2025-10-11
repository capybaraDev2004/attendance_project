-- Thêm cột rfid_uid vào bảng users
ALTER TABLE `users` ADD COLUMN `rfid_uid` VARCHAR(50) NULL DEFAULT NULL AFTER `status`;

-- Thêm index cho rfid_uid để tối ưu tìm kiếm
ALTER TABLE `users` ADD UNIQUE INDEX `idx_rfid_uid` (`rfid_uid`);

-- Thêm comment cho cột
ALTER TABLE `users` MODIFY COLUMN `rfid_uid` VARCHAR(50) NULL DEFAULT NULL COMMENT 'UID của thẻ RFID';
