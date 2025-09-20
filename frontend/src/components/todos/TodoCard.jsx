import React from 'react';
import { Clock, Calendar, Tag, MessageCircle, Paperclip, CheckCircle2, Circle } from 'lucide-react';
import TimeTracker from './TimeTracker';

const TodoCard = ({ todo, onUpdate, onDelete }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-500/20 text-red-300 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      low: 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-500/20 text-green-300',
      in_progress: 'bg-blue-500/20 text-blue-300',
      pending: 'bg-gray-500/20 text-gray-300'
    };
    return colors[status] || colors.pending;
  };

  const handleToggleComplete = () => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    onUpdate(todo.id, { status: newStatus });
  };

  return (
    <div className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleComplete}
            className="text-slate-400 hover:text-blue-400 transition-all duration-200 hover:scale-110"
          >
            {todo.status === 'completed' ? 
              <CheckCircle2 size={22} className="text-green-400 drop-shadow-lg" /> : 
              <Circle size={22} className="hover:text-blue-400" />
            }
          </button>
          <div>
            <h3 className={`font-semibold text-lg ${todo.status === 'completed' ? 'line-through text-slate-500' : 'text-white group-hover:text-blue-100'} transition-colors`}>
              {todo.title}
            </h3>
            {todo.ai_category && (
              <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full mt-1 inline-block">
                AI: {todo.ai_category}
              </span>
            )}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getPriorityColor(todo.priority)} shadow-lg`}>
          {todo.priority.toUpperCase()}
        </div>
      </div>

      {todo.description && (
        <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">{todo.description}</p>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {todo.due_date && (
            <div className="flex items-center gap-1 bg-slate-700/30 px-2 py-1 rounded-lg">
              <Calendar size={12} className="text-blue-400" />
              {new Date(todo.due_date).toLocaleDateString()}
            </div>
          )}
          {todo.estimated_duration && (
            <div className="flex items-center gap-1 bg-slate-700/30 px-2 py-1 rounded-lg">
              <Clock size={12} className="text-green-400" />
              {todo.estimated_duration}m
            </div>
          )}
          {todo.tag_assignments?.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-700/30 px-2 py-1 rounded-lg">
              <Tag size={12} className="text-yellow-400" />
              {todo.tag_assignments.length}
            </div>
          )}
          {todo.comments?.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-700/30 px-2 py-1 rounded-lg">
              <MessageCircle size={12} className="text-purple-400" />
              {todo.comments.length}
            </div>
          )}
          {todo.attachments?.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-700/30 px-2 py-1 rounded-lg">
              <Paperclip size={12} className="text-orange-400" />
              {todo.attachments.length}
            </div>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getStatusColor(todo.status)} shadow-lg`}>
          {todo.status.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      {todo.ai_priority_score > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1 bg-slate-700/30 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(todo.ai_priority_score * 10, 100)}%` }}
            />
          </div>
          <span className="text-xs text-purple-400 font-medium">
            AI: {todo.ai_priority_score.toFixed(1)}
          </span>
        </div>
      )}

      {todo.status !== 'completed' && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <TimeTracker taskId={todo.id} onTimeUpdate={() => onUpdate(todo.id, {})} />
        </div>
      )}
      
      {todo.ai_suggestions && (
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300 leading-relaxed">
            💡 {todo.ai_suggestions}
          </p>
        </div>
      )}
    </div>
  );
};

export default TodoCard;