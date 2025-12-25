import React, { useState, useEffect } from 'react';
import PersonnelList from './components/PersonnelList';
import ProjectList from './components/ProjectList';
import ProjectMatching from './components/ProjectMatching';
import Auth from './components/Auth';

function App() {
    const [activeTab, setActiveTab] = useState('personnel');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, [user]);

    const handleLogin = (userData) => {
        setUser(userData);
        console.log(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
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

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header className="bg-gradient-to-br from-blue-500 to-purple-600 py-5 text-white shadow-lg">
                <div className="flex justify-between items-center px-6">
                    <h1 className="m-0 text-4xl font-bold drop-shadow-lg">Personnel Skill Management</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm">Welcome, {user.name}</span>
                        <button
                            onClick={handleLogout}
                            className="py-2 px-4 bg-white bg-opacity-20 border border-white border-opacity-30 text-white text-sm font-semibold rounded-full cursor-pointer transition-all duration-300 backdrop-blur-sm hover:bg-opacity-30 hover:border-opacity-50"
                        >
                            Logout
                        </button>
                    </div>
                </div>
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
                </nav>
            </header>
            <main className="flex-1 p-0 overflow-hidden">
                {activeTab === 'personnel' && <PersonnelList />}
                {activeTab === 'projects' && <ProjectList />}
                {activeTab === 'matching' && <ProjectMatching />}
            </main>
        </div>
    );
}

export default App;