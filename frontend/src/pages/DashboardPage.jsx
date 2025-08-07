import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import AnimatedBackground from '../components/AnimatedBackground';

function DashboardPage() {
  const navigate = useNavigate();
  // We will use this state later to make the summary data dynamic
  const [summaryData, setSummaryData] = useState({
    today: "0.00",
    week: "0.00",
    month: "0.00"
  });
  
  const userName = "Teja"; // We can make this dynamic later

  // This function handles logging the user out
  const handleLogout = () => {
    localStorage.clear();
    delete apiClient.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  // In a future step, we will add a useEffect hook here to fetch the real summary data
  // For now, we will use the sample data above.

  return (
    // Main container with a relative position for the background
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-gray-200 font-sans animate-gradient-xy">
      <AnimatedBackground />
      
      <div className="flex">
      
        {/* --- Sidebar with "Frosted Glass" effect --- */}
        <div className="w-64 h-screen p-5 bg-black/20 backdrop-blur-lg border-r border-white/10 flex flex-col fixed">
          <h1 className="text-2xl font-bold text-white mb-10">My Sphere</h1>
          <nav className="flex-grow">
            <ul>
              {/* Active link has a "glow" effect */}
              <li className="mb-4"><Link to="/dashboard" className="block p-3 bg-cyan-500/20 text-cyan-300 rounded-lg font-bold shadow-lg shadow-cyan-500/10">Dashboard Hub</Link></li>
              <li className="mb-4"><Link to="/expenses" className="block p-3 rounded-lg hover:bg-white/10 transition-colors">Expenses</Link></li>
              {/* Add more links later */}
            </ul>
          </nav>
          <div>
            <button onClick={handleLogout} className="w-full p-3 text-left rounded-lg hover:bg-white/10 transition-colors">
                Logout
            </button>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <main className="flex-1 p-10 ml-64">
          <h2 className="text-4xl font-bold mb-2 text-white">Welcome Back, {userName}</h2>
          <p className="text-slate-400 mb-8">Here's your financial sphere at a glance.</p>
          
          {/* Summary Cards with "Frosted Glass" effect */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10">
                  <h3 className="text-slate-400 text-sm">Spent Today</h3>
                  <p className="text-3xl font-bold text-white mt-2">₹{summaryData.today}</p>
              </div>
              <div className="bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10">
                  <h3 className="text-slate-400 text-sm">Spent This Week</h3>
                  <p className="text-3xl font-bold text-white mt-2">₹{summaryData.week}</p>
              </div>
              <div className="bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10">
                  <h3 className="text-slate-400 text-sm">Spent This Month</h3>
                  <p className="text-3xl font-bold text-white mt-2">₹{summaryData.month}</p>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* The "Budget Orb" with a Pulsing SVG */}
            <div className="lg:col-span-3 bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10 flex flex-col items-center justify-center text-center">
                <h3 className="font-bold text-lg text-white mb-4">Budget Overview</h3>
                <svg width="200" height="200" viewBox="0 0 200 200" className="mb-4">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="7.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <circle 
                        cx="100" 
                        cy="100" 
                        r="80" 
                        stroke="rgba(0, 255, 255, 0.5)" 
                        strokeWidth="4" 
                        fill="none"
                        className="animate-pulse"
                        filter="url(#glow)"
                    />
                     <text x="100" y="105" textAnchor="middle" className="fill-white font-bold text-4xl">75%</text>
                     <text x="100" y="140" textAnchor="middle" className="fill-slate-400 font-medium text-sm">of budget used</text>
                </svg>
            </div>
            
            {/* AI Insights */}
            <div className="lg:col-span-2 bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10">
                <h3 className="font-bold text-lg text-white">AI Insights</h3>
                <p className="text-slate-400 mt-2">Your proactive AI insights will appear here.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;