// src/pages/LoginPage.jsx

import { useState } from 'react';
import axios from 'axios'; // NEW: Import the axios library

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // NEW: The function is now 'async' to handle the API call
  const handleSubmit = async (event) => {
    event.preventDefault();

    // NEW: We wrap our API call in a try...catch block to handle errors
    try {
      // Make a POST request to our Django login endpoint
      const response = await axios.post('http://127.0.0.1:8000/api/users/login/', {
        username: username,
        password: password,
      });
      
      // If the login is successful, the server will send back the tokens.
      // Let's log them to the console for now.
      console.log('Login successful! Tokens:', response.data);

       // --- NEW: SAVE THE TOKENS ---
      // 1. Save the access and refresh tokens to localStorage
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // 2. Set the Authorization header for all future axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;

      // 3. For now, show an alert. We'll add proper navigation next.
      alert('Login Successful! You are now authenticated.');
      onLoginSuccess();

    } catch (error) {
      // If the login fails, the server will send back an error.
      console.error('Login failed:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <div>
      <h2>Login to My Sphere</h2>
      {/* The form structure remains the same */}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;