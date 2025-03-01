// src/services/AuthService.js
const AuthService = {
    // Base fetch function with error handling
    fetchWithAuth: async (url, options = {}) => {
      const baseURL = 'http://127.0.0.1:8000/';
      const token = localStorage.getItem('authToken');
    
       console.log(token); 
      const defaultHeaders = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
      
      const config = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      };
      
      try {
        console.log(`Making request to ${baseURL}${url}`);
        const response = await fetch(`${baseURL}${url}`, config);
        
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await response.json();
        } else {
          data = await response.text();
          console.log("Non-JSON response:", data);
          throw new Error("Unexpected response format");
        }
        
        if (!response.ok) {
          throw { response: { data, status: response.status } };
        }
        
        return data;
      } catch (error) {
        console.error("Request error:", error);
        throw error.response?.data || { message: 'Request failed: ' + error.message };
      }
    },
    
    // Register a new user
    register: async (userData) => {
      try {
        console.log("Sending registration data:", userData);
        const data = await AuthService.fetchWithAuth('register', {
          method: 'POST',
          body: JSON.stringify(userData)
        });
        
        console.log("Registration response:", data);
        
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
      } catch (error) {
        console.error("Registration error:", error);
        throw error.response?.data || { message: 'Registration failed' };
      }
    },
  };
  
  export default AuthService;   