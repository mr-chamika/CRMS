-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 26, 2025 at 12:10 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db`
--

-- --------------------------------------------------------

--
-- Table structure for table `personnel`
--

CREATE TABLE `personnel` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role_title` varchar(255) DEFAULT NULL,
  `experience_level` enum('Junior','Mid-Level','Senior') DEFAULT 'Junior',
  `status` enum('Available','Busy','On Leave') DEFAULT 'Available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `personnel`
--

INSERT INTO `personnel` (`id`, `name`, `email`, `password`, `role_title`, `experience_level`, `status`, `created_at`) VALUES
(1, 'wolverine', 'manager@test.com', '$2b$10$JDiqPOHELCSrH1bY3S4cjuKlFdcorZ.0rWIk5/KkXx59pcSxZ6gDG', 'manager', 'Senior', 'Available', '2025-12-26 03:13:11'),
(2, 'tony stark', 'tony@test.com', '$2b$10$DdU2ySHs7JlHkqmpLQ1wCOdJ1A0VrR.ktnLZ2HAg0eVRsfFilIcrm', 'Data Analyst', 'Junior', 'Available', '2025-12-26 03:14:27'),
(3, 'steve roggers', 'steve@test.com', '$2b$10$nr0JmtrFRJUcOxlPm2HU5e2dKKc1fLf2dfkLIbX2RxTbils5SMsH2', 'Database Administrator', 'Mid-Level', 'Available', '2025-12-26 03:55:42'),
(4, 'will smiths', 'will@test.com', '$2b$10$mvGBe7jc68jNhBzPlQsQH.He5wE5bMxmf3KF25MZ/0l8/zWRgPzLO', 'Business Analyst', 'Senior', 'Available', '2025-12-26 07:21:35');

-- --------------------------------------------------------

--
-- Table structure for table `personnel_skills`
--

CREATE TABLE `personnel_skills` (
  `personnel_id` int(11) NOT NULL,
  `skill_id` int(11) NOT NULL,
  `proficiency_level` int(11) DEFAULT NULL CHECK (`proficiency_level` between 1 and 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `personnel_skills`
--

INSERT INTO `personnel_skills` (`personnel_id`, `skill_id`, `proficiency_level`) VALUES
(2, 6, 1),
(2, 11, 1),
(2, 16, 1),
(2, 17, 1),
(3, 13, 3),
(3, 18, 1),
(4, 5, 3),
(4, 10, 1);

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Planning','Active','Completed') DEFAULT 'Planning'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `name`, `description`, `start_date`, `end_date`, `status`) VALUES
(1, 'pheonix', 'created at world war II', '2025-12-17', '2025-12-24', 'Planning'),
(2, 'area 51', 'asdfasdf', '2025-12-27', '2026-01-03', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `project_assignments`
--

CREATE TABLE `project_assignments` (
  `id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `personnel_id` int(11) DEFAULT NULL,
  `capacity_percentage` decimal(5,2) DEFAULT 100.00 CHECK (`capacity_percentage` between 0 and 100),
  `assigned_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `assigned_start_date` date DEFAULT NULL,
  `assigned_end_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_assignments`
--

INSERT INTO `project_assignments` (`id`, `project_id`, `personnel_id`, `capacity_percentage`, `assigned_date`, `assigned_start_date`, `assigned_end_date`) VALUES
(30, 1, 2, 100.00, '2025-12-26 07:17:46', '2025-12-17', '2025-12-24');

-- --------------------------------------------------------

--
-- Table structure for table `project_requirements`
--

CREATE TABLE `project_requirements` (
  `project_id` int(11) NOT NULL,
  `skill_id` int(11) NOT NULL,
  `min_proficiency_level` int(11) DEFAULT NULL CHECK (`min_proficiency_level` between 1 and 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_requirements`
--

INSERT INTO `project_requirements` (`project_id`, `skill_id`, `min_proficiency_level`) VALUES
(1, 11, 1),
(1, 16, 1),
(2, 15, 1),
(2, 23, 1);

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `id` int(11) NOT NULL,
  `skill_name` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skills`
--

INSERT INTO `skills` (`id`, `skill_name`, `category`, `description`) VALUES
(1, 'JavaScript', 'Programming', NULL),
(5, 'React', 'Programming', 'This is a JavaScript Library'),
(6, 'Angular', 'Frontend', NULL),
(7, 'Vue.js', 'Frontend', NULL),
(8, 'Node.js', 'Backend', NULL),
(9, 'Express.js', 'Backend', NULL),
(10, 'Django', 'Backend', NULL),
(11, 'Spring Boot', 'Backend', NULL),
(12, 'SQL', 'Database', NULL),
(13, 'MongoDB', 'Database', NULL),
(14, 'PostgreSQL', 'Database', NULL),
(15, 'MySQL', 'Database', NULL),
(16, 'HTML', 'Frontend', NULL),
(17, 'CSS', 'Frontend', NULL),
(18, 'Git', 'Tools', NULL),
(19, 'Docker', 'Tools', NULL),
(20, 'AWS', 'Cloud', NULL),
(21, 'Azure', 'Cloud', NULL),
(22, 'Linux', 'System', NULL),
(23, 'Agile', 'Methodology', NULL),
(24, 'Scrum', 'Methodology', NULL),
(387, 'Java', 'Backend', ''),
(389, 'C#', 'Programming', NULL),
(413, 'Python', 'Programming', 'an easiest object oriented language'),
(518, 'Scala', 'Programming', 'This is a Programming language');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `personnel`
--
ALTER TABLE `personnel`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `personnel_skills`
--
ALTER TABLE `personnel_skills`
  ADD PRIMARY KEY (`personnel_id`,`skill_id`),
  ADD KEY `skill_id` (`skill_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `project_assignments`
--
ALTER TABLE `project_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_personnel_project` (`project_id`,`personnel_id`),
  ADD KEY `personnel_id` (`personnel_id`);

--
-- Indexes for table `project_requirements`
--
ALTER TABLE `project_requirements`
  ADD PRIMARY KEY (`project_id`,`skill_id`),
  ADD KEY `skill_id` (`skill_id`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `skill_name` (`skill_name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `personnel`
--
ALTER TABLE `personnel`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `project_assignments`
--
ALTER TABLE `project_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=519;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `personnel_skills`
--
ALTER TABLE `personnel_skills`
  ADD CONSTRAINT `personnel_skills_ibfk_1` FOREIGN KEY (`personnel_id`) REFERENCES `personnel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `personnel_skills_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_assignments`
--
ALTER TABLE `project_assignments`
  ADD CONSTRAINT `project_assignments_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_assignments_ibfk_2` FOREIGN KEY (`personnel_id`) REFERENCES `personnel` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_requirements`
--
ALTER TABLE `project_requirements`
  ADD CONSTRAINT `project_requirements_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_requirements_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
