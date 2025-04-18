const AuthService = {
  // Base fetch function with error handling
  fetchWithAuth: async (url, options = {}) => {
    const baseURL = 'http://127.0.0.1:8000/';
    const token = localStorage.getItem('authToken');
    console.log(token)
  
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
      // Ensure URL ends with a slash if it doesn't already
      const formattedUrl = url.endsWith('/') ? url : `${url}/`;
      console.log(`Making request to ${baseURL}${formattedUrl}`);
      const response = await fetch(`${baseURL}${formattedUrl}`, config);
      
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
        // Pass the entire error object through
        throw data;
      }
      
      return data;
    } catch (error) {
      console.error("Request error:", error);
      // Preserve the full error structure
      if (error.response) {
        throw error.response.data || error;
      } else {
        throw error;
      }
    }
  },
  
  // Register a new user
  register: async (userData) => {
    try {
      console.log("Sending registration data:", userData);
      const data = await AuthService.fetchWithAuth('register/', {
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
      // Pass the entire error object up
      throw error;
    }
  },
  // Login user
  login: async (userData) => {
    try {
      console.log("Sending login data:", userData);
      const data = await AuthService.fetchWithAuth('login/', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      console.log("Login response:", data);

      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },
};

export default AuthService;