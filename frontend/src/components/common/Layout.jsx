// src/components/Layout.jsx

import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import { LayoutDashboard, Wallet, ListChecks, Settings, LogOut, Menu, X, Globe, Brain, CreditCard } from 'lucide-react';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    delete apiClient.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  // Helper to check if a link is active
  const isActive = (path) => location.pathname.startsWith(path);

  const navigationItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Hub' },
    { path: '/expenses', icon: Wallet, label: 'Expenses' },
    { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { path: '/todos', icon: Brain, label: 'AI Tasks & Goals' },
    { path: '/lists', icon: ListChecks, label: 'Lists' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-200 font-sans relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[100] p-2 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[50]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <div className={`w-64 bg-slate-800/90 backdrop-blur-xl p-6 border-r border-slate-700/50 flex flex-col fixed h-full z-40 transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
            <Globe size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">My Sphere</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-grow">
          <ul className="space-y-3">
            {navigationItems.map(({ path, icon: Icon, label }) => (
              <li key={path}>
                <Link 
                  to={path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                    isActive(path) 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 font-semibold shadow-lg' 
                      : 'hover:bg-slate-700/70 hover:translate-x-1'
                  }`}
                >
                  {isActive(path) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl" />
                  )}
                  <Icon size={20} className={`relative z-10 transition-colors ${
                    isActive(path) ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'
                  }`} />
                  <span className="relative z-10">{label}</span>
                  {isActive(path) && (
                    <div className="absolute right-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Enhanced Logout Button */}
        <div className="pt-6 border-t border-slate-700/50">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <LogOut size={20} className="text-slate-400 group-hover:text-red-400 transition-colors" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Enhanced Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto ml-0 lg:ml-64 relative">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;