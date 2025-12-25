import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../utils/api';

function PersonnelList() {
    const [personnel, setPersonnel] = useState([]);
    const [skills, setSkills] = useState([]);
    const [form, setForm] = useState({
        name: '',
        email: '',
        role_title: '',
        experience_level: 'Junior',
        status: 'Available',
        skills: [{ skill_id: '', proficiency_level: 1 }]
    });
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        experience_level: '',
        status: ''
    });

    useEffect(() => {
        fetchPersonnel();
        fetchSkills();
    }, []);

    const fetchPersonnel = async () => {
        try {
            const response = await api.get('/personnel');
            const data = await response.json();
            setPersonnel(data);
        } catch (error) {
            console.error('Error fetching personnel:', error);
        }
    };

    const fetchSkills = async () => {
        try {
            const response = await api.get('/skills');
            setSkills(response.data);
        } catch (error) {
            console.error('Error fetching skills:', error);
        }
    };

    const fetchPersonnelSkills = async (personnelId) => {
        try {
            const response = await api.get(`/personnel/${personnelId}/skills`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching personnel skills:', error);
            return [];
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Name is required';
        if (!form.email.trim()) newErrors.email = 'Email is invalid';
        else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email is invalid';

        // Validate skills - at least one skill must be selected
        const validSkills = form.skills.filter(skill => skill.skill_id && String(skill.skill_id).trim() !== '');
        if (validSkills.length === 0) {
            newErrors.skills = 'At least one skill must be selected';
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
            case 'email':
                if (value.trim() && /\S+@\S+\.\S+/.test(value)) {
                    delete newErrors.email;
                }
                break;
            case 'skills':
                const validSkills = value.filter(skill => skill.skill_id && String(skill.skill_id).trim() !== '');
                if (validSkills.length > 0) {
                    delete newErrors.skills;
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
            const personnelData = {
                name: form.name,
                email: form.email,
                role_title: form.role_title,
                experience_level: form.experience_level,
                status: form.status
            };

            if (editing) {
                await api.put(`/personnel/${editing}`, personnelData);
                // Update skills - filter out empty skill slots
                const validSkills = form.skills.filter(skill => skill.skill_id && String(skill.skill_id).trim() !== '');
                await api.put(`/personnel/${editing}/skills`, { skills: validSkills });
                setEditing(null);
            } else {
                const response = await api.post('/personnel', personnelData);
                const personnelId = response.data.id;
                // Add skills for new personnel - filter out empty skill slots
                const validSkills = form.skills.filter(skill => skill.skill_id && skill.skill_id.trim() !== '');
                if (validSkills.length > 0) {
                    await api.put(`/personnel/${personnelId}/skills`, { skills: validSkills });
                }
            }
            setForm({
                name: '',
                email: '',
                role_title: '',
                experience_level: 'Junior',
                status: 'Available',
                skills: [{ skill_id: '', proficiency_level: 1 }]
            });
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

    const handleEdit = async (person) => {
        const personnelSkills = await fetchPersonnelSkills(person.id);
        setForm({
            name: person.name,
            email: person.email,
            role_title: person.role_title || '',
            experience_level: person.experience_level,
            status: person.status,
            skills: personnelSkills.length > 0 ? personnelSkills : [{ skill_id: '', proficiency_level: 1 }]
        });
        setEditing(person.id);
        setErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id) => {


        if (!window.confirm('Are you sure you want to delete this personnel?')) return;

        try {
            await api.delete(`/personnel/${id}`);
            fetchPersonnel();
        } catch (error) {
            console.error('Error deleting personnel:', error);
        }
    };

    // const handleAddNew = () => {
    //     setForm({
    //         name: '',
    //         email: '',
    //         role_title: '',
    //         experience_level: 'Junior',
    //         status: 'Available',
    //         skills: [{ skill_id: '', proficiency_level: 1 }]
    //     });
    //     setEditing(null);
    //     setErrors({});
    //     setShowModal(true);
    // };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditing(null);
        setForm({
            name: '',
            email: '',
            role_title: '',
            experience_level: 'Junior',
            status: 'Available',
            skills: [{ skill_id: '', proficiency_level: 1 }]
        });
        setErrors({});
    };

    const handleView = async (person) => {
        const personnelSkills = await fetchPersonnelSkills(person.id);
        setViewing({ ...person, skills: personnelSkills });
        setShowViewModal(true);
    };

    const handleCloseViewModal = () => {
        setShowViewModal(false);
        setViewing(null);
    };

    const filteredPersonnel = (personnel || []).filter(person => {
        const matchesSearch = !filters.search ||
            person.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            person.email.toLowerCase().includes(filters.search.toLowerCase()) ||
            (person.role_title && person.role_title.toLowerCase().includes(filters.search.toLowerCase()));

        const matchesExperience = !filters.experience_level || person.experience_level === filters.experience_level;
        const matchesStatus = !filters.status || person.status === filters.status;

        return matchesSearch && matchesExperience && matchesStatus;
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
            experience_level: '',
            status: ''
        });
    };

    const addSkill = () => {
        setForm({
            ...form,
            skills: [...form.skills, { skill_id: '', proficiency_level: 1 }]
        });
    };

    const updateSkill = (index, field, value) => {
        const updatedSkills = [...form.skills];
        updatedSkills[index] = { ...updatedSkills[index], [field]: value };
        setForm({ ...form, skills: updatedSkills });

        // Clear skills error if skill_id was changed and all skills are now valid
        if (field === 'skill_id') {
            clearFieldError('skills', updatedSkills);
        }
    };

    const removeSkill = (index) => {
        // Only allow removal if there are more than one skills
        if (form.skills.length > 1) {
            const updatedSkills = form.skills.filter((_, i) => i !== index);
            setForm({ ...form, skills: updatedSkills });
            // Clear skills error if all remaining skills are now valid
            clearFieldError('skills', updatedSkills);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto p-5">
            <div className="flex justify-between items-center mb-8 pb-5 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 m-0">Personnel Dashboard</h2>
                {/* <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none" onClick={handleAddNew}>
                    Add New Personnel
                </button> */}
            </div>

            <div className="flex-1 bg-white rounded-xl p-8 shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                    <h3 className="text-xl font-bold text-gray-800 m-0">Personnel List ({filteredPersonnel.length})</h3>

                    {/* Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name, email, or role..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <select
                            value={filters.experience_level}
                            onChange={(e) => handleFilterChange('experience_level', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Experience Levels</option>
                            <option value="Junior">Junior</option>
                            <option value="Mid-Level">Mid-Level</option>
                            <option value="Senior">Senior</option>
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="Available">Available</option>
                            <option value="Busy">Busy</option>
                            <option value="On Leave">On Leave</option>
                        </select>

                        {(filters.search || filters.experience_level || filters.status) && (
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
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Email</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Role</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Experience</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Status</th>
                                <th className="bg-gray-50 text-gray-700 font-semibold py-4 px-3 text-left border-b-2 border-gray-200 sticky top-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPersonnel && filteredPersonnel.length > 0 && filteredPersonnel.map((person) => (
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
                                    <td className="py-4 px-3 border-b border-gray-200 align-middle">
                                        <button onClick={() => handleView(person)} className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg text-sm mr-2 transition-colors duration-200">
                                            View
                                        </button>
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
                    {filteredPersonnel.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            {(personnel || []).length === 0 ? (
                                <p className="text-lg m-0">No personnel found.</p>
                                // <p className="text-lg m-0">No personnel found. Click "Add New Personnel" to get started.</p>
                            ) : (
                                <div>
                                    <p className="text-lg m-0 mb-2">No personnel match your filters.</p>
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
                                onChange={(e) => {
                                    setForm({ ...form, name: e.target.value });
                                    clearFieldError('name', e.target.value);
                                }}
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
                                onChange={(e) => {
                                    setForm({ ...form, email: e.target.value });
                                    clearFieldError('email', e.target.value);
                                }}
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
                    <div className="mb-4">
                        <label className="font-semibold mb-2 text-gray-700 text-sm block">Personnel Skills</label>
                        <div className="space-y-3">
                            {form.skills && form.skills.length > 0 && form.skills.map((skill, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <select
                                            value={skill.skill_id}
                                            onChange={(e) => updateSkill(index, 'skill_id', e.target.value)}
                                            className="p-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="">Select Skill</option>
                                            {skills && skills.length > 0 && skills.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.skill_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600">Level:</label>
                                        <select
                                            value={skill.proficiency_level}
                                            onChange={(e) => updateSkill(index, 'proficiency_level', parseInt(e.target.value))}
                                            className="p-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value={1}>Beginner (1)</option>
                                            <option value={2}>Intermediate (2)</option>
                                            <option value={3}>Advanced (3)</option>
                                            <option value={4}>Expert (4)</option>
                                        </select>
                                    </div>
                                    {form.skills.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(index)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Remove skill"
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
                                onClick={addSkill}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Skill
                            </button>
                        </div>
                        {errors.skills && <span className="text-red-500 text-xs mt-1 font-medium block">{errors.skills}</span>}
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

            <Modal
                isOpen={showViewModal}
                onClose={handleCloseViewModal}
                title="Personnel Details"
            >
                {viewing && (
                    <div className="space-y-3">
                        {/* Header Section with Avatar */}
                        <div className="text-center pb-4 border-b border-gray-200">
                            {/* <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                                {viewing.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div> */}
                            <h3 className="text-xl font-bold text-gray-800 mb-1">{viewing.name}</h3>
                            <p className="text-gray-600">{viewing.role_title || 'No role specified'}</p>
                        </div>

                        {/* Status and Experience Badges */}
                        <div className="flex flex-wrap gap-3 justify-center">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${viewing.status === 'Available' ? 'bg-green-100 text-green-800 border border-green-200' :
                                viewing.status === 'Busy' ? 'bg-red-100 text-red-800 border border-red-200' :
                                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                }`}>
                                <span className={`w-2 h-2 rounded-full mr-2 ${viewing.status === 'Available' ? 'bg-green-500' :
                                    viewing.status === 'Busy' ? 'bg-red-500' :
                                        'bg-yellow-500'
                                    }`}></span>
                                {viewing.status}
                            </span>
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${viewing.experience_level.toLowerCase().replace('-', '') === 'junior' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                viewing.experience_level.toLowerCase().replace('-', '') === 'midlevel' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                    'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                }`}>
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {viewing.experience_level}
                            </span>
                        </div>

                        {/* Information Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <label className="font-semibold text-blue-800 text-sm">Email Address</label>
                                </div>
                                <p className="text-gray-900 font-medium">{viewing.email}</p>
                            </div>

                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <label className="font-semibold text-green-800 text-sm">Registered At</label>
                                </div>
                                <p className="text-gray-900 font-medium">{new Date(viewing.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</p>
                            </div>
                        </div>

                        {/* Skills Section */}
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                            <div className="flex items-center mb-4">
                                <svg className="w-6 h-6 text-gray-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <h4 className="text-lg font-bold text-gray-800">Skills & Expertise</h4>
                                <span className="ml-auto bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                    {viewing.skills?.length || 0} skills
                                </span>
                            </div>

                            {viewing.skills && viewing.skills.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg bg-white">
                                    <div className="divide-y divide-gray-100">
                                        {viewing.skills && viewing.skills.length > 0 && viewing.skills.map((skill, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150">
                                                <div className="flex items-center flex-1">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center text-white font-bold text-xs mr-3">
                                                        {skill.skill_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{skill.skill_name}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="flex space-x-1 mr-3">
                                                        {[1, 2, 3, 4].map((level) => (
                                                            <div
                                                                key={level}
                                                                className={`w-2 h-2 rounded-full ${level <= skill.proficiency_level
                                                                    ? 'bg-yellow-400'
                                                                    : 'bg-gray-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm text-gray-600 font-medium">
                                                        {skill.proficiency_level}/4
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <p className="text-gray-500 font-medium">No skills assigned yet</p>
                                    <p className="text-gray-400 text-sm">Skills will appear here when added</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default PersonnelList;