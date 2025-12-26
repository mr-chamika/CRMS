const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.get('/', async (req, res) => {
    try {
        const db = await getDB();
        const [rows] = await db.execute('SELECT id, name, email, role_title, experience_level, status, created_at FROM personnel');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get unique roles
router.get('/roles', async (req, res) => {
    try {
        const db = await getDB();
        const [rows] = await db.execute('SELECT DISTINCT role_title FROM personnel WHERE role_title IS NOT NULL AND role_title != "" ORDER BY role_title');
        res.json(rows.map(row => row.role_title));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single personnel by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDB();
        const [rows] = await db.execute('SELECT id, name, email, role_title, experience_level, status, created_at FROM personnel WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Personnel not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    const { name, email, role_title, experience_level, status } = req.body;
    try {
        const db = await getDB();
        const [result] = await db.execute(
            'INSERT INTO personnel (name, email, role_title, experience_level, status) VALUES (?, ?, ?, ?, ?)',
            [name, email, role_title, experience_level, status || 'Available']
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, role_title, experience_level, status } = req.body;
    try {
        const db = await getDB();
        await db.execute(
            'UPDATE personnel SET name = ?, email = ?, role_title = ?, experience_level = ?, status = ? WHERE id = ?',
            [name, email, role_title, experience_level, status, id]
        );
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDB();
        await db.execute('DELETE FROM personnel WHERE id = ?', [id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get personnel skills
router.get('/:id/skills', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDB();
        const [rows] = await db.execute(`
            SELECT ps.skill_id, ps.proficiency_level, s.skill_name, s.category, s.description
            FROM personnel_skills ps
            JOIN skills s ON ps.skill_id = s.id
            WHERE ps.personnel_id = ?
            `, [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add/Update personnel skills
router.put('/:id/skills', async (req, res) => {
    const { id } = req.params;
    const { skills } = req.body; // Array of { skill_id, proficiency_level }
    try {
        const db = await getDB();

        // Delete existing skills for this personnel
        await db.execute('DELETE FROM personnel_skills WHERE personnel_id = ?', [id]);

        // Insert new skills
        if (skills && skills.length > 0) {
            const values = skills.map(skill => [id, skill.skill_id, skill.proficiency_level]);
            const placeholders = skills.map(() => '(?, ?, ?)').join(', ');
            await db.execute(
                `INSERT INTO personnel_skills (personnel_id, skill_id, proficiency_level) VALUES ${placeholders}`,
                values.flat()
            );
        }

        res.json({ message: 'Skills updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get assigned projects for a personnel
router.get('/:id/projects', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDB();
        const [rows] = await db.execute(`
            SELECT pa.id, pa.project_id, pa.assigned_start_date as start_date, pa.assigned_end_date as end_date, 
                   pa.capacity_percentage, pa.assigned_date, p.name as project_name, p.status, p.description,
                   CASE 
                       WHEN pa.assigned_end_date IS NULL THEN 'Active'
                       WHEN pa.assigned_end_date < CURDATE() THEN 'Completed'
                       ELSE 'Active'
                   END as assignment_status
            FROM project_assignments pa
            JOIN projects p ON pa.project_id = p.id
            WHERE pa.personnel_id = ?
            ORDER BY pa.assigned_date DESC
        `, [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;