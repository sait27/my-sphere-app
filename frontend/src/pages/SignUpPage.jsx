// src/pages/SignUpPage.jsx

import { useState } from 'react';
import apiClient from '../api/axiosConfig';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Globe, User, Lock, Mail, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';

function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  const getStrengthColor = (strength) => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    
    if (passwordStrength < 3) {
      toast.error('Please choose a stronger password.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('http://127.0.0.1:8000/api/v1/users/register/', {
        username,
        email,
        password,
      });
      toast.success('Welcome to My Sphere! Registration successful!');
      navigate('/login');
    } catch (error) {
      // Registration failed
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,69,193,0.1),transparent_50%)]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}} />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 animate-scale-in">
          
          {/* Enhanced Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-600 rounded-2xl mb-4 animate-pulse-glow">
              <Globe className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
              Join My Sphere
            </h1>
            <p className="text-slate-400">Create your account and start managing your finances</p>
          </div>
          
          {/* Enhanced Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-semibold" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors" size={18} />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-slate-700 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-semibold" htmlFor="username">
                Username
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors" size={18} />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-slate-700 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  id="username"
                  type="text"
                  placeholder="Choose a username"
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
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors" size={18} />
                <input
                  className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-slate-700 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-purple-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${passwordStrength <= 2 ? 'text-red-400' : passwordStrength <= 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {getStrengthText(passwordStrength)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-semibold" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors" size={18} />
                <input
                  className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-slate-700 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-purple-400 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
            
            {/* Enhanced Submit Button */}
            <button
              className={`group w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          {/* Enhanced Footer */}
          <div className="text-center mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;