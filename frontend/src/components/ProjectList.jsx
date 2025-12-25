import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

const API_BASE = 'http://localhost:5000/api';

function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [skills, setSkills] = useState([]);
    const [form, setForm] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'Planning',
        requirements: [] // Array of { skill_id, min_proficiency_level }
    });
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: ''
    });

    useEffect(() => {
        fetchProjects();
        fetchSkills();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get(`${API_BASE}/projects`);
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchSkills = async () => {
        try {
            const response = await axios.get(`${API_BASE}/skills`);
            setSkills(response.data);
        } catch (error) {
            console.error('Error fetching skills:', error);
        }
    };

    const fetchProjectRequirements = async (projectId) => {
        try {
            const response = await axios.get(`${API_BASE}/projects/${projectId}/requirements`);
            return response.data;
        } catch (error) {
            console.error('Error fetching project requirements:', error);
            return [];
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Project name is required';
        if (!form.start_date) newErrors.start_date = 'Start date is required';
        if (!form.end_date) newErrors.end_date = 'End date is required';

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for comparison

        if (form.start_date && !editing) { // Only validate for new projects
            const startDate = new Date(form.start_date);
            if (startDate < today) {
                newErrors.start_date = 'Start date cannot be in the past';
            }
        }

        if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
            newErrors.end_date = 'End date must be after start date';
        }

        // Validate requirements - all must have skills selected
        const invalidRequirements = form.requirements.filter(req => !req.skill_id);
        if (invalidRequirements.length > 0) {
            newErrors.requirements = 'All requirements must have a skill selected';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const clearFieldError = (fieldName, value) => {
        const newErrors = { ...errors };

        switch (fieldName) {
            case 'name':
                if (value.trim()) {
                    delete newErrors.name;
                }
                break;
            case 'start_date':
                if (value) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const startDate = new Date(value);

                    if (editing || startDate >= today) {
                        delete newErrors.start_date;
                        // Also clear end_date error if the relationship is now valid
                        if (form.end_date && new Date(value) <= new Date(form.end_date)) {
                            delete newErrors.end_date;
                        }
                    }
                }
                break;
            case 'end_date':
                if (value && form.start_date && new Date(form.start_date) <= new Date(value)) {
                    delete newErrors.end_date;
                }
                break;
            case 'requirements':
                const invalidRequirements = value.filter(req => !req.skill_id);
                if (invalidRequirements.length === 0) {
                    delete newErrors.requirements;
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const projectData = {
                name: form.name,
                description: form.description,
                start_date: form.start_date,
                end_date: form.end_date,
                status: form.status
            };

            if (editing) {
                await axios.put(`${API_BASE}/projects/${editing}`, projectData);
                // Update requirements
                await axios.put(`${API_BASE}/projects/${editing}/requirements`, { requirements: form.requirements });
                setEditing(null);
            } else {
                const response = await axios.post(`${API_BASE}/projects`, projectData);
                const projectId = response.data.id;
                // Add requirements for new project
                if (form.requirements.length > 0) {
                    await axios.post(`${API_BASE}/projects/${projectId}/requirements`, { requirements: form.requirements });
                }
            }
            setForm({
                name: '',
                description: '',
                start_date: '',
                end_date: '',
                status: 'Planning',
                requirements: [{ skill_id: '', min_proficiency_level: 1 }]
            });
            setErrors({});
            setShowModal(false);
            fetchProjects();
        } catch (error) {
            console.error('Error saving project:', error);
            if (error.response?.data?.error) {
                setErrors({ submit: error.response.data.error });
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = !filters.search ||
            project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            (project.description && project.description.toLowerCase().includes(filters.search.toLowerCase()));

        const matchesStatus = !filters.status || project.status === filters.status;

        return matchesSearch && matchesStatus;
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            status: ''
        });
    };

    const handleView = async (project) => {
        const requirements = await fetchProjectRequirements(project.id);
        setViewing({ ...project, requirements });
        setShowViewModal(true);
    };

    const handleCloseViewModal = () => {
        setShowViewModal(false);
        setViewing(null);
    };

    const handleEdit = async (project) => {
        const requirements = await fetchProjectRequirements(project.id);
        setForm({
            name: project.name,
            description: project.description || '',
            start_date: project.start_date ? project.start_date.split('T')[0] : '',
            end_date: project.end_date ? project.end_date.split('T')[0] : '',
            status: project.status,
            requirements: requirements.length > 0 ? requirements : [{ skill_id: '', min_proficiency_level: 1 }]
        });
        setEditing(project.id);
        setErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;

        try {
            await axios.delete(`${API_BASE}/projects/${id}`);
            fetchProjects();
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const handleAddNew = () => {
        setForm({
            name: '',
            description: '',
            start_date: '',
            end_date: '',
            status: 'Planning',
            requirements: [{ skill_id: '', min_proficiency_level: 1 }]
        });
        setEditing(null);
        setErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditing(null);
        setForm({
            name: '',
            description: '',
            start_date: '',
            end_date: '',
            status: 'Planning',
            requirements: [{ skill_id: '', min_proficiency_level: 1 }]
        });
        setErrors({});
    };

    const addRequirement = () => {
        setForm({
            ...form,
            requirements: [...form.requirements, { skill_id: '', min_proficiency_level: 1 }]
        });
    };

    const updateRequirement = (index, field, value) => {
        const updatedRequirements = [...form.requirements];
        updatedRequirements[index] = { ...updatedRequirements[index], [field]: value };
        const newRequirements = [...updatedRequirements];
        setForm({ ...form, requirements: newRequirements });

        // Clear requirements error if skill_id was changed and all requirements are now valid
        if (field === 'skill_id') {
            clearFieldError('requirements', newRequirements);
        }
    };

    const removeRequirement = (index) => {
        // Only allow removal if there are more than one requirements
        if (form.requirements.length > 1) {
            const updatedRequirements = form.requirements.filter((_, i) => i !== index);
            setForm({ ...form, requirements: updatedRequirements });
            // Clear requirements error if all remaining requirements are now valid
            clearFieldError('requirements', updatedRequirements);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto p-5">
            <div className="flex justify-between items-center mb-8 pb-5 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 m-0">Project Dashboard</h2>
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                    onClick={handleAddNew}
                >
                    Add New Project
                </button>
            </div>

            <div className="flex-1 bg-white rounded-xl p-8 shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                    <h3 className="text-xl font-bold text-gray-800 m-0">Project List ({filteredProjects.length})</h3>

                    {/* Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name or description..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="Planning">Planning</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                        </select>

                        {(filters.search || filters.status) && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-auto max-h-80">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Name</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Description</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Start Date</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">End Date</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Status</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map((project) => (
                                <tr key={project.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle font-medium">{project.name}</td>
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle truncate max-w-xs">{project.description || '-'}</td>
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                        {project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                        <span className={`inline-block py-1 px-3 rounded-full text-xs font-semibold uppercase ${project.status === 'Planning' ? 'bg-yellow-100 text-yellow-800' :
                                            project.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                            {project.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                        <button onClick={() => handleView(project)} className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg text-sm mr-2 transition-colors duration-200">
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleEdit(project)}
                                            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg text-sm mr-2 transition-colors duration-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(project.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-200"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProjects.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            {projects.length === 0 ? (
                                <p className="text-lg m-0">No projects found. Click "Add New Project" to get started.</p>
                            ) : (
                                <div>
                                    <p className="text-lg m-0 mb-2">No projects match your filters.</p>
                                    <p className="text-sm text-gray-400">Try adjusting your search criteria or clearing the filters.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editing ? 'Edit Project' : 'Add New Project'}
            >
                {errors.submit && <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 border border-red-200 font-medium">{errors.submit}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col">
                            <label htmlFor="name" className="font-semibold mb-2 text-gray-700 text-sm">Project Name *</label>
                            <input
                                id="name"
                                type="text"
                                value={form.name}
                                onChange={(e) => {
                                    setForm({ ...form, name: e.target.value });
                                    clearFieldError('name', e.target.value);
                                }}
                                className={`p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${errors.name ? 'border-red-500' : ''}`}
                                placeholder="Enter project name"
                                autoFocus
                            />
                            {errors.name && <span className="text-red-500 text-xs mt-1 font-medium">{errors.name}</span>}
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="status" className="font-semibold mb-2 text-gray-700 text-sm">Status</label>
                            <select
                                id="status"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                            >
                                <option value="Planning">Planning</option>
                                <option value="Active">Active</option>
                                {editing && <option value="Completed">Completed</option>}
                            </select>
                        </div>
                    </div>
                    <div className="mb-5">
                        <label htmlFor="description" className="font-semibold mb-2 text-gray-700 text-sm block">Description</label>
                        <textarea
                            id="description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 resize-vertical"
                            placeholder="Enter project description"
                            rows="3"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="flex flex-col">
                            <label htmlFor="start_date" className="font-semibold mb-2 text-gray-700 text-sm">Start Date *</label>
                            <input
                                id="start_date"
                                type="date"
                                value={form.start_date}
                                onChange={(e) => {
                                    setForm({ ...form, start_date: e.target.value });
                                    clearFieldError('start_date', e.target.value);
                                }}
                                min={!editing ? new Date().toISOString().split('T')[0] : undefined}
                                className={`p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${errors.start_date ? 'border-red-500' : ''}`}
                            />
                            {errors.start_date && <span className="text-red-500 text-xs mt-1 font-medium">{errors.start_date}</span>}
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="end_date" className="font-semibold mb-2 text-gray-700 text-sm">End Date *</label>
                            <input
                                id="end_date"
                                type="date"
                                value={form.end_date}
                                onChange={(e) => {
                                    setForm({ ...form, end_date: e.target.value });
                                    clearFieldError('end_date', e.target.value);
                                }}
                                min={form.start_date || new Date().toISOString().split('T')[0]}
                                className={`p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${errors.end_date ? 'border-red-500' : ''}`}
                            />
                            {errors.end_date && <span className="text-red-500 text-xs mt-1 font-medium">{errors.end_date}</span>}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="font-semibold mb-2 text-gray-700 text-sm block">Project Requirements</label>
                        <div className="space-y-3">
                            {form.requirements.map((req, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <select
                                            value={req.skill_id}
                                            onChange={(e) => updateRequirement(index, 'skill_id', e.target.value)}
                                            className="p-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="">Select Skill</option>
                                            {skills.map((skill) => (
                                                <option key={skill.id} value={skill.id}>
                                                    {skill.skill_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600">Min Level:</label>
                                        <select
                                            value={req.min_proficiency_level}
                                            onChange={(e) => updateRequirement(index, 'min_proficiency_level', parseInt(e.target.value))}
                                            className="p-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value={1}>Beginner (1)</option>
                                            <option value={2}>Intermediate (2)</option>
                                            <option value={3}>Advanced (3)</option>
                                            <option value={4}>Expert (4)</option>
                                        </select>
                                    </div>
                                    {form.requirements.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRequirement(index)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Remove requirement"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addRequirement}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Requirement
                            </button>
                        </div>
                        {errors.requirements && <span className="text-red-500 text-xs mt-1 font-medium block">{errors.requirements}</span>}
                    </div>
                    <div className="flex gap-3 mt-3">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none min-w-32 flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (editing ? 'Update Project' : 'Add Project')}
                        </button>
                        <button
                            type="button"
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                            onClick={handleCloseModal}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showViewModal}
                onClose={handleCloseViewModal}
                title="Project Details"
            >
                {viewing && (
                    <div className="space-y-6">
                        {/* Header Section with Project Name */}
                        <div className="text-center pb-4 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">{viewing.name}</h3>
                            <div className="max-h-24 overflow-y-auto px-2">
                                <p className="text-gray-600 text-sm leading-relaxed text-justify">
                                    {viewing.description || 'No description provided'}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex justify-center">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${viewing.status === 'Planning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                viewing.status === 'Active' ? 'bg-green-100 text-green-800 border border-green-200' :
                                    'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                <span className={`w-2 h-2 rounded-full mr-2 ${viewing.status === 'Planning' ? 'bg-yellow-500' :
                                    viewing.status === 'Active' ? 'bg-green-500' :
                                        'bg-blue-500'
                                    }`}></span>
                                {viewing.status}
                            </span>
                        </div>

                        {/* Project Information Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <label className="font-semibold text-blue-800 text-sm">Start Date</label>
                                </div>
                                <p className="text-gray-900 font-medium">
                                    {viewing.start_date ? new Date(viewing.start_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : 'Not set'}
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <label className="font-semibold text-green-800 text-sm">End Date</label>
                                </div>
                                <p className="text-gray-900 font-medium">
                                    {viewing.end_date ? new Date(viewing.end_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : 'Not set'}
                                </p>
                            </div>
                        </div>

                        {/* Requirements Section */}
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                            <div className="flex items-center mb-4">
                                <svg className="w-6 h-6 text-gray-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <h4 className="text-lg font-bold text-gray-800">Skill Requirements</h4>
                                <span className="ml-auto bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                    {viewing.requirements?.length || 0} requirements
                                </span>
                            </div>

                            {viewing.requirements && viewing.requirements.length > 0 ? (
                                <div className="max-h-36 overflow-y-auto">
                                    <div className="grid gap-3">
                                        {viewing.requirements.map((requirement, index) => (
                                            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center flex-1">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                                                            {requirement.skill_name?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h5 className="font-semibold text-gray-900 text-sm">{requirement.skill_name || 'Unknown Skill'}</h5>
                                                            <div className="flex items-center mt-1 flex-row justify-between">
                                                                <div className="flex space-x-1 mr-3">
                                                                    {[1, 2, 3, 4].map((level) => (
                                                                        <div
                                                                            key={level}
                                                                            className={`w-2 h-2 rounded-full ${level <= requirement.min_proficiency_level
                                                                                ? 'bg-yellow-400'
                                                                                : 'bg-gray-300'
                                                                                }`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="text-xs text-gray-600 font-medium">
                                                                    Min Level {requirement.min_proficiency_level}/4
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <p className="text-gray-500 font-medium">No skill requirements specified</p>
                                    <p className="text-gray-400 text-sm">Requirements will appear here when added</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default ProjectList;