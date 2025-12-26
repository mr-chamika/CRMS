import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../utils/api';

function EmployeeDashboard({ user }) {
    const [profile, setProfile] = useState(null);
    const [assignedProjects, setAssignedProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role_title: '',
        experience_level: 'Junior',
        status: 'Available'
    });
    const [skills, setSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [projectDetails, setProjectDetails] = useState(null);

    useEffect(() => {
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

        const fetchSkills = async () => {
            try {
                const [profileSkillsResponse, allSkillsResponse] = await Promise.all([
                    api.get(`/personnel/${user.id}/skills`),
                    api.get('/skills')
                ]);
                const profileSkills = await profileSkillsResponse.json();
                const allSkills = await allSkillsResponse.json();

                setSkills(profileSkills.length > 0 ? profileSkills : [{ skill_id: '', proficiency_level: 1 }]);
                setAvailableSkills(allSkills);
            } catch (error) {
                console.error('Error fetching skills:', error);
                setSkills([{ skill_id: '', proficiency_level: 1 }]);
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

        fetchProfile();
        fetchSkills();
        fetchAssignedProjects();
    }, [user.id]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            // Update basic profile info
            await api.put(`/personnel/${user.id}`, formData);

            // Update skills
            const skillsToUpdate = skills.filter(skill => skill.skill_id !== '');
            await api.put(`/personnel/${user.id}/skills`, { skills: skillsToUpdate });

            // Refresh profile data
            const response = await api.get(`/personnel/${user.id}`);
            const updatedProfile = await response.json();
            setProfile(updatedProfile);

            // Refresh skills
            const skillsResponse = await api.get(`/personnel/${user.id}/skills`);
            const updatedSkills = await skillsResponse.json();
            setSkills(updatedSkills.length > 0 ? updatedSkills : [{ skill_id: '', proficiency_level: 1 }]);

            setShowModal(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const addSkill = () => {
        setSkills([...skills, { skill_id: '', proficiency_level: 1 }]);
    };

    const updateSkill = (index, field, value) => {
        const updatedSkills = [...skills];
        updatedSkills[index] = { ...updatedSkills[index], [field]: value };
        setSkills(updatedSkills);
    };

    const removeSkill = (index) => {
        if (skills.length > 1) {
            const updatedSkills = skills.filter((_, i) => i !== index);
            setSkills(updatedSkills);
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
                    <h3 className="text-xl font-bold text-gray-800 mb-4">My Profile</h3>
                    {profile && (
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Profile Info - Fixed at top */}
                            <div className="flex-shrink-0">
                                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                                        {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-bold text-gray-800 truncate">{profile.name}</h4>
                                        <p className="text-gray-600 text-sm truncate">{profile.role_title || 'No role specified'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Email</label>
                                        <p className="text-gray-900 font-medium text-sm truncate">{profile.email}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Experience</label>
                                        <span className={`inline-block py-1 px-2 rounded-full text-xs font-bold ${profile.experience_level === 'Senior' ? 'bg-cyan-100 text-cyan-800' : profile.experience_level === 'Mid-Level' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {profile.experience_level}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Status</label>
                                        <span className={`inline-block py-1 px-2 rounded-full text-xs font-bold ${getStatusColor(profile.status)}`}>
                                            {profile.status}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Member Since</label>
                                        <p className="text-gray-900 font-medium text-sm">{new Date(profile.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Skills Section - Scrollable at bottom */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">My Skills ({skills.length})</label>
                                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    {skills.length > 0 ? (
                                        <div className="space-y-2">
                                            {skills.map((skill, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-medium text-gray-900 text-sm truncate">{skill.skill_name || 'Unnamed Skill'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-2">
                                                        <span className="text-xs text-gray-600">Level:</span>
                                                        <span className={`inline-block py-0.5 px-2 rounded-full text-xs font-bold ${skill.proficiency_level === 4 ? 'bg-purple-100 text-purple-800' :
                                                                skill.proficiency_level === 3 ? 'bg-blue-100 text-blue-800' :
                                                                    skill.proficiency_level === 2 ? 'bg-green-100 text-green-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {skill.proficiency_level === 1 ? 'Beg' :
                                                                skill.proficiency_level === 2 ? 'Int' :
                                                                    skill.proficiency_level === 3 ? 'Adv' :
                                                                        skill.proficiency_level === 4 ? 'Exp' : skill.proficiency_level}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center py-4 px-3">
                                                <div className="text-2xl mb-2">🛠️</div>
                                                <p className="text-gray-500 text-xs font-medium">No skills added yet.</p>
                                                <p className="text-gray-400 text-xs mt-1">Update your profile to add skills.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Assigned Projects Section */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-[500px] flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">My Assigned Projects ({assignedProjects.length})</h3>
                    <div className="flex-1 overflow-y-auto">
                        <div className="space-y-4 pr-2 h-full">
                            {assignedProjects.length > 0 ? (
                                assignedProjects.map((assignment) => (
                                    <div key={assignment.id} className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer">
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
                <div className="flex flex-col h-[600px]">
                    {/* Fixed top section with basic profile fields */}
                    <div className="flex-shrink-0">
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
                        </form>
                    </div>

                    {/* Scrollable skills section */}
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        <label className="font-semibold mb-2 text-gray-700 text-sm block">My Skills</label>
                        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="space-y-3">
                                {skills.map((skill, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="flex-1">
                                            <select
                                                value={skill.skill_id}
                                                onChange={(e) => updateSkill(index, 'skill_id', e.target.value)}
                                                className="p-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500 w-full"
                                            >
                                                <option value="">Select Skill</option>
                                                {availableSkills.map((s) => (
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
                                        {skills.length > 1 && (
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
                        </div>
                    </div>

                    {/* Fixed bottom section with buttons */}
                    <div className="flex-shrink-0 flex gap-3 mt-4">
                        <button type="submit" onClick={handleUpdateProfile} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none min-w-32 flex items-center justify-center">
                            Update Profile
                        </button>
                        <button type="button" className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
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