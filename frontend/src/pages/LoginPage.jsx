// src/pages/LoginPage.jsx

import { useState } from 'react';
import apiClient from '../api/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Globe, User, Lock } from 'lucide-react';

function LoginPage({ onLoginSuccess }) { 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiClient.post('http://127.0.0.1:8000/api/v1/users/login/', {
        username: username,
        password: password,
      });

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      toast.success('Login Successful!');
      navigate('/dashboard');

    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      toast.error('Login Failed. Please check your username and password.');
    }finally {
      setIsLoading(false); // <-- 6. SET LOADING TO FALSE
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="p-8 bg-slate-800 rounded-lg shadow-xl w-full max-w-sm border border-slate-700">
        
        {/* --- NEW: Main Icon --- */}
        <div className="flex justify-center mb-6">
          <Globe className="text-cyan-500" size={40} />
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-white">
          Login to My Sphere
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* --- NEW: Username Field with Icon --- */}
          <div className="mb-4 relative">
            <label htmlFor="username" className="block text-gray-400 text-sm font-bold mb-2">Username</label>
            <User className="absolute left-3 top-1/2 -translate-y-0.5 mt-2.5 text-slate-400" size={20} />
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          
          {/* --- NEW: Password Field with Icon --- */}
          <div className="mb-6 relative">
            <label htmlFor="password" className="block text-gray-400 text-sm font-bold mb-2">Password</label>
            <Lock className="absolute left-3 top-1/2 -translate-y-0.5 mt-2.5 text-slate-400" size={20} />
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg ..."
          >
            {isLoading ? 'Logging In...' : 'Enter the Sphere'}
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