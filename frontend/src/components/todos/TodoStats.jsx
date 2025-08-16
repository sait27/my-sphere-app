import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Target, 
  TrendingUp,
  Calendar
} from 'lucide-react';

const TodoStats = ({ todos = [] }) => {
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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

      {/* Completion Rate Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="col-span-2 md:col-span-3 lg:col-span-6 bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
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
    </div>
  );
};

export default TodoStats;
