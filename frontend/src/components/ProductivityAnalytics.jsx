import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Target, 
  Calendar,
  Award,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Star,
  Users,
  Brain,
  ChevronRight,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProductivityAnalytics = ({ 
  todos = [], 
  timeEntries = [], 
  goals = [],
  dateRange = '7d', // 7d, 30d, 90d, 1y
  onDateRangeChange,
  isVisible = false 
}) => {
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState([]);

  // Calculate date boundaries
  const getDateBoundary = (range) => {
    const now = new Date();
    switch (range) {
      case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now - 90 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
  };

  const dateBoundary = getDateBoundary(dateRange);

  // Filter data by date range
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => new Date(todo.created_at) >= dateBoundary);
  }, [todos, dateBoundary]);

  const filteredTimeEntries = useMemo(() => {
    return timeEntries.filter(entry => new Date(entry.created_at) >= dateBoundary);
  }, [timeEntries, dateBoundary]);

  // Core Metrics Calculations
  const metrics = useMemo(() => {
    const completedTasks = filteredTodos.filter(t => t.status === 'completed');
    const totalTasks = filteredTodos.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    
    const totalTimeSpent = filteredTimeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
    const avgTimePerTask = completedTasks.length > 0 ? totalTimeSpent / completedTasks.length : 0;
    
    const overdueTasks = filteredTodos.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length;
    
    const highPriorityCompleted = completedTasks.filter(t => 
      t.priority === 'high' || t.priority === 'urgent'
    ).length;
    
    const productivityScore = Math.min(100, 
      (completionRate * 0.4) + 
      (Math.min(100, (totalTimeSpent / 1000)) * 0.3) +
      (Math.max(0, 100 - (overdueTasks * 10)) * 0.3)
    );

    return {
      totalTasks,
      completedTasks: completedTasks.length,
      completionRate,
      totalTimeSpent,
      avgTimePerTask,
      overdueTasks,
      highPriorityCompleted,
      productivityScore,
      tasksPerDay: totalTasks / parseInt(dateRange.replace('d', '') || '7'),
      focusTime: totalTimeSpent / 60, // in hours
    };
  }, [filteredTodos, filteredTimeEntries, dateRange]);

  // Task Distribution by Type
  const taskDistribution = useMemo(() => {
    const distribution = filteredTodos.reduce((acc, todo) => {
      acc[todo.task_type] = (acc[todo.task_type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percentage: (count / filteredTodos.length) * 100
    }));
  }, [filteredTodos]);

  // Daily productivity trend
  const dailyTrend = useMemo(() => {
    const days = {};
    const dayCount = parseInt(dateRange.replace('d', '')) || 7;
    
    // Initialize all days
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      days[dateKey] = { completed: 0, created: 0, timeSpent: 0 };
    }
    
    // Count completed tasks
    filteredTodos.forEach(todo => {
      if (todo.completed_at) {
        const dateKey = todo.completed_at.split('T')[0];
        if (days[dateKey]) days[dateKey].completed++;
      }
      
      const createdDate = todo.created_at.split('T')[0];
      if (days[createdDate]) days[createdDate].created++;
    });
    
    // Add time spent
    filteredTimeEntries.forEach(entry => {
      const dateKey = entry.created_at.split('T')[0];
      if (days[dateKey]) {
        days[dateKey].timeSpent += entry.duration_minutes || 0;
      }
    });
    
    return Object.entries(days).map(([date, data]) => ({
      date,
      ...data,
      productivity: data.completed * 2 + (data.timeSpent / 60)
    }));
  }, [filteredTodos, filteredTimeEntries, dateRange]);

  // Priority Performance
  const priorityPerformance = useMemo(() => {
    const priorities = ['low', 'medium', 'high', 'urgent'];
    return priorities.map(priority => {
      const tasks = filteredTodos.filter(t => t.priority === priority);
      const completed = tasks.filter(t => t.status === 'completed');
      return {
        priority,
        total: tasks.length,
        completed: completed.length,
        rate: tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0
      };
    });
  }, [filteredTodos]);

  // AI Insights Generation
  useEffect(() => {
    const generateInsights = () => {
      const newInsights = [];
      
      // Completion Rate Insight
      if (metrics.completionRate > 80) {
        newInsights.push({
          type: 'success',
          title: 'Excellent Task Completion',
          message: `You're completing ${metrics.completionRate.toFixed(1)}% of your tasks. Keep up the great work!`,
          icon: Award,
          score: 95
        });
      } else if (metrics.completionRate < 50) {
        newInsights.push({
          type: 'warning',
          title: 'Low Completion Rate',
          message: `Only ${metrics.completionRate.toFixed(1)}% completion rate. Consider breaking down large tasks.`,
          icon: AlertTriangle,
          score: 30
        });
      }
      
      // Time Management Insight
      if (metrics.avgTimePerTask > 120) {
        newInsights.push({
          type: 'info',
          title: 'Time Optimization Opportunity',
          message: `Average ${(metrics.avgTimePerTask / 60).toFixed(1)}h per task. Consider time-boxing techniques.`,
          icon: Clock,
          score: 60
        });
      }
      
      // Overdue Tasks Insight
      if (metrics.overdueTasks > 0) {
        newInsights.push({
          type: 'error',
          title: 'Overdue Tasks Alert',
          message: `${metrics.overdueTasks} overdue tasks need attention. Prioritize these first.`,
          icon: AlertTriangle,
          score: 20
        });
      }
      
      // Productivity Trend
      const recentProductivity = dailyTrend.slice(-3).reduce((sum, day) => sum + day.productivity, 0) / 3;
      const earlierProductivity = dailyTrend.slice(0, 3).reduce((sum, day) => sum + day.productivity, 0) / 3;
      
      if (recentProductivity > earlierProductivity * 1.2) {
        newInsights.push({
          type: 'success',
          title: 'Productivity Trending Up',
          message: 'Your productivity has increased significantly in recent days!',
          icon: TrendingUp,
          score: 85
        });
      } else if (recentProductivity < earlierProductivity * 0.8) {
        newInsights.push({
          type: 'warning',
          title: 'Productivity Declining',
          message: 'Consider taking a break or reviewing your task management approach.',
          icon: TrendingDown,
          score: 40
        });
      }
      
      setInsights(newInsights.sort((a, b) => b.score - a.score));
    };
    
    if (filteredTodos.length > 0) {
      generateInsights();
    }
  }, [metrics, dailyTrend, filteredTodos]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate API refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Analytics refreshed');
    } catch (error) {
      toast.error('Failed to refresh analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const data = {
      metrics,
      taskDistribution,
      dailyTrend,
      priorityPerformance,
      insights,
      dateRange,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-analytics-${dateRange}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Analytics exported');
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Productivity Analytics</h2>
          <p className="text-slate-400">Track your performance and optimize your workflow</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange?.(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          {/* Actions */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={handleExport}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6 rounded-xl border border-blue-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CheckCircle2 className="text-blue-400" size={20} />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.productivityScore)}`}>
              {metrics.productivityScore.toFixed(0)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-white">Productivity Score</div>
            <div className="text-sm text-slate-400">
              Based on completion rate, time efficiency, and deadline adherence
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-6 rounded-xl border border-green-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Target className="text-green-400" size={20} />
            </div>
            <div className="text-2xl font-bold text-green-400">
              {metrics.completionRate.toFixed(1)}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-white">Completion Rate</div>
            <div className="text-sm text-slate-400">
              {metrics.completedTasks} of {metrics.totalTasks} tasks completed
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 rounded-xl border border-purple-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Clock className="text-purple-400" size={20} />
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {formatDuration(metrics.totalTimeSpent)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-white">Focus Time</div>
            <div className="text-sm text-slate-400">
              Avg {formatDuration(metrics.avgTimePerTask)} per task
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-6 rounded-xl border border-orange-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Zap className="text-orange-400" size={20} />
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {metrics.tasksPerDay.toFixed(1)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-white">Tasks per Day</div>
            <div className="text-sm text-slate-400">
              {metrics.overdueTasks} overdue tasks
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <TrendingUp className="text-cyan-400" size={20} />
              Daily Productivity Trend
            </h3>
          </div>
          
          <div className="space-y-4">
            {dailyTrend.map((day, index) => {
              const maxProductivity = Math.max(...dailyTrend.map(d => d.productivity));
              const width = maxProductivity > 0 ? (day.productivity / maxProductivity) * 100 : 0;
              
              return (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-16 text-xs text-slate-400">
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 bg-slate-700/30 rounded-full h-2 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full"
                    />
                  </div>
                  <div className="text-xs text-slate-400 w-12 text-right">
                    {day.completed}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Priority Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <BarChart3 className="text-purple-400" size={20} />
              Priority Performance
            </h3>
          </div>
          
          <div className="space-y-4">
            {priorityPerformance.map((priority) => {
              const color = priority.priority === 'urgent' ? 'red' : 
                          priority.priority === 'high' ? 'orange' :
                          priority.priority === 'medium' ? 'yellow' : 'green';
              
              return (
                <div key={priority.priority} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white capitalize">
                      {priority.priority}
                    </span>
                    <span className="text-sm text-slate-400">
                      {priority.completed}/{priority.total} ({priority.rate.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/30 rounded-full h-2">
                    <div
                      className={`bg-${color}-500 h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${priority.rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
              <Brain className="text-purple-400" size={20} />
            </div>
            <h3 className="font-bold text-lg text-white">AI Insights</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              const typeColors = {
                success: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
                warning: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
                error: 'from-red-500/20 to-pink-500/20 border-red-500/30',
                info: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
              };
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-br ${typeColors[insight.type]} p-4 rounded-xl border`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-black/20 rounded-lg">
                      <Icon size={16} className="text-current" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm mb-1">
                        {insight.title}
                      </div>
                      <div className="text-xs text-slate-300">
                        {insight.message}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Task Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
            <PieChart className="text-cyan-400" size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Task Distribution</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {taskDistribution.map((item, index) => (
            <div key={item.type} className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${item.percentage * 1.76} 176`}
                    className="text-cyan-400"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium text-white capitalize mb-1">
                {item.type}
              </div>
              <div className="text-xs text-slate-400">
                {item.count} tasks
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProductivityAnalytics;
