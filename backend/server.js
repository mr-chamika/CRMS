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

        // Add password column to existing table if it doesn't exist
        try {
            await db.execute(`ALTER TABLE personnel ADD COLUMN IF NOT EXISTS password VARCHAR(255)`);
        } catch (error) {
            // Column might already exist, ignore error
            console.log('Password column check/alter completed');
        }

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
                capacity_percentage INT DEFAULT 100 CHECK (capacity_percentage BETWEEN 0 AND 100),
                assigned_date DATE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE
            )
        `);

        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
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