import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

const API_BASE = 'http://localhost:5000/api';

function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'Planning'
    });
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showModal, setShowModal] = useState(false);

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
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            if (editing) {
                await axios.put(`${API_BASE}/projects/${editing}`, form);
                setEditing(null);
            } else {
                await axios.post(`${API_BASE}/projects`, form);
            }
            setForm({
                name: '',
                description: '',
                start_date: '',
                end_date: '',
                status: 'Planning'
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

    const handleEdit = (project) => {
        setForm({
            name: project.name,
            description: project.description || '',
            start_date: project.start_date ? project.start_date.split('T')[0] : '',
            end_date: project.end_date ? project.end_date.split('T')[0] : '',
            status: project.status
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
            status: 'Planning'
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
            status: 'Planning'
        });
        setErrors({});
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
                <h3 className="text-xl font-bold text-gray-800 mb-5">Project List ({projects.length})</h3>
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
                            {projects.map((project) => (
                                <tr key={project.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle font-medium">{project.name}</td>
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">{project.description || '-'}</td>
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
                    {projects.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            <p className="text-lg m-0">No projects found. Click "Add New Project" to get started.</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="flex flex-col">
                            <label htmlFor="name" className="font-semibold mb-2 text-gray-700 text-sm">Project Name *</label>
                            <input
                                id="name"
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="flex flex-col">
                            <label htmlFor="start_date" className="font-semibold mb-2 text-gray-700 text-sm">Start Date *</label>
                            <input
                                id="start_date"
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
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
                                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                min={form.start_date || new Date().toISOString().split('T')[0]}
                                className={`p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${errors.end_date ? 'border-red-500' : ''}`}
                            />
                            {errors.end_date && <span className="text-red-500 text-xs mt-1 font-medium">{errors.end_date}</span>}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="font-semibold mb-2 text-gray-700 text-sm block">Description</label>
                        <textarea
                            id="description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 w-full"
                            placeholder="Enter project description"
                            rows="4"
                        />
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
        </div>
    );
}

export default ProjectList;