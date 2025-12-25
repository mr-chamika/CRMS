const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.get('/', async (req, res) => {
    try {
        const db = await getDB();
        const [rows] = await db.execute('SELECT * FROM skills');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    const { skill_name, category, description } = req.body;
    try {
        const db = await getDB();
        const [result] = await db.execute(
            'INSERT INTO skills (skill_name, category, description) VALUES (?, ?, ?)',
            [skill_name, category, description]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { skill_name, category, description } = req.body;
    try {
        const db = await getDB();
        await db.execute(
            'UPDATE skills SET skill_name = ?, category = ?, description = ? WHERE id = ?',
            [skill_name, category, description, id]
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
        await db.execute('DELETE FROM skills WHERE id = ?', [id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;