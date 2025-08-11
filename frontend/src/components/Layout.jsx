// src/components/Layout.jsx

import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
// --- NEW: Import the icons we need ---
import { LayoutDashboard, Wallet, ListChecks, Settings, LogOut } from 'lucide-react';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    delete apiClient.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  // Helper to check if a link is active
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-slate-900 text-gray-200 font-sans">
      {/* --- Sidebar --- */}
      <div className="w-64 bg-slate-800 p-5 border-r border-slate-700 flex flex-col fixed h-full">
        <h1 className="text-2xl font-bold text-white mb-10">My Sphere</h1>
        <nav className="flex-grow">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/dashboard" 
                // --- NEW: Added flex, items-center, and gap ---
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/dashboard') ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'hover:bg-slate-700'}`}
              >
                <LayoutDashboard size={20} /> {/* <-- NEW: Icon */}
                Dashboard Hub
              </Link>
            </li>
            <li>
              <Link 
                to="/expenses" 
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/expenses') ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'hover:bg-slate-700'}`}
              >
                <Wallet size={20} /> {/* <-- NEW: Icon */}
                Expenses
              </Link>
            </li>
            <li>
              <Link 
                to="/lists" 
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/lists') ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'hover:bg-slate-700'}`}
              >
                <ListChecks size={20} /> {/* <-- NEW: Icon */}
                Lists
              </Link>
            </li>
            <li>
              <Link 
                to="/settings" 
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive('/settings') ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'hover:bg-slate-700'}`}
              >
                <Settings size={20} /> {/* <-- NEW: Icon */}
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-slate-700 transition-colors">
              <LogOut size={20} /> {/* <-- NEW: Icon */}
              Logout
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <main className="flex-1 p-10 overflow-y-auto ml-64">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;