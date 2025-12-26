-- Create database
CREATE DATABASE IF NOT EXISTS db;
USE db;

-- Table: personnel
CREATE TABLE personnel (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role_title VARCHAR(255),
    experience_level ENUM('Junior', 'Mid-Level', 'Senior') DEFAULT 'Junior',
    status ENUM('Available', 'Busy', 'On Leave') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: skills
CREATE TABLE skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    skill_name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(255),
    description TEXT
);

-- Table: personnel_skills
CREATE TABLE personnel_skills (
    personnel_id INT,
    skill_id INT,
    proficiency_level INT CHECK (proficiency_level BETWEEN 1 AND 4),
    PRIMARY KEY (personnel_id, skill_id),
    FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Table: projects
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('Planning', 'Active', 'Completed') DEFAULT 'Planning'
);

-- Table: project_requirements
CREATE TABLE project_requirements (
    project_id INT,
    skill_id INT,
    min_proficiency_level INT CHECK (min_proficiency_level BETWEEN 1 AND 4),
    PRIMARY KEY (project_id, skill_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Table: project_assignments
CREATE TABLE project_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    personnel_id INT,
    capacity_percentage DECIMAL(5,2) DEFAULT 100 CHECK (capacity_percentage BETWEEN 0 AND 100),
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_start_date DATE,
    assigned_end_date DATE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE,
    UNIQUE KEY unique_personnel_project (project_id, personnel_id)
);

