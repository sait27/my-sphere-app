import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useDashboard } from '../hooks/useDashboard';
import AIInsights from '../components/dashboard/AIInsights';
import { 
  TrendingUp, Calendar, Target, ArrowRight, DollarSign, 
  Clock, CheckCircle, Plus, BarChart3, PieChart, 
  RefreshCw, MoreHorizontal, ArrowUpRight, Sparkles 
} from 'lucide-react';

function DashboardPage() {
  const { summaryData, agenda, loading: isLoading, error, fetchDashboardData } = useDashboard();
  const userName = "Teja"; // This can be made dynamic later

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

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="animate-pulse space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <div className="h-10 bg-slate-700/50 rounded-lg w-3/4 max-w-md"></div>
            <div className="h-4 bg-slate-700/50 rounded w-1/2 max-w-xs"></div>
          </div>
          
          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-slate-800/50 rounded-2xl border border-slate-700/50"></div>
            ))}
          </div>
          
          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-slate-800/50 rounded-2xl"></div>
            <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <AnimatePresence>
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 relative overflow-hidden rounded-2xl p-8 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/20"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')] opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-amber-300" size={20} />
              <span className="text-sm font-medium bg-amber-500/20 text-amber-200 px-3 py-1 rounded-full">Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
              Welcome back, <span className="text-cyan-300">{userName}</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl">
              Here's your financial sphere at a glance. Track your spending, manage your budget, and stay on top of your financial goals.
            </p>
            <motion.div 
              className="mt-6 flex gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/expenses" className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
                <Plus size={16} />
                Add Transaction
              </Link>
              <Link to="/expenses" className="px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700/70 text-white rounded-lg font-medium flex items-center gap-2 transition-all duration-300 border border-slate-600/50">
                <BarChart3 size={16} />
                View Reports
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Enhanced Summary Cards */}
      <div 
        ref={ref}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
      >
        {/* Today's Spending */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
                <Clock className="text-cyan-400" size={20} />
              </div>
              <div className="flex items-center text-xs font-medium px-2.5 py-1 bg-slate-700/50 rounded-full text-slate-300">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mr-1.5"></div>
                Today
              </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">Spent Today</h3>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                ₹{parseFloat(summaryData?.today || 0).toFixed(2)}
              </p>
              <div className="flex items-center text-xs font-medium px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                <ArrowUpRight size={12} className="mr-1" />
                12%
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-medium">₹1,200</span> more than yesterday
              </p>
            </div>
          </div>
        </motion.div>

        {/* Weekly Spending */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl">
                <Calendar className="text-blue-400" size={20} />
              </div>
              <div className="flex items-center text-xs font-medium px-2.5 py-1 bg-slate-700/50 rounded-full text-slate-300">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
                This Week
              </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">Spent This Week</h3>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">
                ₹{parseFloat(summaryData?.week || 0).toFixed(2)}
              </p>
              <div className="flex items-center text-xs font-medium px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">
                <ArrowUpRight size={12} className="mr-1" />
                5.2%
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-medium">₹3,450</span> more than last week
              </p>
            </div>
          </div>
        </motion.div>

        {/* Monthly Spending */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                <DollarSign className="text-purple-400" size={20} />
              </div>
              <div className="flex items-center text-xs font-medium px-2.5 py-1 bg-slate-700/50 rounded-full text-slate-300">
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></div>
                This Month
              </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">Spent This Month</h3>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">
                ₹{parseFloat(summaryData?.month || 0).toFixed(2)}
              </p>
              <div className="flex items-center text-xs font-medium px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                <ArrowUpRight size={12} className="mr-1" />
                8.7%
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-medium">₹2,150</span> under budget
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Enhanced Budget Overview */}
        <div className="lg:col-span-3 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 animate-scale-in" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                <Target className="text-cyan-400" size={24} />
              </div>
              <h3 className="font-bold text-xl text-white">Budget Overview</h3>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <svg width="220" height="220" viewBox="0 0 220 220" className="animate-float">
                  {/* Background Circle */}
                  <circle cx="110" cy="110" r={radius} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="12" fill="none" />
                  
                  {/* Progress Circle */}
                  <circle 
                      cx="110" cy="110" r={radius} strokeWidth="12" fill="none"
                      className={`transition-all duration-1000 ease-out ${budgetData.color} drop-shadow-lg`}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform="rotate(-90 110 110)"
                      style={{
                        filter: budgetData.percentage > 0 ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' : 'none'
                      }}
                  />
                  
                  {/* Center Text */}
                  <text x="110" y="115" textAnchor="middle" className="fill-white font-bold text-4xl">
                     {budgetData.percentage}%
                   </text>
                   <text x="110" y="140" textAnchor="middle" className="fill-slate-400 font-medium text-sm">
                     of budget used
                   </text>
                </svg>
                
                {/* Floating indicators */}
                {budgetData.percentage > 75 && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 rounded-full animate-pulse" />
                )}
                {budgetData.percentage >= 100 && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              
              {budgetData.budget > 0 ? (
                  <div className="text-center space-y-2">
                    <p className="text-slate-300 text-lg">
                      Spent <span className="font-bold text-white text-xl">₹{budgetData.spend.toFixed(2)}</span> of <span className="font-bold text-cyan-400 text-xl">₹{budgetData.budget.toFixed(2)}</span>
                    </p>
                    <div className="w-full bg-slate-700/50 rounded-full h-2 mt-4">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${budgetData.color.replace('stroke-', 'bg-')}`}
                        style={{ width: `${Math.min(budgetData.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
              ) : (
                  <Link to="/settings" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors group">
                    Set a budget in Settings to activate
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
              )}
            </div>
        </div>
        
        {/* Enhanced Today's Agenda */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 animate-scale-in" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">
                <CheckCircle className="text-green-400" size={20} />
              </div>
              <h3 className="font-bold text-lg text-white">Today's Agenda</h3>
            </div>
            
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                </div>
            ) : error ? (
                <div className="text-center py-8">
                  <div className="text-red-400 mb-2">⚠️</div>
                  <p className="text-slate-400 text-sm">{error}</p>
                  <button 
                    onClick={fetchDashboardData} 
                    className="text-cyan-400 hover:text-cyan-300 text-sm mt-2 transition-colors"
                  >
                    Retry
                  </button>
                </div>
            ) : agenda && agenda.items && agenda.items.length > 0 ? (
                <div>
                    <div className="mb-3">
                        <span className="text-sm text-cyan-400 font-medium">{agenda.list_name}</span>
                    </div>
                    <ul className="space-y-3">
                        {agenda.items.map(item => (
                            <li key={item.id} className="flex items-center p-2 rounded-lg hover:bg-slate-700/30 transition-colors group">
                                <input type="checkbox" className="h-4 w-4 mr-3 bg-slate-700 border-slate-600 rounded focus:ring-green-500 focus:ring-2" />
                                <span className="group-hover:text-white transition-colors">{item.name}</span>
                                {item.quantity && (
                                    <span className="ml-auto text-xs text-slate-400">{item.quantity}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                    <Link to="/lists" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm mt-4 transition-colors group">
                      View all lists 
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto text-green-400 mb-3" size={32} />
                  <p className="text-slate-400">No upcoming items. You're all caught up!</p>
                </div>
            )}
        </div>
        
        {/* Enhanced AI Insights */}
        <div className="lg:col-span-5">
          <AIInsights />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;