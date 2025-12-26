const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();
const { getDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let db;
async function connectDB() {
    try {
        db = await getDB();
        console.log('Connected to MySQL database');
        await initializeDatabase();
    } catch (error) {
        console.error('Database connection failed / not exists:', error);
        process.exit(1);
    }
}

async function initializeDatabase() {
    try {
        // Create tables if they don't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS personnel (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255),
                role_title VARCHAR(255),
                experience_level ENUM('Junior', 'Mid-Level', 'Senior') DEFAULT 'Junior',
                status ENUM('Available', 'Busy', 'On Leave') DEFAULT 'Available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS skills (
                id INT PRIMARY KEY AUTO_INCREMENT,
                skill_name VARCHAR(255) NOT NULL UNIQUE,
                category VARCHAR(255),
                description TEXT
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS personnel_skills (
                personnel_id INT,
                skill_id INT,
                proficiency_level INT CHECK (proficiency_level BETWEEN 1 AND 4),
                PRIMARY KEY (personnel_id, skill_id),
                FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE,
                FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS projects (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                status ENUM('Planning', 'Active', 'Completed') DEFAULT 'Planning'
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS project_requirements (
                project_id INT,
                skill_id INT,
                min_proficiency_level INT CHECK (min_proficiency_level BETWEEN 1 AND 4),
                PRIMARY KEY (project_id, skill_id),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS project_assignments (
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
            )
        `);

        // Add date columns if they don't exist (for existing databases)
        try {
            await db.execute(`
                ALTER TABLE project_assignments
                ADD COLUMN IF NOT EXISTS assigned_start_date DATE,
                ADD COLUMN IF NOT EXISTS assigned_end_date DATE
            `);
        } catch (error) {
            // Columns might already exist, ignore error
            console.log('Date columns check completed');
        }

        // Insert default skills if not exists
        await db.execute(`
            INSERT IGNORE INTO skills (skill_name, category) VALUES
            ('JavaScript', 'Programming'),
            ('Python', 'Programming'),
            ('Java', 'Programming'),
            ('C#', 'Programming'),
            ('React', 'Frontend'),
            ('Angular', 'Frontend'),
            ('Vue.js', 'Frontend'),
            ('Node.js', 'Backend'),
            ('Express.js', 'Backend'),
            ('Django', 'Backend'),
            ('Spring Boot', 'Backend'),
            ('SQL', 'Database'),
            ('MongoDB', 'Database'),
            ('PostgreSQL', 'Database'),
            ('MySQL', 'Database'),
            ('HTML', 'Frontend'),
            ('CSS', 'Frontend'),
            ('Git', 'Tools'),
            ('Docker', 'Tools'),
            ('AWS', 'Cloud'),
            ('Azure', 'Cloud'),
            ('Linux', 'System'),
            ('Agile', 'Methodology'),
            ('Scrum', 'Methodology')
        `);

        console.log('Database tables initialized');

        // Clean up duplicate assignments (keep only one assignment per personnel)
        await cleanupDuplicateAssignments();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

async function cleanupDuplicateAssignments() {
    try {
        // For each personnel with multiple assignments, keep only the most recent one
        const [duplicates] = await db.execute(`
            SELECT personnel_id, COUNT(*) as count
            FROM project_assignments 
            GROUP BY personnel_id 
            HAVING count > 1
        `);

        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} personnel with multiple assignments. Cleaning up...`);

            for (const dup of duplicates) {
                // Keep the most recent assignment, delete others
                await db.execute(`
                    DELETE pa FROM project_assignments pa
                    INNER JOIN (
                        SELECT personnel_id, MAX(assigned_date) as max_date
                        FROM project_assignments 
                        WHERE personnel_id = ?
                    ) keep ON pa.personnel_id = keep.personnel_id AND pa.assigned_date < keep.max_date
                    WHERE pa.personnel_id = ?
                `, [dup.personnel_id, dup.personnel_id]);
            }

            console.log('Duplicate assignments cleaned up');
        }
    } catch (error) {
        console.error('Error cleaning up duplicate assignments:', error);
    }
}

// Routes
const { router: authRouter, verifyToken } = require('./controllers/auth');
app.use('/api/auth', authRouter);
app.use('/api/personnel', require('./controllers/personnel'));
app.use('/api/skills', require('./controllers/skills'));
app.use('/api/projects', require('./controllers/projects'));

// Make verifyToken available globally for other controllers
global.verifyToken = verifyToken;

// Start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});