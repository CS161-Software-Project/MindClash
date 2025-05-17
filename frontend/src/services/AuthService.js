import axios from 'axios';

const API_URL = 'https://mindclash-mm6g.onrender.com';

// Create and export the axios instance
export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        console.log('Token from localStorage:', token);
        if (token) {
            // Remove any existing Authorization header to avoid duplicates
            delete config.headers.Authorization;
            // Add the Bearer token
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Adding Authorization header:', config.headers.Authorization);
        } else {
            console.warn('No auth token found in localStorage');
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response error:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Request error:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

const AuthService = {
    // Helper function to get CSRF token
    getCSRFToken: async () => {
        try {
            const response = await axios.get(`${API_URL}/csrftoken/`, { withCredentials: true });
            return response.data.csrfToken;
        } catch (error) {
            console.error('Error getting CSRF token:', error);
            return null;
        }
    },

    // Login user
    login: async (email, password) => {
        try {
            // Create a new axios instance for login
            const loginApi = axios.create({
                baseURL: API_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            // Make login request
            const response = await loginApi.post('/login/', { 
                email, 
                password 
            });
            
            if (response.data && response.data.token) {
                const token = response.data.token;
                localStorage.setItem('authToken', token);
                
                // Get or create user data
                let userData = {
                    id: response.data.user?.id,
                    email: email,
                    username: response.data.user?.username || email.split('@')[0]
                };
                
                console.log('Storing user data:', userData);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Also store in session storage for immediate access
                sessionStorage.setItem('user', JSON.stringify(userData));
                
                return { 
                    success: true, 
                    user: userData,
                    token: token
                };
            }
            return { 
                success: false, 
                error: response.data?.error || 'Invalid credentials or server error' 
            };
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.detail || 
                               error.message || 
                               'Login failed. Please try again.';
            return { 
                success: false, 
                error: errorMessage 
            };
        }
    },

    // Register new user
    register: async (userData) => {
        try {
            const response = await axios.post(`${API_URL}/register/`, userData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const { token, user } = response.data;
            localStorage.setItem('authToken', token);
            localStorage.setItem('user', JSON.stringify(user));
            sessionStorage.setItem('user', JSON.stringify(user));

            return response.data;
        } catch (error) {
            console.log(userData); 
            console.error('Registration error:', error);
            throw error.response?.data || { error: 'Registration failed' };
        }
    },

    // Logout user
    logout: async () => {
        try {
            await api.post('/api/auth/logout/');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        } catch (error) {
            console.error('Logout error:', error);
            // Even if logout fails, clear local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            throw error.response?.data || { error: 'Logout failed' };
        }
    },

    // Get current user
    getCurrentUser: async () => {
        try {
            const response = await api.get('/api/auth/user/');
            return response.data;
        } catch (error) {
            console.error('Get current user error:', error);
            throw error.response?.data || { error: 'Failed to get user data' };
        }
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('authToken');
    },

    // Get auth token
    getToken: () => {
        return localStorage.getItem('authToken');
    },

    // Get user data from local storage
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};

export default AuthService;