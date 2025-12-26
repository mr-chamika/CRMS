const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// Helper function to calculate utilization and update status
async function updatePersonnelStatus(db, personnelId) {
    // Calculate utilization based on assigned days in the next 90 days
    const [utilizationResult] = await db.execute(`
        SELECT 
            LEAST(
                ROUND(
                    (COALESCE(SUM(
                        LEAST(DATEDIFF(LEAST(assigned_end_date, DATE_ADD(CURDATE(), INTERVAL 90 DAY)), CURDATE()) - 
                               GREATEST(assigned_start_date, CURDATE()), 0) + 1
                    ), 0) / 90) * 100
                ), 100
            ) as utilization_percentage
        FROM project_assignments 
        WHERE personnel_id = ? 
        AND assigned_end_date >= CURDATE()
        AND assigned_start_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
    `, [personnelId]);

    const utilization = utilizationResult[0]?.utilization_percentage || 0;

    // Set status based on utilization
    let newStatus = 'Available';
    if (utilization >= 80) {
        newStatus = 'Critical'; // Over-utilized
    } else if (utilization >= 50) {
        newStatus = 'Busy'; // Moderately utilized
    }
    // else remains 'Available' for < 50% utilization

    await db.execute(
        'UPDATE personnel SET status = ? WHERE id = ?',
        [newStatus, personnelId]
    );

    return { utilization, status: newStatus };
}

