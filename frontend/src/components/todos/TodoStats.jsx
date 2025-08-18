import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
      
      {/* Summary View */}
      {activeView === 'summary' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 bg-gradient-to-r ${stat.color} rounded-lg`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-2xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </span>
                </div>
                <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Completion Rate Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold">Completion Rate</h3>
              <span className="text-2xl font-bold text-blue-400">{completionRate}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ delay: 0.8, duration: 1 }}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full"
              />
            </div>
            <p className="text-slate-400 text-sm mt-2">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </motion.div>
          
          {/* Weekly Productivity Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold">Weekly Productivity</h3>
              <div className={`flex items-center gap-1 ${productivityTrend.improved ? 'text-green-400' : 'text-red-400'}`}>
                <span className="text-lg font-bold">{Math.abs(productivityTrend.percentChange)}%</span>
                {productivityTrend.improved ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
            </div>
            <p className="text-slate-400 text-sm">
              {productivityTrend.current} tasks completed this week vs {productivityTrend.previous} last week
            </p>
          </motion.div>
        </>
      )}
      
      {/* Trends View */}
      {activeView === 'trends' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart4 size={18} />
            Task Completion by Day of Week
          </h3>
          <div className="h-64">
            <Bar 
              data={getCompletionByDayOfWeek()} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  },
                  x: {
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  }
                },
                plugins: {
                  legend: {
                    labels: { color: 'rgba(255, 255, 255, 0.7)' }
                  }
                }
              }}
            />
          </div>
        </motion.div>
      )}
      
      {/* Categories View */}
      {activeView === 'categories' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <PieChart size={18} />
            Task Distribution by Priority
          </h3>
          <div className="flex justify-center">
            <div className="h-64 w-64">
              <Pie 
                data={getPriorityDistribution()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { color: 'rgba(255, 255, 255, 0.7)' }
                    }
                  }
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TodoStats;
