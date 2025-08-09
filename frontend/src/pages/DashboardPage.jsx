import { useEffect, useState } from 'react';
import apiClient from '../api/axiosConfig';

function DashboardPage() {
  const [summaryData, setSummaryData] = useState({
    today: "0.00",
    week: "0.00",
    month: "0.00"
  });
  
  const [userName, setUserName] = useState("User"); 

  // In the future, a useEffect hook will go here to fetch the real summary data and user name.

  return (
    <>
      <h2 className="text-4xl font-bold mb-2 text-white">Welcome Back, {userName}</h2>
      <p className="text-slate-400 mb-8">Here's your financial sphere at a glance.</p>
      
      {/* Summary Cards */}
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

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
                <circle cx="100" cy="100" r="80" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="4" fill="none" className="animate-pulse" filter="url(#glow)"/>
                <text x="100" y="105" textAnchor="middle" className="fill-white font-bold text-4xl">75%</text>
                <text x="100" y="140" textAnchor="middle" className="fill-slate-400 font-medium text-sm">of budget used</text>
            </svg>
        </div>
        
        <div className="lg:col-span-2 bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10">
            <h3 className="font-bold text-lg text-white">AI Insights</h3>
            <p className="text-slate-400 mt-2">Your proactive AI insights will appear here.</p>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;