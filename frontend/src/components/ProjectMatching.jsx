import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function ProjectMatching() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [matching, setMatching] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [assigning, setAssigning] = useState(null);
    const [filters, setFilters] = useState({
        name: '',
        role: '',
        status: '',
        minMatchScore: '',
        maxUtilization: '',
        skillFilter: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [skills, setSkills] = useState([]);

    const roles = [
        'Software Engineer',
        'Project Manager',
        'UI/UX Designer',
        'Data Analyst',
        'DevOps Engineer',
        'QA Engineer',
        'Business Analyst',
        'Product Manager',
        'System Administrator',
        'Database Administrator'
    ];

    useEffect(() => {
        fetchProjects();
        fetchSkills();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            const data = await response.json();
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        }
    };

    const fetchSkills = async () => {
        try {
            const response = await api.get('/skills');
            const data = await response.json();
            setSkills(data || []);
        } catch (error) {
            console.error('Error fetching skills:', error);
            setSkills([]);
        }
    };

    const handleMatch = async () => {
        if (!selectedProject) return;

        setLoading(true);
        setError('');
        setMatching(null);

        try {
            const response = await api.get(`/projects/${selectedProject}/matching`);
            const data = await response.json();
            setMatching(data || { personnel: [], requirements: [] });
        } catch (error) {
            console.error('Error fetching matching:', error);
            setError('Failed to fetch matching results. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (personnelId, personnelName) => {
        if (!selectedProject) return;

        const isAssigned = matching?.personnel?.find(p => p.id === personnelId)?.is_assigned_to_project;
        const actionText = isAssigned ? 'release' : 'assign';

        const confirmMessage = `Are you sure you want to ${actionText} ${personnelName} ${isAssigned ? 'from' : 'to'} this project?`;
        const confirmAssign = window.confirm(confirmMessage);
        if (!confirmAssign) return;

        setAssigning(personnelId);

        try {
            const response = await api.post(`/projects/${selectedProject}/assign/${personnelId}`, {
                capacity_percentage: 100 // Default to 100% capacity
            });

            if (response.ok) {
                const actionPast = isAssigned ? 'released' : 'assigned';
                alert(`${personnelName} has been ${actionPast} ${isAssigned ? 'from' : 'to'} the project successfully!`);
                // Refresh the matching data to show updated status
                await handleMatch();
            } else {
                const errorData = await response.json();
                alert(`Failed to ${actionText} personnel: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error assigning personnel:', error);
            alert(`Failed to ${actionText} personnel. Please try again.`);
        } finally {
            setAssigning(null);
        }
    };

    const getProficiencyLabel = (level) => {
        const labels = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert' };
        return labels[level] || level;
    };

    const filteredPersonnel = React.useMemo(() => {
        if (!matching?.personnel) return [];

        const filtered = matching.personnel.filter(person => {
            // Name filter
            if (filters.name && !person.name.toLowerCase().includes(filters.name.toLowerCase())) {
                return false;
            }

            // Role filter
            if (filters.role && !person.role_title?.toLowerCase().includes(filters.role.toLowerCase())) {
                return false;
            }

            // Status filter
            if (filters.status && person.status !== filters.status) {
                return false;
            }

            // Minimum match score filter
            if (filters.minMatchScore && (person.match_score || 0) < parseInt(filters.minMatchScore)) {
                return false;
            }

            // Maximum utilization filter
            if (filters.maxUtilization && (person.currentUtilization || 0) > parseInt(filters.maxUtilization)) {
                return false;
            }

            // Skill filter
            if (filters.skillFilter) {
                const personSkills = person.skills ? person.skills.split(',').map(skill => skill.split(':')[0].trim()) : [];
                if (!personSkills.some(skill => skill === filters.skillFilter)) {
                    return false;
                }
            }

            return true;
        });

        // Sort to put assigned employees first
        return filtered.sort((a, b) => {
            const aAssigned = a.is_assigned_to_project ? 1 : 0;
            const bAssigned = b.is_assigned_to_project ? 1 : 0;
            return bAssigned - aAssigned; // Assigned employees (1) come before unassigned (0)
        });
    }, [matching?.personnel, filters]);

    const clearFilters = () => {
        setFilters({
            name: '',
            role: '',
            status: '',
            minMatchScore: '',
            maxUtilization: '',
            skillFilter: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== '');

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto p-5">
            <div className="flex justify-between items-center mb-8 pb-5 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 m-0">Project Matching</h2>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col gap-8">
                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 flex-shrink-0">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Select Project for Matching</h3>
                    <div className="flex flex-col mb-4">
                        <label htmlFor="project-select" className="font-semibold mb-2 text-gray-700 text-sm">Choose a project to find matching personnel:</label>
                        <select
                            id="project-select"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="w-full p-3 border-2 border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                        >
                            <option value="">Select a project...</option>
                            {projects && projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name} - {project.status}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3 mt-3">
                        <button
                            onClick={handleMatch}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none min-w-32 flex items-center justify-center"
                            disabled={!selectedProject || loading}
                        >
                            {loading ? 'Finding...' : 'Find Matching Personnel'}
                        </button>
                    </div>
                    {error && <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 font-medium">{error}</div>}
                </div>

                {matching && (
                    <div className="flex-1 grid gap-8 overflow-hidden min-h-0">
                        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 flex flex-col">
                            <h3 className="text-xl font-bold text-gray-800 mb-5">Project Requirements</h3>
                            <div className="flex flex-row gap-3 overflow-x-auto">
                                {matching.requirements && matching.requirements.map((req, index) => (
                                    <div key={index} className="p-4 bg-gray-50 border-l-4 border-green-500 rounded-lg text-sm flex-shrink-0">
                                        <strong>{req.skill_name}</strong>: {getProficiencyLabel(req.min_proficiency_level)}
                                    </div>
                                ))}
                                {(!matching.requirements || matching.requirements.length === 0) && (
                                    <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded-lg text-sm text-gray-500">
                                        No specific requirements set for this project.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 flex flex-col">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-xl font-bold text-gray-800 m-0">Matching Results</h3>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:shadow-lg text-sm"
                                >
                                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </button>
                            </div>

                            {showFilters && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={filters.name}
                                                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                                                placeholder="Filter by name..."
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <select
                                                value={filters.role}
                                                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Roles</option>
                                                {roles.map((role, index) => (
                                                    <option key={index} value={role}>
                                                        {role}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <select
                                                value={filters.status}
                                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="Available">Available</option>
                                                <option value="Busy">Busy</option>
                                                <option value="On Leave">On Leave</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Match Score (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={filters.minMatchScore}
                                                onChange={(e) => setFilters({ ...filters, minMatchScore: e.target.value })}
                                                placeholder="e.g., 70"
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Utilization (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={filters.maxUtilization}
                                                onChange={(e) => setFilters({ ...filters, maxUtilization: e.target.value })}
                                                placeholder="e.g., 80"
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                                            <select
                                                value={filters.skillFilter}
                                                onChange={(e) => setFilters({ ...filters, skillFilter: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Skills</option>
                                                {skills.map((skill) => (
                                                    <option key={skill.id} value={skill.skill_name}>
                                                        {skill.skill_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <button
                                            onClick={clearFilters}
                                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:shadow-lg text-sm"
                                            disabled={!hasActiveFilters}
                                        >
                                            Clear Filters
                                        </button>
                                        <div className="text-sm text-gray-600">
                                            {hasActiveFilters && `${filteredPersonnel.length} of ${matching?.personnel?.length || 0} results shown`}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mb-5 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                                <p className="m-0">Found <strong>{filteredPersonnel.length}</strong> personnel evaluated for this project.</p>
                            </div>

                            <div className="overflow-auto max-h-96">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr>
                                            <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Name</th>
                                            <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Email</th>
                                            <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Role</th>
                                            <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Skills Match</th>
                                            <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Match Score</th>
                                            <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Status</th>
                                            <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Utilization</th>
                                            <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPersonnel.map((person) => (
                                            <tr key={person.id} className={`hover:bg-gray-50 ${person.is_assigned_to_project ? 'bg-green-50' : ''}`}>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">{person.name}</td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">{person.email}</td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">{person.role_title || '-'}</td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                                    <div className="flex flex-col gap-1">
                                                        {person.skills && person.skills.split(',').filter(skill => skill.trim()).map((skill, index) => {
                                                            const [name, level] = skill.split(':');
                                                            return (
                                                                <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-300 inline-block">
                                                                    {name}: {getProficiencyLabel(parseInt(level))}
                                                                </span>
                                                            );
                                                        })}
                                                        {(!person.skills || !person.skills.split(',').filter(skill => skill.trim()).length) && (
                                                            <span className="text-gray-500 text-xs">No skills</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                                    <span className={`font-bold py-1 px-3 rounded text-sm ${(person.match_score || 0) >= 80 ? 'bg-green-100 text-green-800' :
                                                        (person.match_score || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {person.match_score || 0}%
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                                    <span className={`inline-block py-1 px-3 rounded-full text-xs font-semibold uppercase ${person.status === 'Available' ? 'bg-green-100 text-green-800' :
                                                        person.status === 'Busy' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {person.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`font-bold py-1 px-3 rounded text-sm ${(person.utilization_level || 'low') === 'critical' ? 'bg-red-100 text-red-800 border border-red-300' :
                                                            (person.utilization_level || 'low') === 'high' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                                                                (person.utilization_level || 'low') === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                                                                    'bg-green-100 text-green-800 border border-green-300'
                                                            }`}>
                                                            {person.currentUtilization || 0}%
                                                        </span>
                                                        {person.utilization_warning && (
                                                            <span className="text-xs text-red-600 font-medium">⚠️ Overloaded</span>
                                                        )}

                                                    </div>
                                                </td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                                    <button
                                                        onClick={() => handleAssign(person.id, person.name)}
                                                        disabled={assigning === person.id || (!person.is_assigned_to_project && ((person.currentUtilization || 0) >= 80 || person.has_date_overlap))}
                                                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${person.is_assigned_to_project
                                                            ? 'bg-red-500 hover:bg-red-600 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                                                            : ((person.currentUtilization || 0) < 80 && !person.has_date_overlap)
                                                                ? 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        {assigning === person.id
                                                            ? 'Processing...'
                                                            : person.is_assigned_to_project
                                                                ? 'Release'
                                                                : person.has_date_overlap
                                                                    ? 'Date Conflict'
                                                                    : (person.currentUtilization || 0) >= 80
                                                                        ? 'Overloaded'
                                                                        : 'Assign'
                                                        }
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredPersonnel.length === 0 && (
                                    <div className="text-center py-16 text-gray-500">
                                        <p className="text-lg mb-2">No personnel match the current filters.</p>
                                        <p className="text-sm">Try adjusting your filter criteria or clear filters to see all results.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProjectMatching;