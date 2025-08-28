import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MoreVertical, Star, Edit3, Trash2, Copy, Eye, 
  CheckCircle, Clock, Target, ShoppingCart
} from 'lucide-react';

const ListCard = ({ 
  list, 
  viewMode = 'grid',
  onEdit, 
  onDelete, 
  onDuplicate, 
  onView,
  onToggleFavorite,
  onShoppingMode,
  isSelected,
  onSelect,
  isPending,
  selectionMode = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(list.name);
  
  const progress = list.completion_percentage || 0;
  const completedItems = list.completed_items || 0;
  const totalItems = list.items_count || list.items?.length || 0;
  const pendingItems = totalItems - completedItems;

  const priorityColors = {
    low: 'from-green-400 to-green-500',
    medium: 'from-yellow-400 to-orange-500', 
    high: 'from-red-400 to-red-500'
  };

  const typeIcons = {
    checklist: '✓',
    todo: '📋',
    shopping: '🛒',
    notes: '📝',
    wishlist: '⭐'
  };

  const handleEdit = async () => {
    if (editName.trim() && editName !== list.name) {
      try {
        await onEdit({ ...list, name: editName.trim() });
      } catch (error) {
        console.error('Failed to update list name');
      }
    }
    setIsEditing(false);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isPending ? 0.7 : 1, y: 0 }}
        className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl p-4 hover:bg-slate-800/70 transition-all group ${
          isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700/50 hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Selection Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(e.target.checked);
            }}
            className="w-4 h-4 text-blue-500 bg-transparent border-slate-400 rounded focus:ring-blue-500"
          />

          {/* List Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{typeIcons[list.list_type] || '📋'}</span>
              {isEditing ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleEdit}
                  onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
                  className="bg-transparent border-b border-blue-500 text-white focus:outline-none"
                  autoFocus
                />
              ) : (
                <h3 className="font-semibold text-white truncate">{list.name}</h3>
              )}
              {list.priority && (
                <span className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${priorityColors[list.priority]} text-white`}>
                  {list.priority}
                </span>
              )}
              {list.is_favorite && (
                <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
              <span>{totalItems} items</span>
              <span>{progress.toFixed(0)}% complete</span>
              <span>{new Date(list.updated_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onView(list)}
              className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-400 hover:text-yellow-400 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleFavorite(list)}
              className={`p-2 transition-colors ${
                list.is_favorite ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'
              }`}
            >
              <Star className="w-4 h-4" fill={list.is_favorite ? 'currentColor' : 'none'} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 min-w-[140px]">
                  <button
                    onClick={() => {
                      onDuplicate(list);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  {(list.list_type === 'shopping' || list.list_type === 'checklist') && onShoppingMode && (
                    <button
                      onClick={() => {
                        onShoppingMode(list);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-green-400 hover:text-green-300 hover:bg-slate-700 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Shopping Mode
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onDelete(list);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isPending ? 0.7 : 1, y: 0 }}
      className="group relative h-full"
    >
      {/* Selection Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-2xl z-10 pointer-events-none" />
      )}

      <div 
        className={`bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-6 hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 relative h-full flex flex-col ${
          isSelected ? 'border-blue-500' : 'border-slate-700/50'
        } ${!selectionMode && onView ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (selectionMode) {
            onSelect(!isSelected);
          } else if (onView) {
            onView(list);
          }
        }}
      >
        {/* Selection Checkbox */}
        <div 
          className="absolute top-4 right-4 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 text-blue-500 bg-transparent border-slate-400 rounded focus:ring-blue-500"
          />
        </div>

        {/* Priority Indicator */}
        {list.priority && (
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${priorityColors[list.priority]} rounded-t-2xl`} />
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{typeIcons[list.list_type] || '📋'}</div>
            <div>
              {isEditing ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleEdit}
                  onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
                  className="bg-transparent border-b border-blue-500 text-white text-lg font-semibold focus:outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3 className="text-lg font-semibold text-white mb-1">{list.name}</h3>
              )}
              <div className="flex items-center gap-2">
                <p className="text-slate-400 text-sm capitalize">{list.list_type}</p>
                {list.is_favorite && (
                  <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                )}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 min-w-[160px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(list);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Items
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Name
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(list);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  {list.is_favorite ? 'Remove Favorite' : 'Add Favorite'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(list);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                {(list.list_type === 'shopping' || list.list_type === 'checklist') && onShoppingMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShoppingMode(list);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-green-400 hover:text-green-300 hover:bg-slate-700 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Shopping Mode
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(list);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="flex-1">
          <div className="h-12 mb-4">
            {list.description && (
              <p className="text-slate-400 text-sm line-clamp-2">{list.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">{completedItems}</span>
              <span className="text-slate-400 text-sm">completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <span className="text-white font-medium">{pendingItems}</span>
              <span className="text-slate-400 text-sm">pending</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Progress</span>
              <span className="text-white font-medium">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-slate-400 text-sm">
            {new Date(list.updated_at || list.created_at).toLocaleDateString()}
          </span>
          {!selectionMode && onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(list);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              View Items
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ListCard;