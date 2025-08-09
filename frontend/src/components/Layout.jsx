// src/components/Layout.jsx

import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    delete apiClient.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  // Helper to check if a link is active
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-900 text-gray-200 font-sans">
      {/* --- Sidebar --- */}
      <div className="w-64 bg-slate-800 p-5 border-r border-slate-700 flex flex-col fixed h-full">
        <h1 className="text-2xl font-bold text-white mb-10">My Sphere</h1>
        <nav className="flex-grow">
          <ul>
            <li className="mb-4">
              <Link 
                to="/dashboard" 
                className={`block p-3 rounded-lg transition-colors ${isActive('/dashboard') ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'hover:bg-slate-700'}`}
              >
                Dashboard Hub
              </Link>
            </li>
            <li className="mb-4">
              <Link 
                to="/expenses" 
                className={`block p-3 rounded-lg transition-colors ${isActive('/expenses') ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'hover:bg-slate-700'}`}
              >
                Expenses
              </Link>
            </li>
            <li className="mb-4">
            <Link 
              to="/settings" 
              className={`block p-3 rounded-lg transition-colors ${isActive('/settings') ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'hover:bg-slate-700'}`}
            >
              Settings
            </Link>
          </li>
          </ul>
        </nav>
        <div>
          <button onClick={handleLogout} className="w-full p-3 text-left rounded-lg hover:bg-slate-700 transition-colors">
              Logout
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      {/* The <Outlet/> is a placeholder where React Router will render our page components */}
      <main className="flex-1 p-10 overflow-y-auto ml-64">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;