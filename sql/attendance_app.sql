-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th8 19, 2025 lúc 06:18 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `attendance_app`
--

CREATE DATABASE attendance_app;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `work_date` date NOT NULL,
  `check_in` datetime DEFAULT NULL,
  `check_out` datetime DEFAULT NULL,
  `first_confidence` decimal(5,4) DEFAULT NULL,
  `last_confidence` decimal(5,4) DEFAULT NULL,
  `device_in_id` int(11) DEFAULT NULL,
  `device_out_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `devices`
--

CREATE TABLE `devices` (
  `device_id` int(11) NOT NULL,
  `device_code` varchar(50) NOT NULL,
  `device_name` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `face_data`
--

CREATE TABLE `face_data` (
  `face_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `face_encoding` longtext NOT NULL,
  `face_image_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `face_data`
--

INSERT INTO `face_data` (`face_id`, `user_id`, `face_encoding`, `face_image_path`, `created_at`, `updated_at`, `is_active`) VALUES
(1, 1, '', 'assets/image/1_quandoggy.jpg', '2025-08-19 06:47:06', '2025-08-19 06:47:06', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `face_recognition_logs`
--

CREATE TABLE `face_recognition_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `recognized_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `confidence_score` decimal(5,4) DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `device_info` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `face_recognition_settings`
--

CREATE TABLE `face_recognition_settings` (
  `setting_id` int(11) NOT NULL,
  `setting_name` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `face_recognition_settings`
--

INSERT INTO `face_recognition_settings` (`setting_id`, `setting_name`, `setting_value`, `description`, `updated_at`) VALUES
(1, 'min_confidence', '0.7', 'Ngưỡng tin cậy tối thiểu để nhận diện khuôn mặt', '2025-08-19 06:47:06'),
(2, 'max_faces', '10', 'Số lượng khuôn mặt tối đa có thể nhận diện cùng lúc', '2025-08-19 06:47:06'),
(3, 'recognition_model', 'face-api.js', 'Mô hình nhận diện khuôn mặt sử dụng', '2025-08-19 06:47:06'),
(4, 'camera_resolution', '640x480', 'Độ phân giải camera mặc định', '2025-08-19 06:47:06');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `userID` int(11) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `userName` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `role` enum('admin','employee') NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`userID`, `fullName`, `userName`, `password`, `address`, `role`, `email`, `phone`, `dateOfBirth`, `gender`, `position`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Vũ Minh Quân', 'quandoggy', '123456', 'chuồng chó', 'employee', 'quanngu@gmail.com', '0123456789', '2004-03-17', 'female', 'nhân viên', 'active', '2025-08-19 16:16:22', '2025-08-19 16:17:40'),
(2, 'Nguyễn Tiến Toán', 'capybara', '123456', 'Từ Sơn - Bắc Ninh', 'admin', 'nguyentientoan28022004@gmail.com', '0352135115', '2004-02-28', 'male', 'Giám đốc', 'active', '2025-08-19 16:16:22', '2025-08-19 16:17:37');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD UNIQUE KEY `uniq_att_user_date` (`user_id`,`work_date`),
  ADD KEY `idx_att_user_date` (`user_id`,`work_date`),
  ADD KEY `idx_att_date` (`work_date`),
  ADD KEY `attendance_ibfk_2` (`device_in_id`),
  ADD KEY `attendance_ibfk_3` (`device_out_id`);

--
-- Chỉ mục cho bảng `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`device_id`),
  ADD UNIQUE KEY `device_code` (`device_code`),
  ADD KEY `idx_device_active` (`is_active`);

--
-- Chỉ mục cho bảng `face_data`
--
ALTER TABLE `face_data`
  ADD PRIMARY KEY (`face_id`),
  ADD KEY `idx_face_data_user_id` (`user_id`),
  ADD KEY `idx_face_data_active` (`is_active`);

--
-- Chỉ mục cho bảng `face_recognition_logs`
--
ALTER TABLE `face_recognition_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_recognition_logs_user_id` (`user_id`),
  ADD KEY `idx_recognition_logs_date` (`recognized_at`);

--
-- Chỉ mục cho bảng `face_recognition_settings`
--
ALTER TABLE `face_recognition_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `setting_name` (`setting_name`),
  ADD KEY `idx_settings_name` (`setting_name`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userID`),
  ADD UNIQUE KEY `userName` (`userName`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `devices`
--
ALTER TABLE `devices`
  MODIFY `device_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `face_data`
--
ALTER TABLE `face_data`
  MODIFY `face_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `face_recognition_logs`
--
ALTER TABLE `face_recognition_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `face_recognition_settings`
--
ALTER TABLE `face_recognition_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `userID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`userID`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`device_in_id`) REFERENCES `devices` (`device_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`device_out_id`) REFERENCES `devices` (`device_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `face_data`
--
ALTER TABLE `face_data`
  ADD CONSTRAINT `face_data_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`userID`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `face_recognition_logs`
--
ALTER TABLE `face_recognition_logs`
  ADD CONSTRAINT `face_recognition_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`userID`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
