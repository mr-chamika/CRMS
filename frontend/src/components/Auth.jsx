import React, { useState } from 'react';

const Auth = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role_title: '',
        experience_level: 'Junior',
        status: 'Available'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

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
                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 m-0 mb-2">
                            {isLogin ? 'Sign in to your account' : 'Create your account'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
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
                                        <input
                                            id="role_title"
                                            name="role_title"
                                            type="text"
                                            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., Software Engineer, Project Manager"
                                            value={formData.role_title}
                                            onChange={handleChange}
                                        />
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
                                </>
                            )}
                        </div>

                        <div className="pt-4">
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
                                    isLogin ? 'Sign In' : 'Create Account'
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