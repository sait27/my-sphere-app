// src/pages/LoginPage.jsx

import { useState } from 'react';
import apiClient from '../api/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';

function LoginPage({ onLoginSuccess }) { 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await apiClient.post('http://127.0.0.1:8000/api/v1/users/login/', {
        username: username,
        password: password,
      });

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      navigate('/dashboard');

    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      alert('Login Failed. Please check your username and password.');
    }
  };

  return (
    // Main container with our new dark, "deep space" background
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-gray-200">

      {/* Form Card: A darker card that "floats" on the background, with a subtle glow on focus */}
      <div className="p-8 bg-slate-800 rounded-lg shadow-xl w-full max-w-sm border border-slate-700">

        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          My Sphere
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-slate-400 text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-slate-400 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>

          {/* Submit Button with our new "magic" accent color */}
          <button
            type="submit"
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-lg focus:shadow-cyan-500/50 transition-all duration-300"
          >
            Enter the Sphere
          </button>
        </form>
        <p className="text-center text-slate-400 text-sm mt-6">
                Don't have an account? <Link to="/signup" className="text-cyan-400 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;