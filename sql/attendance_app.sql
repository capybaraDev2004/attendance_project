-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 11, 2025 at 05:17 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `attendance_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `work_date` date NOT NULL,
  `check_in` timestamp NOT NULL DEFAULT current_timestamp(),
  `check_out` timestamp NULL DEFAULT NULL,
  `device_in_id` int(11) DEFAULT NULL,
  `device_out_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `user_id`, `work_date`, `check_in`, `check_out`, `device_in_id`, `device_out_id`, `created_at`, `updated_at`) VALUES
(66, 3, '2025-09-06', '2025-09-06 01:04:58', '2025-09-06 11:07:38', 1, 1, '2025-09-06 16:04:58', '2025-09-07 13:21:58'),
(74, 3, '2025-09-20', '2025-09-20 12:50:34', '2025-09-20 12:50:43', 1, 1, '2025-09-20 12:50:34', '2025-09-20 12:50:43'),
(78, 3, '2025-09-24', '2025-09-24 14:17:38', '2025-09-24 14:17:52', 1, 1, '2025-09-24 14:17:38', '2025-09-24 14:17:52'),
(80, 3, '2025-09-25', '2025-09-25 01:00:00', '2025-09-25 11:51:58', 1, 1, '2025-09-25 11:51:13', '2025-09-25 11:51:58'),
(83, 3, '2025-10-08', '2025-10-08 08:40:18', '2025-10-08 08:42:59', 1, 1, '2025-10-08 08:40:18', '2025-10-08 08:42:59');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_records`
--

CREATE TABLE `attendance_records` (
  `recordID` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `work_date` date NOT NULL,
  `total_hours` decimal(5,2) DEFAULT 0.00,
  `standard_hours` decimal(5,2) DEFAULT 8.00,
  `overtime_hours` decimal(5,2) DEFAULT 0.00,
  `work_unit` decimal(4,2) DEFAULT 0.00,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance_records`
--

INSERT INTO `attendance_records` (`recordID`, `userID`, `work_date`, `total_hours`, `standard_hours`, `overtime_hours`, `work_unit`, `note`, `created_at`, `updated_at`) VALUES
(1, 3, '2025-09-06', 9.05, 8.00, 0.55, 1.00, NULL, '2025-09-24 13:58:06', '2025-09-25 11:55:59'),
(2, 3, '2025-09-20', 0.00, 8.00, 0.00, 0.00, NULL, '2025-09-24 13:58:06', '2025-09-24 13:58:06'),
(4, 3, '2025-09-24', 0.00, 8.00, 0.00, 0.00, NULL, '2025-09-24 14:17:52', '2025-09-24 14:17:52'),
(6, 3, '2025-09-25', 9.87, 8.00, 1.37, 1.00, NULL, '2025-09-25 11:51:58', '2025-09-25 11:51:58'),
(9, 3, '2025-10-08', 0.00, 8.00, 0.00, 0.00, NULL, '2025-10-08 08:42:59', '2025-10-08 08:42:59');

-- --------------------------------------------------------

--
-- Table structure for table `devices`
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

--
-- Dumping data for table `devices`
--

INSERT INTO `devices` (`device_id`, `device_code`, `device_name`, `location`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'face_recognition', 'Face Recognition System', 'Web Application', 1, '2025-09-05 05:48:57', '2025-10-08 07:57:20'),
(3, 'rfid-chm-cng-1758902288757', 'RFID chấm công', 'Văn phòng chính', 1, '2025-09-26 15:58:08', '2025-09-26 15:58:08');

-- --------------------------------------------------------

--
-- Table structure for table `face_data`
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
-- Dumping data for table `face_data`
--

INSERT INTO `face_data` (`face_id`, `user_id`, `face_encoding`, `face_image_path`, `created_at`, `updated_at`, `is_active`) VALUES
(1, 1, '', 'assets/image/1_quandoggy.jpg', '2025-08-19 06:47:06', '2025-08-19 06:47:06', 1);

-- --------------------------------------------------------

--
-- Table structure for table `face_recognition_logs`
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
-- Table structure for table `face_recognition_settings`
--

