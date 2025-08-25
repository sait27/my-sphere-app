import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Target, 
  TrendingUp,
  Calendar,
  BarChart4,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import TrendsDashboard from './Dashboard/TrendsDashboard'; // Import the TrendsDashboard component

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const TodoStats = ({ todos = [] }) => {
  const [activeView, setActiveView] = useState('summary'); // 'summary', 'trends', 'categories'
  
  // Basic stats calculations
  const totalTasks = todos.length;
  const completedTasks = todos.filter(todo => todo.is_completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const overdueTasks = todos.filter(todo => 
    !todo.is_completed && 
    todo.due_date && 
    new Date(todo.due_date) < new Date()
  ).length;

  const highPriorityTasks = todos.filter(todo => 
    !todo.is_completed && todo.priority === 'high'
  ).length;

  const upcomingTasks = todos.filter(todo => {
    if (!todo.due_date || todo.is_completed) return false;
    const dueDate = new Date(todo.due_date);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return dueDate >= today && dueDate <= nextWeek;
  }).length;
  
  // Advanced analytics - Task completion by day of week
  const getCompletionByDayOfWeek = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCount = Array(7).fill(0);
    
    todos.filter(todo => todo.is_completed && todo.completed_at).forEach(todo => {
      const completedDay = new Date(todo.completed_at).getDay();
      dayCount[completedDay]++;
    });
    
    return {
      labels: dayNames,
      datasets: [
        {
          label: 'Tasks Completed',
          data: dayCount,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Task distribution by priority
  const getPriorityDistribution = () => {
    const highCount = todos.filter(todo => todo.priority === 'high').length;
    const mediumCount = todos.filter(todo => todo.priority === 'medium').length;
    const lowCount = todos.filter(todo => todo.priority === 'low').length;
    const noPriorityCount = todos.filter(todo => !todo.priority).length;
    
    return {
      labels: ['High', 'Medium', 'Low', 'No Priority'],
      datasets: [
        {
          data: [highCount, mediumCount, lowCount, noPriorityCount],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(107, 114, 128, 0.8)'
          ],
          borderColor: [
            'rgba(239, 68, 68, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(107, 114, 128, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Calculate productivity trend (completed tasks in last 7 days vs previous 7 days)
  const getProductivityTrend = () => {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);
    
    const lastWeekCompleted = todos.filter(todo => 
      todo.is_completed && 
      todo.completed_at && 
      new Date(todo.completed_at) >= oneWeekAgo &&
      new Date(todo.completed_at) <= today
    ).length;
    
    const previousWeekCompleted = todos.filter(todo => 
      todo.is_completed && 
      todo.completed_at && 
      new Date(todo.completed_at) >= twoWeeksAgo &&
      new Date(todo.completed_at) < oneWeekAgo
    ).length;
    
    const percentChange = previousWeekCompleted === 0 
      ? lastWeekCompleted > 0 ? 100 : 0
      : Math.round(((lastWeekCompleted - previousWeekCompleted) / previousWeekCompleted) * 100);
    
    return {
      current: lastWeekCompleted,
      previous: previousWeekCompleted,
      percentChange,
      improved: percentChange >= 0
    };
  };
  
  const productivityTrend = getProductivityTrend();
  
  const stats = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-400'
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-400'
    },
    {
      label: 'Pending',
      value: pendingTasks,
      icon: Clock,
      color: 'from-yellow-500 to-orange-500',
      textColor: 'text-yellow-400'
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-500',
      textColor: 'text-red-400'
    },
    {
      label: 'High Priority',
      value: highPriorityTasks,
      icon: TrendingUp,
      color: 'from-purple-500 to-indigo-500',
      textColor: 'text-purple-400'
    },
    {
      label: 'Due This Week',
      value: upcomingTasks,
      icon: Calendar,
      color: 'from-teal-500 to-cyan-500',
      textColor: 'text-teal-400'
    }
  ];

  return (
    <div className="mb-8">
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Task Analytics</h2>
        <div className="flex bg-slate-800/70 rounded-lg p-1">
          <button 
            onClick={() => setActiveView('summary')} 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'summary' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Summary
          </button>
          <button 
            onClick={() => setActiveView('trends')} 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'trends' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Trends
          </button>
          <button 
            onClick={() => setActiveView('categories')} 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'categories' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Categories
          </button>
        </div>
      </div>

      {/* Content based on activeView */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={activeView} // Key to trigger re-animation on view change
      >
        {activeView === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className={`relative p-5 rounded-xl shadow-lg overflow-hidden bg-gradient-to-br ${stat.color}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-black opacity-20"></div>
                <div className="relative z-10 flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white opacity-80">{stat.label}</h3>
                  <stat.icon size={20} className={`text-white opacity-70 ${stat.textColor}`} />
                </div>
                <p className="relative z-10 text-3xl font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}

            {/* Productivity Trend Card */}
            <motion.div
              className="relative p-5 rounded-xl shadow-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 md:col-span-2 lg:col-span-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: stats.length * 0.05 }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-black opacity-20"></div>
              <div className="relative z-10 flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white opacity-80">Productivity Trend (Last 7 Days)</h3>
                <TrendingUp size={20} className="text-purple-400" />
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{productivityTrend.current} Tasks</p>
                  <p className="text-sm text-white opacity-80">Completed this week</p>
                </div>
                <div className={`flex items-center text-lg font-semibold ${productivityTrend.improved ? 'text-green-400' : 'text-red-400'}`}>
                  {productivityTrend.improved ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  {Math.abs(productivityTrend.percentChange)}%
                </div>
              </div>
              <p className="relative z-10 text-xs text-white opacity-60 mt-2">vs. previous 7 days ({productivityTrend.previous} tasks)</p>
            </motion.div>
          </div>
        )}

        {activeView === 'trends' && (
          <div className="space-y-4">
            <TrendsDashboard todos={todos} /> {/* Render the TrendsDashboard component */}
            {/* Add other trend-related components here */}
          </div>
        )}

        {activeView === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority Distribution Chart */}
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart size={18} className="text-blue-400" />
                Task Distribution by Priority
              </h3>
              <div className="h-64">
                <Pie data={getPriorityDistribution()} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </motion.div>

            {/* Completion by Day of Week Chart */}
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart4 size={18} className="text-blue-400" />
                Tasks Completed by Day of Week
              </h3>
              <div className="h-64">
                <Bar data={getCompletionByDayOfWeek()} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TodoStats;
