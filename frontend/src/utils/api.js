// API utility functions with JWT authentication
const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: getAuthHeaders(),
        ...options
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload(); // Force re-login
        throw new Error('Authentication required');
    }

    return response;
};

export const api = {
    get: (endpoint) => apiRequest(endpoint),
    post: (endpoint, data) => apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    put: (endpoint, data) => apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (endpoint) => apiRequest(endpoint, {
        method: 'DELETE'
    })
};

export default api;