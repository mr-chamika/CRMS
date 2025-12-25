const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getDB } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

// Signup route
router.post('/signup', async (req, res) => {
    const { name, email, password, role_title, experience_level, status, skills } = req.body;

    try {
        const db = await getDB();

        // Check if user already exists
        const [existingUser] = await db.execute(
            'SELECT id FROM personnel WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const [result] = await db.execute(
            'INSERT INTO personnel (name, email, password, role_title, experience_level, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role_title, experience_level || 'Junior', status || 'Available']
        );

        const userId = result.insertId;

        // Insert skills if provided
        if (skills && skills.length > 0) {
            const skillValues = skills
                .filter(skill => skill.skill_id && skill.skill_id !== '')
                .map(skill => [userId, parseInt(skill.skill_id), parseInt(skill.proficiency_level) || 1]);

            if (skillValues.length > 0) {
                const placeholders = skillValues.map(() => '(?, ?, ?)').join(', ');
                const flattenedValues = skillValues.flat();

                await db.execute(
                    `INSERT INTO personnel_skills (personnel_id, skill_id, proficiency_level) VALUES ${placeholders}`,
                    flattenedValues
                );
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: userId, email, role: role_title },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: userId,
                name,
                email,
                role_title,
                experience_level: experience_level || 'Junior',
                status: status || 'Available'
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const db = await getDB();

        // Find user
        const [users] = await db.execute(
            'SELECT id, name, email, password, role_title, experience_level, status FROM personnel WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role_title },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        delete user.password;

        res.json({
            message: 'Login successful',
            token,
            user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token middleware (can be used for protected routes)
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Export both router and middleware
module.exports = { router, verifyToken };