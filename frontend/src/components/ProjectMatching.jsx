import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function ProjectMatching() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [matching, setMatching] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get(`${API_BASE}/projects`);
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleMatch = async () => {
        if (!selectedProject) return;
        try {
            const response = await axios.get(`${API_BASE}/projects/${selectedProject}/matching`);
            setMatching(response.data);
        } catch (error) {
            console.error('Error fetching matching:', error);
        }
    };

    const getProficiencyLabel = (level) => {
        const labels = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert' };
        return labels[level] || level;
    };

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
                            {projects.map((project) => (
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
                            disabled={!selectedProject}
                        >
                            Find Matching Personnel
                        </button>
                    </div>
                </div>

                {matching && (
                    <div className="flex-1 grid gap-8 overflow-hidden min-h-0">
                        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 flex flex-col">
                            <h3 className="text-xl font-bold text-gray-800 mb-5">Matching Results</h3>
                            <div className="mb-5 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                                <p className="m-0">Found <strong>{matching.personnel.length}</strong> matching personnel for this project.</p>
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
                                            <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Utilization</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matching.personnel.map((person) => (
                                            <tr key={person.id} className="hover:bg-gray-50">
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">{person.name}</td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">{person.email}</td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">{person.role_title || '-'}</td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                                    <div className="flex flex-wrap gap-2">
                                                        {person.skills.split(',').map((skill, index) => {
                                                            const [name, level] = skill.split(':');
                                                            return (
                                                                <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-300">
                                                                    {name}: {getProficiencyLabel(parseInt(level))}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                                    <span className={`font-bold py-1 px-3 rounded text-sm ${person.match_score >= 80 ? 'bg-green-100 text-green-800' :
                                                        person.match_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {person.match_score}%
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                                    <span className={`font-semibold ${person.utilization_warning ? 'text-yellow-600' : 'text-green-600'
                                                        }`}>
                                                        {person.utilization_warning ? '⚠️ Warning' : '✅ Available'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {matching.personnel.length === 0 && (
                                    <div className="text-center py-16 text-gray-500">
                                        <p className="text-lg mb-2">No personnel match the requirements for this project.</p>
                                        <p className="text-sm">Try adjusting project requirements or adding personnel with matching skills.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 flex flex-col">
                            <h3 className="text-xl font-bold text-gray-800 mb-5">Project Requirements</h3>
                            <div className="grid gap-3">
                                {matching.requirements.map((req, index) => (
                                    <div key={index} className="p-4 bg-gray-50 border-l-4 border-green-500 rounded-lg text-sm">
                                        <strong>{req.skill_name}</strong>: {getProficiencyLabel(req.min_proficiency_level)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProjectMatching;