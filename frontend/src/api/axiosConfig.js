import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

// Request Interceptor: Attaches the token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles expired tokens and refreshes them
apiClient.interceptors.response.use(
  (response) => response, // Simply return the successful response
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the error is a 401 and it's not a retry request
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark it as a retry
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Attempt to get a new access token using the refresh token
          const response = await axios.post('http://localhost:8000/api/v1/users/login/refresh/', {
            refresh: refreshToken,
          });
          
          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);
          
          // Update the header for the original failed request
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          
          // Retry the original request with the new token
          return apiClient(originalRequest);

        } catch (refreshError) {
          // If the refresh token is also invalid, log the user out
          // Refresh token is invalid, logging out
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    // For any other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default apiClient;