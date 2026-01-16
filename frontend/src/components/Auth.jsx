import React, { useState, useEffect } from 'react';

const Auth = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role_title: '',
        experience_level: 'Junior',
        status: 'Available',
        skills: [{ skill_id: '', proficiency_level: 1 }]
    });
    const [skills, setSkills] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {

        if (!isLogin) {//avoid unnecessary fetch for login page

            fetchSkills();

        }

    }, [isLogin]);//for realtime skill list update

    const fetchSkills = async () => {

        await fetch('http://localhost:5000/api/skills')
            .then(res => res.json())
            .then(data => { setSkills(data || []) })
            .catch(error => console.error('Error fetching skills:', error));

        // try {
        //     const response = await fetch('http://localhost:5000/api/skills');
        //     const data = await response.json();
        //     setSkills(data || []);
        //     console.log(data)
        // } catch (error) {
        //     console.error('Error fetching skills:', error);
        // }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const addSkill = () => {
        setFormData({
            ...formData,
            skills: [...formData.skills, { skill_id: '', proficiency_level: 1 }]
        });
    };

    const updateSkill = (index, field, value) => {
        const updatedSkills = [...formData.skills];
        updatedSkills[index] = { ...updatedSkills[index], [field]: value };
        setFormData({ ...formData, skills: updatedSkills });
    };

    const removeSkill = (index) => {
        if (formData.skills.length > 1) {
            const updatedSkills = formData.skills.filter((_, i) => i !== index);
            setFormData({ ...formData, skills: updatedSkills });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (isLogin) {
            // Login validation
            if (!formData.email.trim()) {
                setError('Email is required.');
                setLoading(false);
                return;
            }
            if (!/\S+@\S+\.\S+/.test(formData.email)) {
                setError('Please enter a valid email address.');
                setLoading(false);
                return;
            }
            if (!formData.password) {
                setError('Password is required.');
                setLoading(false);
                return;
            }
        } else {
            // Signup validation
            if (!formData.name.trim()) {
                setError('Full name is required.');
                setLoading(false);
                return;
            }
            if (!formData.email.trim()) {
                setError('Email is required.');
                setLoading(false);
                return;
            }
            if (!/\S+@\S+\.\S+/.test(formData.email)) {
                setError('Please enter a valid email address.');
                setLoading(false);
                return;
            }
            if (!formData.password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
                setError('Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
                setLoading(false);
                return;
            }
            if (!formData.experience_level) {
                setError('Experience level is required.');
                setLoading(false);
                return;
            }
            if (!formData.role_title) {
                setError('Role is required.');
                setLoading(false);
                return;
            }
            if (!formData.status) {
                setError('Availability status is required.');
                setLoading(false);
                return;
            }
            const hasEmptySkill = formData.skills.some(skill => skill.skill_id === '' || skill.skill_id === null);
            if (hasEmptySkill) {
                setError('Please select a skill for all skill entries.');
                setLoading(false);
                return;
            }
            const hasValidSkill = formData.skills.some(skill => skill.skill_id !== '' && skill.skill_id !== null);
            if (!hasValidSkill) {
                setError('At least one skill must be selected.');
                setLoading(false);
                return;
            }
        }


        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
            const body = isLogin
                ? { email: formData.email, password: formData.password }
                : formData;

            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLogin(data.user);
            } else {
                setError(data.error || 'Authentication failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto p-5">
            <div className="flex justify-center items-center flex-1">
                <div className="bg-white rounded-xl px-8 mb-3 py-6 shadow-lg border border-gray-200 w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 m-0 mb-2">
                            {isLogin ? 'Sign in to your account' : 'Create your account'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-2">
                            {!isLogin && (
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required={!isLogin}
                                        className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter your email address"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full p-3 pr-12 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {!isLogin && (
                                <>
                                    <div>
                                        <label htmlFor="role_title" className="block text-sm font-medium text-gray-700 mb-2">
                                            Role Title
                                        </label>
                                        <select
                                            id="role_title"
                                            name="role_title"
                                            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.role_title}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select a role</option>
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

                                    <div>
                                        <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 mb-2">
                                            Experience Level *
                                        </label>
                                        <select
                                            id="experience_level"
                                            name="experience_level"
                                            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.experience_level}
                                            onChange={handleChange}
                                        >
                                            <option value="Junior">Junior</option>
                                            <option value="Mid-Level">Mid-Level</option>
                                            <option value="Senior">Senior</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                            Availability Status *
                                        </label>
                                        <select
                                            id="status"
                                            name="status"
                                            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="Available">Available</option>
                                            <option value="Busy">Busy</option>
                                            <option value="On Leave">On Leave</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Personnel Skills
                                        </label>
                                        <div className="space-y-3">
                                            {formData.skills && formData.skills.length > 0 && formData.skills.map((skill, index) => (
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
                                                    {formData.skills.length > 1 && (
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
                                </>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        <div className="pt-0">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    isLogin ? 'Sign In' : 'Sign Up'
                                )}
                            </button>
                        </div>
                    </form>
                    <p className="text-gray-600 text-sm text-center pt-3">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        <button
                            type="button"
                            className="ml-1 font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;