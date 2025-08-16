// src/pages/LoginPage.jsx

import { useState } from 'react';
import apiClient from '../api/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Globe, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

function LoginPage({ onLoginSuccess }) { 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

      toast.success('Welcome back! Login successful!');
      navigate('/dashboard');

    } catch (error) {
      // Login failed
      toast.error('Login Failed. Please check your credentials.');
    }finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}} />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 animate-scale-in">
          
          {/* Enhanced Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-4 animate-pulse-glow">
              <Globe className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
              My Sphere
            </h1>
            <p className="text-slate-400">Welcome back to your financial universe</p>
          </div>
          
          {/* Enhanced Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-semibold" htmlFor="username">
                Username
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors" size={18} />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-slate-700 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-semibold" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors" size={18} />
                <input
                  className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-slate-700 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {/* Enhanced Submit Button */}
            <button
              className={`group w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          {/* Enhanced Footer */}
          <div className="text-center mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;