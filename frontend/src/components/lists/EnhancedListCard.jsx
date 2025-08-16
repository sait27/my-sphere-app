// components/EnhancedListCard.jsx

import React, { useState } from 'react';
import { 
  Package, Users, Calendar, MoreVertical, Edit3, 
  Trash2, Copy, Share2, Archive, CheckCircle, 
  Circle, Star, Clock, TrendingUp
} from 'lucide-react';
import { useLists } from '../../hooks/useLists';
import toast from 'react-hot-toast';

const EnhancedListCard = ({ 
  list, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onSelect,
  isSelected,
  showActions = true 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { updateList } = useLists();

  const completionPercentage = list.completion_percentage || 0;
  const totalItems = list.total_items || 0;
  const completedItems = list.completed_items || 0;
  const pendingItems = totalItems - completedItems;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'from-red-500/20 to-pink-500/20 border-red-500/30';
      case 'medium': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 'low': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      default: return 'from-slate-500/20 to-gray-500/20 border-slate-500/30';
    }
  };

  const getListTypeIcon = (type) => {
    switch (type) {
      case 'shopping': return '🛒';
      case 'todo': return '✅';
      case 'work': return '💼';
      case 'personal': return '👤';
      case 'travel': return '✈️';
      case 'health': return '🏥';
      default: return '📝';
    }
  };

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    try {
      await updateList(list.id, { is_favorite: !list.is_favorite });
      toast.success(list.is_favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  const handleShareList = async (list) => {
    // This will be handled by the ShareListModal
    onShare?.(list);
  };

  const handleMenuAction = (action, e) => {
    e.stopPropagation();
    setShowMenu(false);
    
    switch (action) {
      case 'edit':
        onEdit?.(list);
        break;
      case 'duplicate':
        onDuplicate?.(list);
        break;
      case 'delete':
        onDelete?.(list);
        break;
      case 'share':
        handleShareList(list);
        break;
      case 'archive':
        updateList(list.id, { is_archived: !list.is_archived });
        break;
    }
  };

  return (
    <div
      className={`group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-2xl ${
        isSelected 
          ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20' 
          : 'border-slate-700/50 hover:border-slate-600/50'
      } ${getPriorityColor(list.priority)}`}
      onClick={() => onSelect?.(list)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Priority Indicator */}
      {list.priority && list.priority !== 'none' && (
        <div className={`absolute top-3 left-3 w-2 h-2 rounded-full ${
          list.priority === 'high' ? 'bg-red-400' :
          list.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
        }`} />
      )}

      {/* Favorite Star */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-3 right-12 p-1 rounded-lg transition-all duration-200 ${
          list.is_favorite 
            ? 'text-yellow-400 bg-yellow-500/20' 
            : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10'
        } ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <Star size={16} fill={list.is_favorite ? 'currentColor' : 'none'} />
      </button>

      {/* Menu Button */}
      {showActions && (
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <MoreVertical size={16} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-10 py-2 min-w-[160px]">
              <button
                onClick={(e) => handleMenuAction('edit', e)}
                className="w-full px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-700/50 flex items-center gap-2"
              >
                <Edit3 size={14} />
                Edit List
              </button>
              <button
                onClick={(e) => handleMenuAction('duplicate', e)}
                className="w-full px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-700/50 flex items-center gap-2"
              >
                <Copy size={14} />
                Duplicate
              </button>
              <button
                onClick={(e) => handleMenuAction('share', e)}
                className="w-full px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-700/50 flex items-center gap-2"
              >
                <Share2 size={14} />
                Share
              </button>
              <button
                onClick={(e) => handleMenuAction('archive', e)}
                className="w-full px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-700/50 flex items-center gap-2"
              >
                <Archive size={14} />
                {list.is_archived ? 'Unarchive' : 'Archive'}
              </button>
              <hr className="my-2 border-slate-700" />
              <button
                onClick={(e) => handleMenuAction('delete', e)}
                className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="text-2xl">{getListTypeIcon(list.list_type)}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-lg mb-1 truncate">
              {list.name}
            </h3>
            {list.description && (
              <p className="text-slate-400 text-sm line-clamp-2">
                {list.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Progress</span>
            <span className="text-xs text-slate-300 font-medium">
              {completionPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2">
            <div
              className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{totalItems}</div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{completedItems}</div>
            <div className="text-xs text-slate-400">Done</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">{pendingItems}</div>
            <div className="text-xs text-slate-400">Pending</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{new Date(list.updated_at).toLocaleDateString()}</span>
          </div>
          
          {list.is_shared && (
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>Shared</span>
            </div>
          )}
          
          {list.category && (
            <div className="px-2 py-1 bg-slate-700/50 rounded-full">
              <span className="capitalize">{list.category}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
    </div>
  );
};

export default EnhancedListCard;
