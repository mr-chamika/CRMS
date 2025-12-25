import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

const API_BASE = 'http://localhost:5000/api';

function PersonnelList() {
    const [personnel, setPersonnel] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', role_title: '', experience_level: 'Junior', status: 'Available' });
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchPersonnel();
    }, []);

    const fetchPersonnel = async () => {
        try {
            const response = await axios.get(`${API_BASE}/personnel`);
            setPersonnel(response.data);
        } catch (error) {
            console.error('Error fetching personnel:', error);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Name is required';
        if (!form.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email is invalid';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            if (editing) {
                await axios.put(`${API_BASE}/personnel/${editing}`, form);
                setEditing(null);
            } else {
                await axios.post(`${API_BASE}/personnel`, form);
            }
            setForm({ name: '', email: '', role_title: '', experience_level: 'Junior', status: 'Available' });
            setErrors({});
            setShowModal(false);
            fetchPersonnel();
        } catch (error) {
            console.error('Error saving personnel:', error);
            if (error.response?.data?.error) {
                setErrors({ submit: error.response.data.error });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (person) => {
        setForm(person);
        setEditing(person.id);
        setErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this personnel?')) return;

        try {
            await axios.delete(`${API_BASE}/personnel/${id}`);
            fetchPersonnel();
        } catch (error) {
            console.error('Error deleting personnel:', error);
        }
    };

    const handleAddNew = () => {
        setForm({ name: '', email: '', role_title: '', experience_level: 'Junior', status: 'Available' });
        setEditing(null);
        setErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditing(null);
        setForm({ name: '', email: '', role_title: '', experience_level: 'Junior', status: 'Available' });
        setErrors({});
    };

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto p-5">
            <div className="flex justify-between items-center mb-8 pb-5 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 m-0">Personnel Dashboard</h2>
                <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none" onClick={handleAddNew}>
                    Add New Personnel
                </button>
            </div>

            <div className="flex-1 bg-white rounded-xl p-8 shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                <h3 className="text-xl font-bold text-gray-800 mb-5">Personnel List ({personnel.length})</h3>
                <div className="overflow-auto max-h-80">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Name</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Email</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Role</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Experience</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Status</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Created</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personnel.map((person) => (
                                <tr key={person.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">{person.name}</td>
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">{person.email}</td>
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">{person.role_title || '-'}</td>
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                        <span className={`inline-block py-1 px-3 rounded-full text-xs font-semibold uppercase ${person.experience_level.toLowerCase().replace('-', '') === 'junior' ? 'bg-green-100 text-green-800' :
                                            person.experience_level.toLowerCase().replace('-', '') === 'midlevel' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-cyan-100 text-cyan-800'
                                            }`}>
                                            {person.experience_level}
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
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">{new Date(person.created_at).toLocaleDateString()}</td>
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                        <button onClick={() => handleEdit(person)} className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg text-sm mr-2 transition-colors duration-200">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(person.id)} className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-200">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {personnel.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            <p className="text-lg m-0">No personnel found. Click "Add New Personnel" to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editing ? 'Edit Personnel' : 'Add New Personnel'}
            >
                {errors.submit && <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 border border-red-200 font-medium">{errors.submit}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="flex flex-col">
                            <label htmlFor="name" className="font-semibold mb-2 text-gray-700 text-sm">Full Name *</label>
                            <input
                                id="name"
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className={`p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${errors.name ? 'border-red-500' : ''}`}
                                placeholder="Enter full name"
                                autoFocus
                            />
                            {errors.name && <span className="text-red-500 text-xs mt-1 font-medium">{errors.name}</span>}
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="email" className="font-semibold mb-2 text-gray-700 text-sm">Email Address *</label>
                            <input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className={`p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${errors.email ? 'border-red-500' : ''}`}
                                placeholder="Enter email address"
                            />
                            {errors.email && <span className="text-red-500 text-xs mt-1 font-medium">{errors.email}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                        <div className="flex flex-col">
                            <label htmlFor="role" className="font-semibold mb-2 text-gray-700 text-sm">Role Title</label>
                            <input
                                id="role"
                                type="text"
                                value={form.role_title}
                                onChange={(e) => setForm({ ...form, role_title: e.target.value })}
                                className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                placeholder="e.g., Software Engineer"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="experience" className="font-semibold mb-2 text-gray-700 text-sm">Experience Level</label>
                            <select
                                id="experience"
                                value={form.experience_level}
                                onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
                                className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                            >
                                <option value="Junior">Junior</option>
                                <option value="Mid-Level">Mid-Level</option>
                                <option value="Senior">Senior</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                        <div className="flex flex-col">
                            <label htmlFor="status" className="font-semibold mb-2 text-gray-700 text-sm">Availability Status</label>
                            <select
                                id="status"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                            >
                                <option value="Available">Available</option>
                                <option value="Busy">Busy</option>
                                <option value="On Leave">On Leave</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-3">
                        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none min-w-32 flex items-center justify-center" disabled={loading}>
                            {loading ? 'Saving...' : (editing ? 'Update Personnel' : 'Add Personnel')}
                        </button>
                        <button type="button" className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200" onClick={handleCloseModal}>
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default PersonnelList;