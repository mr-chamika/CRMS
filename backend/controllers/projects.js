const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.get('/', async (req, res) => {
    try {
        const db = await getDB();
        const [rows] = await db.execute('SELECT * FROM projects');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    const { name, description, start_date, end_date, status } = req.body;
    try {
        const db = await getDB();
        const [result] = await db.execute(
            'INSERT INTO projects (name, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
            [name, description, start_date, end_date, status]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, start_date, end_date, status } = req.body;
    try {
        const db = await getDB();
        await db.execute(
            'UPDATE projects SET name = ?, description = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?',
            [name, description, start_date, end_date, status, id]
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
        await db.execute('DELETE FROM projects WHERE id = ?', [id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id/matching', async (req, res) => {
    const projectId = req.params.id;
    try {
        const db = await getDB();

        const [requirements] = await db.execute(`
      SELECT pr.skill_id, pr.min_proficiency_level, s.skill_name
      FROM project_requirements pr
      JOIN skills s ON pr.skill_id = s.id
      WHERE pr.project_id = ?
    `, [projectId]);

        const [allPersonnel] = await db.execute(`
      SELECT p.id, p.name, p.email, p.role_title, p.experience_level, p.status,
             COALESCE(GROUP_CONCAT(CONCAT(s.skill_name, ':', ps.proficiency_level)), '') as skills
      FROM personnel p
      LEFT JOIN personnel_skills ps ON p.id = ps.personnel_id
      LEFT JOIN skills s ON ps.skill_id = s.id
      GROUP BY p.id
    `);

        const personnel = allPersonnel.map(person => {
            const skillsStr = person.skills || '';
            if (!skillsStr || requirements.length === 0) {
                return {
                    ...person,
                    skills: skillsStr,
                    match_score: 0,
                    matched_skills: 0,
                    total_required_skills: requirements.length,
                    utilization_warning: false
                };
            }

            const personSkills = {};
            skillsStr.split(',').filter(skill => skill.trim()).forEach(skillStr => {
                const [name, level] = skillStr.split(':');
                if (name && level) {
                    personSkills[name.trim()] = parseInt(level);
                }
            });

            let matchedSkills = 0;
            requirements.forEach(req => {
                if (personSkills[req.skill_name] >= req.min_proficiency_level) {
                    matchedSkills++;
                }
            });

            const matchScore = requirements.length > 0 ? Math.round((matchedSkills / requirements.length) * 100) : 0;

            return {
                ...person,
                skills: skillsStr,
                match_score: matchScore,
                matched_skills: matchedSkills,
                total_required_skills: requirements.length,
                utilization_warning: false
            };
        });

        personnel.sort((a, b) => b.match_score - a.match_score);

        res.json({ personnel, requirements });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get project requirements
router.get('/:id/requirements', async (req, res) => {
    const projectId = req.params.id;
    try {
        const db = await getDB();
        const [requirements] = await db.execute(`
            SELECT pr.skill_id, pr.min_proficiency_level, s.skill_name
            FROM project_requirements pr
            JOIN skills s ON pr.skill_id = s.id
            WHERE pr.project_id = ?
        `, [projectId]);
        res.json(requirements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update project requirements
router.put('/:id/requirements', async (req, res) => {
    const projectId = req.params.id;
    const { requirements } = req.body;
    try {
        const db = await getDB();

        // Delete existing requirements
        await db.execute('DELETE FROM project_requirements WHERE project_id = ?', [projectId]);

        // Insert new requirements
        if (requirements && requirements.length > 0) {
            const values = requirements.map(req => `(${projectId}, ${req.skill_id}, ${req.min_proficiency_level})`).join(', ');
            await db.execute(`INSERT INTO project_requirements (project_id, skill_id, min_proficiency_level) VALUES ${values}`);
        }

        res.json({ message: 'Requirements updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add project requirements (for new projects)
router.post('/:id/requirements', async (req, res) => {
    const projectId = req.params.id;
    const { requirements } = req.body;
    try {
        const db = await getDB();

        if (requirements && requirements.length > 0) {
            const values = requirements.map(req => `(${projectId}, ${req.skill_id}, ${req.min_proficiency_level})`).join(', ');
            await db.execute(`INSERT INTO project_requirements (project_id, skill_id, min_proficiency_level) VALUES ${values}`);
        }

        res.json({ message: 'Requirements added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;