router.get('/', async (req, res) => {
    try {
        const db = await getDB();
        const [rows] = await db.execute('SELECT * FROM projects');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDB();

        // Get project details
        const [projectRows] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
        if (projectRows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const project = projectRows[0];

        // Get project requirements
        const [requirements] = await db.execute(`
            SELECT pr.skill_id, pr.min_proficiency_level, s.skill_name
            FROM project_requirements pr
            JOIN skills s ON pr.skill_id = s.id
            WHERE pr.project_id = ?
        `, [id]);

        // Get assigned personnel
        const [assignments] = await db.execute(`
            SELECT pa.personnel_id, p.name, p.role_title, pa.assigned_start_date, pa.assigned_end_date, pa.capacity_percentage
            FROM project_assignments pa
            JOIN personnel p ON pa.personnel_id = p.id
            WHERE pa.project_id = ?
        `, [id]);

        res.json({
            ...project,
            requirements,
            assigned_personnel: assignments
        });
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

        // Get current project data to check if dates changed
        const [currentProject] = await db.execute(
            'SELECT start_date, end_date FROM projects WHERE id = ?',
            [id]
        );

        if (currentProject.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Update the project
        await db.execute(
            'UPDATE projects SET name = ?, description = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?',
            [name, description, start_date, end_date, status, id]
        );

        // If project dates changed, update all assignments for this project
        const currentStartDate = currentProject[0].start_date?.toISOString().split('T')[0];
        const currentEndDate = currentProject[0].end_date?.toISOString().split('T')[0];
        const newStartDate = start_date;
        const newEndDate = end_date;

        if (currentStartDate !== newStartDate || currentEndDate !== newEndDate) {
            await db.execute(
                'UPDATE project_assignments SET assigned_start_date = ?, assigned_end_date = ? WHERE project_id = ?',
                [newStartDate, newEndDate, id]
            );
        }

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

        // Get project dates for overlap checking
        const [project] = await db.execute(
            'SELECT start_date, end_date FROM projects WHERE id = ?',
            [projectId]
        );

        if (project.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const projectStartDate = project[0].start_date;
        const projectEndDate = project[0].end_date;

        const [requirements] = await db.execute(`
      SELECT pr.skill_id, pr.min_proficiency_level, s.skill_name
      FROM project_requirements pr
      JOIN skills s ON pr.skill_id = s.id
      WHERE pr.project_id = ?
    `, [projectId]);

        const [allPersonnel] = await db.execute(`
      SELECT p.id, p.name, p.email, p.role_title, p.experience_level, p.status,
             COALESCE(GROUP_CONCAT(CONCAT(s.skill_name, ':', ps.proficiency_level)), '') as skills,
             COALESCE(assigned_days, 0) as assigned_days,
             LEAST(ROUND((COALESCE(assigned_days, 0) / 90) * 100), 100) as utilization_percentage,
             CASE WHEN EXISTS(
               SELECT 1 FROM project_assignments pa2
               WHERE pa2.personnel_id = p.id
               AND pa2.project_id = ?
             ) THEN 1 ELSE 0 END as is_assigned_to_project,
             CASE WHEN EXISTS(
               SELECT 1 FROM project_assignments pa3
               WHERE pa3.personnel_id = p.id
               AND pa3.project_id != ?
               AND pa3.assigned_end_date >= ?
               AND pa3.assigned_start_date <= ?
             ) THEN 1 ELSE 0 END as has_date_overlap
      FROM personnel p
      LEFT JOIN personnel_skills ps ON p.id = ps.personnel_id
      LEFT JOIN skills s ON ps.skill_id = s.id
      LEFT JOIN (
          SELECT
              personnel_id,
              SUM(
                  LEAST(DATEDIFF(LEAST(assigned_end_date, DATE_ADD(CURDATE(), INTERVAL 90 DAY)), GREATEST(assigned_start_date, CURDATE())) + 1,
                        DATEDIFF(assigned_end_date, assigned_start_date) + 1)
              ) as assigned_days
          FROM project_assignments
          WHERE assigned_end_date >= CURDATE() AND assigned_start_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
          GROUP BY personnel_id
      ) u ON p.id = u.personnel_id
      GROUP BY p.id
    `, [projectId, projectId, projectStartDate, projectEndDate]);

        const personnel = allPersonnel.map(person => {
            const skillsStr = person.skills || '';
            if (!skillsStr || requirements.length === 0) {
                return {
                    ...person,
                    skills: skillsStr,
                    match_score: 0,
                    matched_skills: 0,
                    total_required_skills: requirements.length,
                    utilization_warning: false,
                    is_assigned_to_project: person.is_assigned_to_project
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

            // Calculate utilization warning based on current workload
            const currentUtilization = parseFloat(person.utilization_percentage) || 0;
            let utilization_warning = false;
            let utilization_level = 'low';

            if (currentUtilization >= 90) {
                utilization_warning = true;
                utilization_level = 'critical';
            } else if (currentUtilization >= 75) {
                utilization_warning = true;
                utilization_level = 'high';
            } else if (currentUtilization >= 50) {
                utilization_level = 'medium';
            }

            return {
                ...person,
                skills: skillsStr,
                match_score: matchScore,
                matched_skills: matchedSkills,
                total_required_skills: requirements.length,
                utilization_warning,
                utilization_level,
                currentUtilization,
                is_assigned_to_project: person.is_assigned_to_project,
                has_date_overlap: person.has_date_overlap
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

// Assign personnel to project
router.post('/:projectId/assign/:personnelId', async (req, res) => {
    const { projectId, personnelId } = req.params;
    const { capacity_percentage, assigned_start_date, assigned_end_date } = req.body;

    try {
        const db = await getDB();

        // Check if assignment already exists
        const [existing] = await db.execute(
            'SELECT * FROM project_assignments WHERE project_id = ? AND personnel_id = ?',
            [projectId, personnelId]
        );

        if (existing.length > 0) {
            // Release existing assignment
            await db.execute(
                'DELETE FROM project_assignments WHERE project_id = ? AND personnel_id = ?',
                [projectId, personnelId]
            );

            // Update status based on remaining utilization
            await updatePersonnelStatus(db, personnelId);

            return res.json({ message: 'Personnel released from project successfully' });
        }

        // Get project dates to use as assignment defaults
        const [project] = await db.execute(
            'SELECT start_date, end_date FROM projects WHERE id = ?',
            [projectId]
        );

        if (project.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Use project dates as assignment defaults, or provided dates
        const startDate = assigned_start_date || project[0].start_date || new Date().toISOString().split('T')[0];
        const endDate = assigned_end_date || project[0].end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // fallback to 1 week

        // Check for date overlaps with existing assignments
        const [overlaps] = await db.execute(`
            SELECT COUNT(*) as overlap_count
            FROM project_assignments pa
            WHERE pa.personnel_id = ?
            AND pa.project_id != ?
            AND pa.assigned_end_date >= ?
            AND pa.assigned_start_date <= ?
        `, [personnelId, projectId, startDate, endDate]);

        if (overlaps[0].overlap_count > 0) {
            return res.status(400).json({ error: 'Personnel already assigned to overlapping project dates' });
        }

        // Create assignment
        await db.execute(
            'INSERT INTO project_assignments (project_id, personnel_id, capacity_percentage, assigned_start_date, assigned_end_date) VALUES (?, ?, ?, ?, ?)',
            [projectId, personnelId, capacity_percentage || 100, startDate, endDate]
        );

        // Update personnel status based on new utilization
        const statusInfo = await updatePersonnelStatus(db, personnelId);

        res.json({
            message: 'Personnel assigned successfully',
            utilization: statusInfo.utilization,
            status: statusInfo.status
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Unassign personnel from project
router.delete('/:projectId/assign/:personnelId', async (req, res) => {
    const { projectId, personnelId } = req.params;

    try {
        const db = await getDB();

        await db.execute(
            'DELETE FROM project_assignments WHERE project_id = ? AND personnel_id = ?',
            [projectId, personnelId]
        );

        // Update status based on remaining utilization
        const statusInfo = await updatePersonnelStatus(db, personnelId);

        res.json({
            message: 'Personnel unassigned successfully',
            utilization: statusInfo.utilization,
            status: statusInfo.status
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;