CREATE TABLE `face_recognition_settings` (
  `setting_id` int(11) NOT NULL,
  `setting_name` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `face_recognition_settings`
--

INSERT INTO `face_recognition_settings` (`setting_id`, `setting_name`, `setting_value`, `description`, `updated_at`) VALUES
(1, 'min_confidence', '0.7', 'Ngưỡng tin cậy tối thiểu để nhận diện khuôn mặt', '2025-08-19 06:47:06'),
(2, 'max_faces', '10', 'Số lượng khuôn mặt tối đa có thể nhận diện cùng lúc', '2025-08-19 06:47:06'),
(3, 'recognition_model', 'face-api.js', 'Mô hình nhận diện khuôn mặt sử dụng', '2025-08-19 06:47:06'),
(4, 'camera_resolution', '640x480', 'Độ phân giải camera mặc định', '2025-08-19 06:47:06');

-- --------------------------------------------------------

--
-- Table structure for table `positions`
--

CREATE TABLE `positions` (
  `ID` int(11) NOT NULL,
  `Title` varchar(100) DEFAULT NULL,
  `Code` varchar(50) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `Department` varchar(50) DEFAULT NULL,
  `Level` varchar(50) DEFAULT NULL,
  `EmployeeCount` int(11) DEFAULT NULL,
  `SalaryMin` decimal(15,0) DEFAULT NULL,
  `SalaryMax` decimal(15,0) DEFAULT NULL,
  `Status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `positions`
--

INSERT INTO `positions` (`ID`, `Title`, `Code`, `Description`, `Department`, `Level`, `EmployeeCount`, `SalaryMin`, `SalaryMax`, `Status`, `created_at`, `updated_at`) VALUES
(1, 'Giám đốc điều hành', 'CEO', 'Lãnh đạo và điều hành toàn bộ hoạt động của công ty', 'Ban lãnh đạo', 'Senior Level', 1, 50000000, 100000000, '1', '2025-09-07 12:19:21', '2025-09-07 12:24:02'),
(2, 'Trưởng phòng kỹ thuật', 'TECH_LEAD', 'Quản lý và phát triển đội ngũ kỹ thuật, dự án công nghệ', 'Kỹ thuật', 'Mid Level', 3, 25000000, 40000000, '1', '2025-09-07 12:19:21', '2025-09-07 12:19:21'),
(3, 'Lập trình viên Senior', 'SENIOR_DEV', 'Phát triển phần mềm, hướng dẫn junior developers', 'Kỹ thuật', 'Mid Level', 8, 18000000, 30000000, '1', '2025-09-07 12:19:21', '2025-09-07 12:19:21'),
(4, 'Lập trình viên Junior', 'JUNIOR_DEV', 'Phát triển phần mềm dưới sự hướng dẫn của senior', 'Kỹ thuật', 'Entry Level', 15, 12000000, 18000000, '1', '2025-09-07 12:19:21', '2025-09-07 12:19:21'),
(5, 'Chuyên viên nhân sự', 'HR_SPEC', 'Quản lý tuyển dụng, đào tạo và phát triển nhân viên', 'Nhân sự', 'Entry Level', 4, 15000000, 22000000, '1', '2025-09-07 12:19:21', '2025-09-07 12:19:21'),
(6, 'Nhân viên kinh doanh', 'SALES_REP', 'Tìm kiếm khách hàng, tư vấn và bán sản phẩm', 'Kinh doanh', 'Entry Level', 3, 10000000, 20000000, '1', '2025-09-07 12:19:21', '2025-09-07 12:32:24');

-- --------------------------------------------------------

--
-- Table structure for table `rfid`
--

CREATE TABLE `rfid` (
  `rfid_uid` varchar(50) NOT NULL,
  `userID` int(11) DEFAULT NULL,
  `cardStatus` enum('active','inactive','lost','blocked') NOT NULL DEFAULT 'inactive'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rfid`
--

INSERT INTO `rfid` (`rfid_uid`, `userID`, `cardStatus`) VALUES
('12421421', 2, 'active'),
('12421421421421412', 12, 'active');

-- --------------------------------------------------------

--
-- Table structure for table `shifts`
--

CREATE TABLE `shifts` (
  `shift_id` int(11) NOT NULL,
  `shift_name` varchar(100) NOT NULL COMMENT 'Tên ca làm việc (VD: Ca sáng, Ca chiều, Ca đêm)',
  `start_time` time NOT NULL COMMENT 'Giờ bắt đầu ca làm việc',
  `end_time` time NOT NULL COMMENT 'Giờ kết thúc ca làm việc',
  `break_duration` int(11) DEFAULT 0 COMMENT 'Thời gian nghỉ giữa ca (phút)',
  `description` text DEFAULT NULL COMMENT 'Mô tả chi tiết về ca làm việc',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Trạng thái hoạt động của ca',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Bảng quản lý ca làm việc';

--
-- Dumping data for table `shifts`
--

INSERT INTO `shifts` (`shift_id`, `shift_name`, `start_time`, `end_time`, `break_duration`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Ca hành chính', '08:00:00', '17:30:00', 60, '', 1, '2025-09-06 16:41:43', '2025-10-08 15:17:00');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userID` int(11) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `userName` varchar(50) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `role` enum('admin','employee') NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `salaryRank` double NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userID`, `fullName`, `userName`, `password`, `address`, `role`, `email`, `phone`, `dateOfBirth`, `gender`, `position`, `salaryRank`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Vũ Minh Quân', 'quandoggy', '123456', 'chuồng heo', 'employee', 'quanngu@gmail.com', '0123456789', '2004-03-16', 'female', 'Nhân viên kinh doanh', 10000000, 'active', '2025-08-19 16:16:22', '2025-10-08 07:20:59'),
(2, 'Capybara', 'capybara', '123456', 'Từ Sơn - Bắc Ninh', 'admin', 'capybaradev2004@gmail.com', '0352135115', '0000-00-00', 'male', 'Giám đốc điều hành', 100000000, 'active', '2025-08-19 16:16:22', '2025-10-08 14:51:26'),
(3, 'Nguyễn Tiến Toán', 'toan', '123456', 'Hà Nội', 'employee', 'nguyentientoan28022004@gmail.com', '0342822004', '1990-01-15', 'male', 'Lập trình viên Junior', 100000000, 'active', '2025-08-20 07:05:48', '2025-10-08 08:02:54'),
(4, 'Đào Văn Tâm', 'tam', '123456', 'Vĩnh Phú', 'employee', 'thib@example.com', '0922222222', '1992-05-20', 'female', 'Chuyên viên nhân sự', 25000000, 'active', '2025-08-20 07:05:48', '2025-10-08 07:21:12'),
(5, 'Bùi Xuân Lộc', 'loc', '123456', 'Đà Nẵng', 'employee', 'vanc@example.com', '0933333333', '1995-03-10', 'female', 'Lập trình viên Junior', 10000000, 'active', '2025-08-20 07:05:48', '2025-10-08 15:14:19'),
(6, 'Phạm Thị D', NULL, '', 'Cần Thơ', 'employee', 'thid@example.com', '0944444444', '1993-07-25', 'female', 'Giám đốc điều hành', 10000000, 'inactive', '2025-08-20 07:05:48', '2025-10-08 15:03:34'),
(7, 'Hoàng Văn E', NULL, '', 'Hải Phòng', 'employee', 'vane@example.com', '0955555555', '1991-09-12', 'male', 'Giám đốc điều hành', 10000000, 'active', '2025-08-20 07:05:48', '2025-10-08 15:03:32'),
(8, 'Vũ Thị F', NULL, '', 'Nha Trang', 'employee', 'thif@example.com', '0966666666', '1996-11-02', 'female', 'Chuyên viên nhân sự', 10000000, 'active', '2025-08-20 07:05:48', '2025-10-08 15:03:30'),
(9, 'Đặng Văn G', NULL, '', 'Bắc Ninh', 'employee', 'vang@example.com', '0977777777', '1989-12-30', 'male', 'Chuyên viên nhân sự', 10000000, 'active', '2025-08-20 07:05:48', '2025-10-08 15:03:29'),
(10, 'Ngô Thị H', NULL, '', 'Thanh Hóa', 'employee', 'thih@example.com', '0988888888', '1994-04-18', 'female', 'Lập trình viên Junior', 10000000, 'inactive', '2025-08-20 07:05:48', '2025-10-08 15:03:27'),
(11, 'Phan Văn I', NULL, '', 'Huế', 'employee', 'vani@example.com', '0999999999', '1997-06-22', 'male', 'Chuyên viên nhân sự', 10000000, 'active', '2025-08-20 07:05:48', '2025-10-08 15:03:18'),
(12, 'Bùi Thị J', '', '', 'Quảng Ninh', 'employee', 'thij@example.com', '0900000000', '1998-08-08', 'female', 'Lập trình viên Junior', 10000000, 'active', '2025-08-20 07:05:48', '2025-10-08 15:02:19');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD UNIQUE KEY `uniq_att_user_date` (`user_id`,`work_date`),
  ADD KEY `idx_att_user_date` (`user_id`,`work_date`),
  ADD KEY `idx_att_date` (`work_date`),
  ADD KEY `attendance_ibfk_2` (`device_in_id`),
  ADD KEY `attendance_ibfk_3` (`device_out_id`);

--
-- Indexes for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD PRIMARY KEY (`recordID`),
  ADD KEY `fk_attendance_user` (`userID`);

--
-- Indexes for table `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`device_id`),
  ADD UNIQUE KEY `device_code` (`device_code`),
  ADD KEY `idx_device_active` (`is_active`);

--
-- Indexes for table `face_data`
--
ALTER TABLE `face_data`
  ADD PRIMARY KEY (`face_id`),
  ADD KEY `idx_face_data_user_id` (`user_id`),
  ADD KEY `idx_face_data_active` (`is_active`);

--
-- Indexes for table `face_recognition_logs`
--
ALTER TABLE `face_recognition_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_recognition_logs_user_id` (`user_id`),
  ADD KEY `idx_recognition_logs_date` (`recognized_at`);

--
-- Indexes for table `face_recognition_settings`
--
ALTER TABLE `face_recognition_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `setting_name` (`setting_name`),
  ADD KEY `idx_settings_name` (`setting_name`);

--
-- Indexes for table `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `rfid`
--
ALTER TABLE `rfid`
  ADD PRIMARY KEY (`rfid_uid`),
  ADD KEY `fk_user` (`userID`);

--
-- Indexes for table `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`shift_id`),
  ADD UNIQUE KEY `unique_shift_name` (`shift_name`),
  ADD KEY `idx_shift_active` (`is_active`),
  ADD KEY `idx_shift_times` (`start_time`,`end_time`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userID`),
  ADD UNIQUE KEY `userName` (`userName`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT for table `attendance_records`
--
ALTER TABLE `attendance_records`
  MODIFY `recordID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `devices`
--
ALTER TABLE `devices`
  MODIFY `device_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `face_data`
--
ALTER TABLE `face_data`
  MODIFY `face_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `face_recognition_logs`
--
ALTER TABLE `face_recognition_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `face_recognition_settings`
--
ALTER TABLE `face_recognition_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `positions`
--
ALTER TABLE `positions`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `shifts`
--
ALTER TABLE `shifts`
  MODIFY `shift_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `userID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`userID`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`device_in_id`) REFERENCES `devices` (`device_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`device_out_id`) REFERENCES `devices` (`device_id`) ON DELETE SET NULL;

--
-- Constraints for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD CONSTRAINT `fk_attendance_user` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`);

--
-- Constraints for table `face_data`
--
ALTER TABLE `face_data`
  ADD CONSTRAINT `face_data_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`userID`) ON DELETE CASCADE;

--
-- Constraints for table `face_recognition_logs`
--
ALTER TABLE `face_recognition_logs`
  ADD CONSTRAINT `face_recognition_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`userID`) ON DELETE SET NULL;

--
-- Constraints for table `rfid`
--
ALTER TABLE `rfid`
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
