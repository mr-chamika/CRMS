import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import api from '../utils/api';

function SkillsManagement() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, skill: null });
    const [categoryDeleteModalState, setCategoryDeleteModalState] = useState({ isOpen: false, skill: null });
    const [formData, setFormData] = useState({
        skill_name: '',
        category: '',
        description: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const response = await api.get('/skills');
            const data = await response.json();
            setSkills(data);
        } catch (error) {
            console.error('Error fetching skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        try {
            await api.post('/skills', formData);
            setShowAddModal(false);
            setFormData({ skill_name: '', category: '', description: '' });
            fetchSkills();
        } catch (error) {
            console.error('Error adding skill:', error);
        }
    };

    const handleEditSkill = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/skills/${selectedSkill.id}`, formData);
            setShowEditModal(false);
            setSelectedSkill(null);
            setFormData({ skill_name: '', category: '', description: '' });
            fetchSkills();
        } catch (error) {
            console.error('Error updating skill:', error);
        }
    };

    const handleDeleteSkill = (skill) => {
        const skillsInCategory = skills.filter(s => s.category === skill.category);
        if (skillsInCategory.length === 1) {
            setCategoryDeleteModalState({ isOpen: true, skill: skill });
        } else {
            setDeleteModalState({ isOpen: true, skill: skill });
        }
    };

    const confirmDeleteCategory = () => {
        setCategoryDeleteModalState({ isOpen: false, skill: null });
        setDeleteModalState({ isOpen: true, skill: categoryDeleteModalState.skill });
    };

    const confirmDeleteSkill = async () => {
        if (deleteModalState.skill) {
            try {
                await api.delete(`/skills/${deleteModalState.skill.id}`);
                fetchSkills();
                setDeleteModalState({ isOpen: false, skill: null });
            } catch (error) {
                console.error('Error deleting skill:', error);
            }
        }
    };

    const openEditModal = (skill) => {
        setSelectedSkill(skill);
        setFormData({
            skill_name: skill.skill_name,
            category: skill.category,
            description: skill.description
        });
        setShowEditModal(true);
    };

    const filteredSkills = skills.filter(skill => {
        const matchesSearch = skill.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            skill.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || skill.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(skills.map(skill => skill.category))];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-xl">Loading skills...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Skills Management</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                    Add New Skill
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Skills</label>
                        <input
                            type="text"
                            placeholder="Search by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Skills Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSkills.length > 0 ? (
                        filteredSkills.map((skill) => (
                            <div key={skill.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">{skill.skill_name}</h3>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${skill.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                                        skill.category === 'Soft Skills' ? 'bg-green-100 text-green-800' :
                                            skill.category === 'Domain' ? 'bg-purple-100 text-purple-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {skill.category}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-4 line-clamp-3">{skill.description}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(skill)}
                                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSkill(skill)}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <p className="text-gray-500 text-lg font-medium">No skills found</p>
                                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Skill Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setFormData({ skill_name: '', category: '', description: '' });
                }}
                title="Add New Skill"
            >
                <form onSubmit={handleAddSkill}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Skill Name *</label>
                            <input
                                type="text"
                                value={formData.skill_name}
                                onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter skill name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                                <option value="Technical">Technical</option>
                                <option value="Soft Skills">Soft Skills</option>
                                <option value="Domain">Domain</option>
                                <option value="Tools">Tools</option>
                                <option value="Languages">Languages</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                                placeholder="Enter skill description"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                        >
                            Add Skill
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddModal(false);
                                setFormData({ skill_name: '', category: '', description: '' });
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Skill Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedSkill(null);
                    setFormData({ skill_name: '', category: '', description: '' });
                }}
                title="Edit Skill"
            >
                <form onSubmit={handleEditSkill}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Skill Name *</label>
                            <input
                                type="text"
                                value={formData.skill_name}
                                onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter skill name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                                placeholder="Enter skill description"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                        >
                            Update Skill
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditModal(false);
                                setSelectedSkill(null);
                                setFormData({ skill_name: '', category: '', description: '' });
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => {
                    setDeleteModalState({ isOpen: false, skill: null });
                }}
                onConfirm={confirmDeleteSkill}
                title="Delete Skill"
                message={`Are you sure you want to delete "${deleteModalState.skill?.skill_name}"? This action cannot be undone.`}
                confirmText="Delete Skill"
                cancelText="Cancel"
            />

            {/* Category Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={categoryDeleteModalState.isOpen}
                onClose={() => {
                    setCategoryDeleteModalState({ isOpen: false, skill: null });
                }}
                onConfirm={confirmDeleteCategory}
                title="Delete Category"
                message={`"${categoryDeleteModalState.skill?.skill_name}" is the only skill in this category. Deleting it will remove the category. Do you want to proceed?`}
                confirmText="Delete Skill & Category"
                cancelText="Cancel"
            />
        </div>
    );
}

export default SkillsManagement;