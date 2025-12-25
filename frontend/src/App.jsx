import React, { useState } from 'react';
import PersonnelList from './components/PersonnelList';
import ProjectList from './components/ProjectList';
import ProjectMatching from './components/ProjectMatching';

function App() {
    const [activeTab, setActiveTab] = useState('personnel');

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header className="bg-gradient-to-br from-blue-500 to-purple-600 py-5 text-white shadow-lg">
                <h1 className="m-0 text-4xl font-bold text-center drop-shadow-lg">Personnel Skill Management</h1>
                <nav className="flex justify-center gap-5 mt-5">
                    <button
                        className={`py-3 px-8 bg-white bg-opacity-20 border-2 border-white border-opacity-30 text-white text-base font-semibold rounded-full cursor-pointer transition-all duration-300 backdrop-blur-sm hover:bg-opacity-30 hover:border-opacity-50 hover:-translate-y-1 hover:shadow-xl ${activeTab === 'personnel' ? 'bg-white text-blue-500 border-white' : ''
                            }`}
                        onClick={() => setActiveTab('personnel')}
                    >
                        Personnel Dashboard
                    </button>
                    <button
                        className={`py-3 px-8 bg-white bg-opacity-20 border-2 border-white border-opacity-30 text-white text-base font-semibold rounded-full cursor-pointer transition-all duration-300 backdrop-blur-sm hover:bg-opacity-30 hover:border-opacity-50 hover:-translate-y-1 hover:shadow-xl ${activeTab === 'projects' ? 'bg-white text-blue-500 border-white' : ''
                            }`}
                        onClick={() => setActiveTab('projects')}
                    >
                        Project Dashboard
                    </button>
                    <button
                        className={`py-3 px-8 bg-white bg-opacity-20 border-2 border-white border-opacity-30 text-white text-base font-semibold rounded-full cursor-pointer transition-all duration-300 backdrop-blur-sm hover:bg-opacity-30 hover:border-opacity-50 hover:-translate-y-1 hover:shadow-xl ${activeTab === 'matching' ? 'bg-white text-blue-500 border-white' : ''
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