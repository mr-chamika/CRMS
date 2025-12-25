-- Create database
CREATE DATABASE IF NOT EXISTS db;
USE db;

-- Table: personnel
CREATE TABLE personnel (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
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

-- Sample data
INSERT INTO personnel (name, email, role_title, experience_level, status) VALUES
('John Doe', 'john@example.com', 'Developer', 'Senior', 'Available'),
('Jane Smith', 'jane@example.com', 'Designer', 'Mid-Level', 'Busy'),
('Bob Johnson', 'bob@example.com', 'Manager', 'Senior', 'On Leave');

INSERT INTO skills (skill_name, category, description) VALUES
('JavaScript', 'Programming', 'Web development language'),
('React', 'Frontend', 'UI library'),
('Node.js', 'Backend', 'Server-side JavaScript'),
('MySQL', 'Database', 'Relational database'),
('Python', 'Programming', 'General-purpose language');

INSERT INTO personnel_skills (personnel_id, skill_id, proficiency_level) VALUES
(1, 1, 4), (1, 2, 3), (1, 3, 4), (1, 4, 3),
(2, 1, 3), (2, 2, 4),
(3, 4, 3), (3, 5, 2);

INSERT INTO projects (name, description, start_date, end_date, status) VALUES
('Web App Development', 'Build a web application', '2024-01-01', '2024-06-01', 'Active'),
('Mobile App', 'Develop mobile application', '2024-03-01', '2024-09-01', 'Planning');

INSERT INTO project_requirements (project_id, skill_id, min_proficiency_level) VALUES
(1, 1, 3), (1, 2, 3), (1, 3, 3),
(2, 1, 2), (2, 5, 2);