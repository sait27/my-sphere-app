import React from 'react';
import { Target, Calendar, TrendingUp } from 'lucide-react';

const GoalCard = ({ goal, onUpdate, onDelete }) => {
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-300',
      paused: 'bg-yellow-500/20 text-yellow-300',
      completed: 'bg-blue-500/20 text-blue-300',
      archived: 'bg-gray-500/20 text-gray-300'
    };
    return colors[status] || colors.active;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-500/20 text-red-300 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      low: 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-2">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Target size={24} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-white group-hover:text-blue-100 transition-colors">{goal.title}</h3>
            <p className="text-sm text-slate-400 mt-1">
              <span className="bg-slate-700/50 px-2 py-1 rounded-full">
                {goal.task_count} tasks
              </span>
            </p>
          </div>
        </div>
        <div className={`px-3 py-2 rounded-full text-xs font-bold border backdrop-blur-sm ${getPriorityColor(goal.priority)} shadow-lg`}>
          {goal.priority.toUpperCase()}
        </div>
      </div>

      {goal.description && (
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{goal.description}</p>
      )}

      {/* Enhanced Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-300">Progress</span>
          <span className="text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {goal.progress_percentage}%
          </span>
        </div>
        <div className="relative">
          <div className="w-full bg-slate-700/50 rounded-full h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden"
              style={{ width: `${goal.progress_percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg animate-pulse" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {goal.target_date && (
            <div className="flex items-center gap-2 bg-slate-700/30 px-3 py-2 rounded-lg">
              <Calendar size={14} className="text-blue-400" />
              <span className="font-medium">{new Date(goal.target_date).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-700/30 px-3 py-2 rounded-lg">
            <TrendingUp size={14} className="text-green-400" />
            <span className="font-medium">{goal.progress_percentage}% complete</span>
          </div>
        </div>
        <div className={`px-3 py-2 rounded-full text-xs font-bold backdrop-blur-sm ${getStatusColor(goal.status)} shadow-lg`}>
          {goal.status.toUpperCase()}
        </div>
      </div>

      {goal.ai_insights && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <div className="p-1 bg-purple-500/20 rounded-lg">
              <span className="text-purple-400 text-xs">🧠</span>
            </div>
            <p className="text-xs text-purple-300 leading-relaxed font-medium">{goal.ai_insights}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalCard;