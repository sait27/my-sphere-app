import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

function DashboardPage() {
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agenda, setAgenda] = useState(null);
  const userName = "Teja"; // This can be made dynamic later

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const [summaryRes, agendaRes] = await Promise.all([
          apiClient.get('/expenses/summary/'),
          apiClient.get('/lists/agenda/')
        ]);
        setSummaryData(summaryRes.data);
        setAgenda(agendaRes.data);
      } catch (error) {
        console.error("Failed to fetch summary data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  // This logic calculates everything needed for the Budget Orb
  const budgetData = useMemo(() => {
    if (!summaryData || !summaryData.current_budget || parseFloat(summaryData.current_budget) <= 0) {
      return { percentage: 0, color: 'stroke-slate-500', spend: 0, budget: 0 };
    }
    const spend = parseFloat(summaryData.month);
    const budget = parseFloat(summaryData.current_budget);
    let percentage = Math.round((spend / budget) * 100);
    if (percentage > 100) percentage = 100; // Cap percentage at 100 for the visual

    let color = 'stroke-cyan-500'; // Default color
    if (percentage > 75) color = 'stroke-amber-500'; // Warning color
    if (percentage >= 100) color = 'stroke-red-500'; // Over budget color
    
    return { percentage, color, spend, budget };
  }, [summaryData]);

  // Calculations for the SVG circle animation
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (budgetData.percentage / 100) * circumference;

  if (isLoading) {
    return <h2 className="text-3xl font-bold text-white animate-pulse">Loading Dashboard...</h2>;
  }

  return (
    <>
      <h2 className="text-4xl font-bold mb-2 text-white">Welcome Back, {userName}</h2>
      <p className="text-slate-400 mb-8">Here's your financial sphere at a glance.</p>
      
      {/* Summary Cards - Now showing real data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10">
              <h3 className="text-slate-400 text-sm">Spent Today</h3>
              <p className="text-3xl font-bold text-white mt-2">₹{parseFloat(summaryData?.today || 0).toFixed(2)}</p>
          </div>
          <div className="bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10">
              <h3 className="text-slate-400 text-sm">Spent This Week</h3>
              <p className="text-3xl font-bold text-white mt-2">₹{parseFloat(summaryData?.week || 0).toFixed(2)}</p>
          </div>
          <div className="bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10">
              <h3 className="text-slate-400 text-sm">Spent This Month</h3>
              <p className="text-3xl font-bold text-white mt-2">₹{parseFloat(summaryData?.month || 0).toFixed(2)}</p>
          </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10 flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-lg text-white mb-4">Budget Overview</h3>
            <svg width="200" height="200" viewBox="0 0 200 200" className="mb-4 -rotate-90">
                <circle cx="100" cy="100" r={radius} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="10" fill="none" />
                <circle 
                    cx="100" cy="100" r={radius} strokeWidth="10" fill="none"
                    className={`transition-all duration-1000 ease-out ${budgetData.color}`}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
                 <text x="100" y="105" textAnchor="middle" className="fill-white font-bold text-4xl rotate-90 origin-center">
                   {budgetData.percentage}%
                 </text>
                 <text x="100" y="140" textAnchor="middle" className="fill-slate-400 font-medium text-sm rotate-90 origin-center">
                   of budget used
                 </text>
            </svg>
            {budgetData.budget > 0 ? (
                <p className="text-slate-300">Spent <span className="font-bold text-white">₹{budgetData.spend.toFixed(2)}</span> of <span className="font-bold text-white">₹{budgetData.budget.toFixed(2)}</span></p>
            ) : (
                <Link to="/settings" className="text-cyan-400 hover:underline">Set a budget in Settings to activate</Link>
            )}
        </div>
        <div className="lg:col-span-2 bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10">
            <h3 className="font-bold text-lg text-white mb-4">Today's Agenda</h3>
            {isLoading ? (
                <p className="text-slate-400">Loading agenda...</p>
            ) : agenda && agenda.items.length > 0 ? (
                <div>
                    <p className="text-sm text-slate-400 mb-2">From your list: <span className="font-bold">{agenda.list_name}</span></p>
                    <ul className="space-y-2">
                        {agenda.items.map(item => (
                            <li key={item.id} className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 mr-3 bg-slate-700 border-slate-600" />
                                <span>{item.name}</span>
                            </li>
                        ))}
                    </ul>
                    <Link to="/lists" className="text-cyan-400 hover:underline text-sm mt-4 block">View all lists &rarr;</Link>
                </div>
            ) : (
                <p className="text-slate-400 mt-2">No upcoming items. You're all caught up!</p>
            )}
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