import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../utils/api';

function EmployeeDashboard({ user }) {
    const [profile, setProfile] = useState(null);
    const [assignedProjects, setAssignedProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role_title: '',
        experience_level: 'Junior',
        status: 'Available'
    });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchAssignedProjects();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get(`/personnel/${user.id}`);
            const data = await response.json();
            setProfile(data);
            setFormData({
                name: data.name,
                email: data.email,
                role_title: data.role_title || '',
                experience_level: data.experience_level,
                status: data.status
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchAssignedProjects = async () => {
        try {
            const response = await api.get(`/personnel/${user.id}/projects`);
            const data = await response.json();
            setAssignedProjects(data);
        } catch (error) {
            console.error('Error fetching assigned projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/personnel/${user.id}`, formData);
            setProfile({ ...profile, ...formData });
            setEditing(false);
            setShowModal(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return 'bg-green-100 text-green-800';
            case 'Busy': return 'bg-red-100 text-red-800';
            case 'On Leave': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    console.log(profile)

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto p-5">
            <div className="flex justify-between items-center mb-8 pb-5 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 m-0">Employee Dashboard</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                    Update Profile
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                {/* Profile Section */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">My Profile</h3>
                    {profile && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                    {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800">{profile.name}</h4>
                                    <p className="text-gray-600">{profile.role_title || 'No role specified'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Email</label>
                                    <p className="text-gray-900">{profile.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Experience</label>
                                    <span className={`inline-block py-1 px-3 rounded-full text-xs font-semibold ${profile.experience_level === 'Senior' ? 'bg-cyan-100 text-cyan-800' : profile.experience_level === 'Mid-Level' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                        {profile.experience_level}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Status</label>
                                    <span className={`inline-block py-1 px-3 rounded-full text-xs font-semibold ${getStatusColor(profile.status)}`}>
                                        {profile.status}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Member Since</label>
                                    <p className="text-gray-900">{new Date(profile.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Assigned Projects Section */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">My Assigned Projects ({assignedProjects.length})</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {assignedProjects.length > 0 ? (
                            assignedProjects.map((assignment) => (
                                <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-gray-800">{assignment.project_name}</h4>
                                        <span className={`inline-block py-1 px-2 rounded-full text-xs font-semibold ${assignment.status === 'Active' ? 'bg-green-100 text-green-800' : assignment.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {assignment.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><strong>Start:</strong> {new Date(assignment.start_date).toLocaleDateString()}</p>
                                        <p><strong>End:</strong> {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'Not set'}</p>
                                        <p><strong>Role:</strong> {assignment.role_in_project || 'Not specified'}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No projects assigned yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Update Profile Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Update Profile"
            >
                <form onSubmit={handleUpdateProfile}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="flex flex-col">
                            <label htmlFor="name" className="font-semibold mb-2 text-gray-700 text-sm">Full Name *</label>
                            <input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                placeholder="Enter full name"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="email" className="font-semibold mb-2 text-gray-700 text-sm">Email Address *</label>
                            <input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                placeholder="Enter email address"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                        <div className="flex flex-col">
                            <label htmlFor="role" className="font-semibold mb-2 text-gray-700 text-sm">Role Title</label>
                            <input
                                id="role"
                                type="text"
                                value={formData.role_title}
                                onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                                className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                placeholder="Enter role title"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="experience" className="font-semibold mb-2 text-gray-700 text-sm">Experience Level</label>
                            <select
                                id="experience"
                                value={formData.experience_level}
                                onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
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
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                            >
                                <option value="Available">Available</option>
                                <option value="Busy">Busy</option>
                                <option value="On Leave">On Leave</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-3">
                        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none min-w-32 flex items-center justify-center">
                            Update Profile
                        </button>
                        <button type="button" className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default EmployeeDashboard;