import React, { useState, useEffect } from 'react';
import PersonnelList from './components/PersonnelList';
import ProjectList from './components/ProjectList';
import ProjectMatching from './components/ProjectMatching';
import EmployeeDashboard from './components/EmployeeDashboard';
import Auth from './components/Auth';
import SkillsManagement from './components/SkillsManagement';
import ConfirmationModal from './components/ConfirmationModal';

function App() {
    const [activeTab, setActiveTab] = useState('personnel');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        console.log(user);
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setShowLogoutModal(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className='h-screen'>
                <Auth onLogin={handleLogin} />
            </div>
        );
    }

    const isManager = user.role_title && (user.role_title === 'manager');
    console.log(user)
    console.log(isManager)
    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header className="bg-gradient-to-br from-blue-500 to-purple-600 py-5 text-white shadow-lg">
                <div className="flex justify-between items-center px-6">
                    <h1 className="m-0 text-4xl font-bold drop-shadow-lg">Personnel Skill Management</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm">Welcome, {user.name}</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 py-2 px-4 bg-black bg-opacity-80 border border-gray-600 border-opacity-50 text-white text-sm font-semibold rounded-lg cursor-pointer transition-all duration-300 hover:bg-gray-900 hover:border-gray-500 hover:shadow-lg hover:-translate-y-0.5"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
                {isManager && (
                    <nav className="flex justify-center gap-5 mt-5">
                        <button
                            className={`py-3 px-8 bg-white bg-opacity-20 border-2 border-white border-opacity-30 text-white text-base font-semibold rounded-full cursor-pointer transition-all duration-300 backdrop-blur-sm hover:bg-opacity-30 hover:border-opacity-50 hover:-translate-y-1 hover:shadow-xl ${activeTab === 'personnel' ? 'bg-white text-blue-500 border-white -translate-y-1' : ''
                                }`}
                            onClick={() => setActiveTab('personnel')}
                        >
                            Personnel Dashboard
                        </button>
                        <button
                            className={`py-3 px-8 bg-white bg-opacity-20 border-2 border-white border-opacity-30 text-white text-base font-semibold rounded-full cursor-pointer transition-all duration-300 backdrop-blur-sm hover:bg-opacity-30 hover:border-opacity-50 hover:-translate-y-1 hover:shadow-xl ${activeTab === 'projects' ? 'bg-white text-blue-500 border-white -translate-y-1' : ''
                                }`}
                            onClick={() => setActiveTab('projects')}
                        >
                            Project Dashboard
                        </button>
                        <button
                            className={`py-3 px-8 bg-white bg-opacity-20 border-2 border-white border-opacity-30 text-white text-base font-semibold rounded-full cursor-pointer transition-all duration-300 backdrop-blur-sm hover:bg-opacity-30 hover:border-opacity-50 hover:-translate-y-1 hover:shadow-xl ${activeTab === 'matching' ? 'bg-white text-blue-500 border-white -translate-y-1' : ''
                                }`}
                            onClick={() => setActiveTab('matching')}
                        >
                            Project Matching
                        </button>
                        <button
                            className={`py-3 px-8 bg-white bg-opacity-20 border-2 border-white border-opacity-30 text-white text-base font-semibold rounded-full cursor-pointer transition-all duration-300 backdrop-blur-sm hover:bg-opacity-30 hover:border-opacity-50 hover:-translate-y-1 hover:shadow-xl ${activeTab === 'skills' ? 'bg-white text-blue-500 border-white -translate-y-1' : ''
                                }`}
                            onClick={() => setActiveTab('skills')}
                        >
                            Skills Management
                        </button>
                    </nav>
                )}
            </header>
            <main className="flex-1 p-0 overflow-hidden">
                {isManager ? (
                    <>
                        {activeTab === 'personnel' && <PersonnelList user={user} />}
                        {activeTab === 'projects' && <ProjectList />}
                        {activeTab === 'matching' && <ProjectMatching />}
                        {activeTab === 'skills' && <SkillsManagement />}
                    </>
                ) : (
                    <EmployeeDashboard user={user} />
                )}
            </main>

            {/* Logout Confirmation Modal */}
            <ConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => { setShowLogoutModal(false); setActiveTab("personnel") }}
                onConfirm={confirmLogout}
                title="Confirm Logout"
                message="Are you sure you want to logout? You will be redirected to the login page."
                confirmText="Logout"
                cancelText="Cancel"
            />
        </div>
    );
}

export default App;
