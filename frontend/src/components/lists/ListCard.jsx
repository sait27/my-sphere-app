// components/ListCard.jsx

import React, { useState } from 'react';
import { 
  ListChecks, Edit3, Trash2, Copy, Share2, Eye, 
  CheckCircle, Circle, Calendar, Star, Users,
  MoreHorizontal, Archive, Target, TrendingUp
} from 'lucide-react';

const ListCard = ({ 
  list, 
  index, 
  viewMode = 'grid', 
  bulkMode = false, 
  isSelected = false, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onViewDetails
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(list.name);

  const handleEdit = async () => {
    if (!editName.trim() || editName.trim() === list.name) {
      setIsEditing(false);
      setEditName(list.name);
      return;
    }
    try {
      await onEdit(list.id, { name: editName.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit list name:', error);
      // Optionally, show a toast notification for the error
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditName(list.name);
      setIsEditing(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'shopping': return '🛒';
      case 'todo': return '✅';
      case 'inventory': return '📦';
      case 'wishlist': return '⭐';
      case 'packing': return '🧳';
      case 'recipe': return '👨‍🍳';
      default: return '📝';
    }
  };

  const completionPercentage = list.completion_percentage || 0;
  const isCompleted = completionPercentage === 100;

  if (viewMode === 'list') {
    return (
      <div 
        className={`group bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-4 rounded-xl border transition-all duration-300 hover:shadow-lg animate-slide-up ${
          isSelected 
            ? 'border-cyan-500/50 bg-cyan-500/10' 
            : 'border-slate-700/50 hover:border-slate-600/50'
        }`}
        style={{animationDelay: `${0.05 * index}s`}}
        role="article"
        aria-label={`List: ${list.name}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {bulkMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
            />
          )}
          
          <div className="flex items-center gap-3 flex-1">
            <div className="text-2xl">{getTypeIcon(list.list_type)}</div>
            
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleEdit}
                  onKeyDown={handleKeyPress}
                  className="bg-slate-700 text-white rounded px-2 py-1 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  autoFocus
                />
              ) : (
                <h3 
                  className={`text-lg font-semibold cursor-pointer hover:text-cyan-400 transition-colors ${
                    isCompleted ? 'text-green-400' : 'text-white'
                  }`}
                  onClick={() => onViewDetails(list)}
                >
                  {list.name}
                </h3>
              )}
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-slate-400 mt-1">
                <span>{list.items_count || 0} items</span>
                <span>{list.completed_items_count || 0} completed</span>
                <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${getPriorityColor(list.priority)}`}>
                  {list.priority}
                </span>
                {list.is_shared && (
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <Users size={12} />
                    <span>Shared</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 sm:mt-0">
            <div className="text-right">
              <div className={`text-lg font-bold ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                {completionPercentage.toFixed(0)}%
              </div>
              <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                aria-label="Edit list name"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => onViewDetails(list)}
                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="View list details"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => onDelete(list.id)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
                aria-label="Delete list"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border transition-all duration-300 hover:shadow-2xl animate-scale-in ${
        isSelected 
          ? 'border-cyan-500/50 shadow-cyan-500/20' 
          : 'border-slate-700/50 hover:border-slate-600/50 hover:shadow-slate-900/50'
      }`}
      style={{animationDelay: `${0.1 * index}s`}}
      role="article"
      aria-label={`List: ${list.name}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {bulkMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
            />
          )}
          
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
            <div className="text-2xl">{getTypeIcon(list.list_type)}</div>
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleEdit}
                onKeyDown={handleKeyPress}
                className="bg-slate-700 text-white rounded px-2 py-1 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"
                autoFocus
                aria-label="Edit list name"
              />
            ) : (
              <button 
                className={`text-lg font-bold mb-1 text-left hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/20 rounded ${
                  isCompleted ? 'text-green-400' : 'text-white'
                }`}
                onClick={() => onViewDetails(list)}
                aria-label={`View details for ${list.name}`}
              >
                {list.name}
              </button>
            )}
            
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span className="capitalize whitespace-nowrap">{list.list_type.replace('_', ' ')}</span>
              <span className="hidden sm:inline">•</span>
              <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${getPriorityColor(list.priority)}`}>
                {list.priority}
              </span>
            </div>
          </div>
        </div>
        
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            aria-label="More actions"
            aria-expanded={showActions}
          >
            <MoreHorizontal size={16} />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-40 animate-scale-in">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowActions(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Edit3 size={14} />
                Edit
              </button>
              <button
                onClick={() => {
                  onDuplicate(list);
                  setShowActions(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Copy size={14} />
                Duplicate
              </button>
              <hr className="border-slate-700 my-1" />
              <button
                onClick={() => {
                  onDelete(list.id);
                  setShowActions(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-700/30 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Circle size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400">Total Items</span>
          </div>
          <div className="text-xl font-bold text-white">{list.items_count || 0}</div>
        </div>
        
        <div className="bg-slate-700/30 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={14} className="text-green-400" />
            <span className="text-xs text-slate-400">Completed</span>
          </div>
          <div className="text-xl font-bold text-green-400">{list.completed_items_count || 0}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progress</span>
          <span className={`text-sm font-semibold ${isCompleted ? 'text-green-400' : 'text-white'}`}>
            {completionPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              isCompleted 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
          {list.due_date && (
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Calendar size={12} />
              <span>{new Date(list.due_date).toLocaleDateString()}</span>
            </div>
          )}
          {list.is_shared && (
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Users size={12} />
              <span>Shared</span>
            </div>
          )}
          <span className="whitespace-nowrap">Updated {new Date(list.updated_at).toLocaleDateString()}</span>
        </div>
        
        <button
          onClick={() => onViewDetails(list)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 whitespace-nowrap"
          aria-label={`View details for ${list.name}`}
        >
          <Eye size={14} />
          View
        </button>
      </div>
      
      {/* Click outside to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default ListCard;
