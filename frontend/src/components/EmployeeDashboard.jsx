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
    const [selectedProject, setSelectedProject] = useState(null);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [projectDetails, setProjectDetails] = useState(null);

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

    const handleViewProject = async (assignment) => {
        try {
            const response = await api.get(`/projects/${assignment.project_id}`);
            const data = await response.json();
            setProjectDetails(data);
            setSelectedProject(assignment);
            setShowProjectModal(true);
        } catch (error) {
            console.error('Error fetching project details:', error);
        }
    };

    const getStatusColor = (status) => {
        // Function to get status color classes
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
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-[500px] flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">My Profile</h3>
                    {profile && (
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                    {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-gray-800">{profile.name}</h4>
                                    <p className="text-gray-600 text-lg">{profile.role_title || 'No role specified'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <p className="text-gray-900 font-medium">{profile.email}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                                    <span className={`inline-block py-2 px-4 rounded-full text-sm font-bold ${profile.experience_level === 'Senior' ? 'bg-cyan-100 text-cyan-800 border-2 border-cyan-200' : profile.experience_level === 'Mid-Level' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200' : 'bg-green-100 text-green-800 border-2 border-green-200'}`}>
                                        {profile.experience_level}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <span className={`inline-block py-2 px-4 rounded-full text-sm font-bold ${getStatusColor(profile.status)} border-2 ${profile.status === 'Available' ? 'border-green-200' : profile.status === 'Busy' ? 'border-red-200' : 'border-yellow-200'}`}>
                                        {profile.status}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Member Since</label>
                                    <p className="text-gray-900 font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Assigned Projects Section */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-[500px] flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">My Assigned Projects ({assignedProjects.length})</h3>
                    <div className="flex-1 overflow-y-auto">
                        <div className="space-y-4 pr-2">
                            {assignedProjects.length > 0 ? (
                                assignedProjects.map((assignment) => (
                                    <div key={assignment.id} className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-gray-800 text-lg">{assignment.project_name}</h4>
                                            <span className={`inline-block py-2 px-4 rounded-full text-sm font-bold shadow-sm ${assignment.status === 'Active' ? 'bg-green-100 text-green-800 border-2 border-green-200' : assignment.status === 'Completed' ? 'bg-blue-100 text-blue-800 border-2 border-blue-200' : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200'}`}>
                                                {assignment.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-gray-700">📅 Start:</span>
                                                <span className="text-gray-900">{new Date(assignment.start_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-gray-700">🏁 End:</span>
                                                <span className="text-gray-900">{assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'Not set'}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={() => handleViewProject(assignment)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:shadow-md text-sm"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center py-12 px-6">
                                        <div className="text-6xl mb-4">📋</div>
                                        <p className="text-gray-500 text-lg font-medium">No projects assigned yet.</p>
                                        <p className="text-gray-400 text-sm mt-2">Your assigned projects will appear here.</p>
                                    </div>
                                </div>
                            )}
                        </div>
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
                            <select
                                id="role"
                                value={formData.role_title}
                                onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                                className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                            >
                                <option value="">Select Role</option>
                                <option value="Software Engineer">Software Engineer</option>
                                <option value="Project Manager">Project Manager</option>
                                <option value="UI/UX Designer">UI/UX Designer</option>
                                <option value="Data Analyst">Data Analyst</option>
                                <option value="DevOps Engineer">DevOps Engineer</option>
                                <option value="QA Engineer">QA Engineer</option>
                                <option value="Business Analyst">Business Analyst</option>
                                <option value="Product Manager">Product Manager</option>
                                <option value="System Administrator">System Administrator</option>
                                <option value="Database Administrator">Database Administrator</option>
                            </select>
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

            {/* Project Details Modal */}
            <Modal
                isOpen={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                title="Project Details"
            >
                {selectedProject && (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                📋
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{selectedProject.project_name}</h3>
                                <span className={`inline-block py-2 px-4 rounded-full text-sm font-bold ${selectedProject.status === 'Active' ? 'bg-green-100 text-green-800 border-2 border-green-200' : selectedProject.status === 'Completed' ? 'bg-blue-100 text-blue-800 border-2 border-blue-200' : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200'}`}>
                                    {selectedProject.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Start Date</label>
                                <p className="text-gray-900 font-medium">{new Date(selectedProject.start_date).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">🏁 End Date</label>
                                <p className="text-gray-900 font-medium">{selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString() : 'Not set'}</p>
                            </div>
                        </div>

                        {selectedProject.description && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">📝 Description</label>
                                <p className="text-gray-900">{selectedProject.description}</p>
                            </div>
                        )}

                        {projectDetails && projectDetails.requirements && projectDetails.requirements.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">📋 Project Requirements</label>
                                <div className="space-y-2">
                                    {projectDetails.requirements.map((req, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <span className="text-gray-900">{req.skill_name}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.min_proficiency_level === 1 ? 'bg-green-100 text-green-800' :
                                                req.min_proficiency_level === 2 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                Level {req.min_proficiency_level}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {projectDetails && projectDetails.assigned_personnel && projectDetails.assigned_personnel.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">👥 Assigned Personnel</label>
                                <div className="space-y-2">
                                    {projectDetails.assigned_personnel.map((person, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                                            <div>
                                                <span className="font-medium text-gray-900">{person.name}</span>
                                                <span className="text-gray-600 text-sm ml-2">({person.role_title})</span>
                                            </div>
                                            <span className="text-sm text-gray-500">{person.capacity_percentage}% capacity</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowProjectModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default EmployeeDashboard;