// src/pages/SignUpPage.jsx

import { useState } from 'react';
import apiClient from '../api/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Import Link and useNavigate

function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('http://127.0.0.1:8000/api/v1/users/register/', {
        username,
        email,
        password,
      });
      toast.success('Registration successful! Please log in.');
      navigate('/login'); // Redirect to login page on success
    } catch (error) {
      console.error('Registration failed:', error.response ? error.response.data : error.message);
      toast.error('Registration Failed. Please try again.');
    }finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-gray-200">
      <div className="p-8 bg-slate-800 rounded-lg shadow-xl w-full max-w-sm border border-slate-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          Join My Sphere
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-slate-400 text-sm font-bold mb-2">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white" />
          </div>
          {/* Username Field */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-slate-400 text-sm font-bold mb-2">Username</label>
            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white" />
          </div>
          {/* Password Field */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-slate-400 text-sm font-bold mb-2">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white" />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-lg focus:shadow-cyan-500/50 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account? <Link to="/login" className="text-cyan-400 hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default SignUpPage;