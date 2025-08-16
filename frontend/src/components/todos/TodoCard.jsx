import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flag, 
  Calendar,
  Target,
  MoreHorizontal,
  Edit3,
  Trash2,
  Archive,
  Star,
  AlertTriangle
} from 'lucide-react';

const TodoCard = ({ 
  todo, 
  index, 
  viewMode, 
  bulkMode, 
  isSelected, 
  onToggleSelection, 
  onToggleComplete, 
  onUpdate, 
  onDelete 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <Flag className="w-3 h-3" />;
      case 'medium': return <Flag className="w-3 h-3" />;
      case 'low': return <Flag className="w-3 h-3" />;
      default: return <Flag className="w-3 h-3" />;
    }
  };

  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.is_completed;
  const isDueToday = todo.due_date && new Date(todo.due_date).toDateString() === new Date().toDateString();

  const handleSaveEdit = () => {
    if (editTitle.trim() !== todo.title) {
      onUpdate({ title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { delay: index * 0.1 }
    },
    exit: { opacity: 0, scale: 0.95 }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`group bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 hover:shadow-lg ${
          todo.is_completed 
            ? 'border-slate-600/30 opacity-75' 
            : isOverdue 
              ? 'border-red-500/50 hover:border-red-400/70' 
              : 'border-slate-700/50 hover:border-slate-600/70'
        } ${isSelected ? 'ring-2 ring-blue-500/50' : ''}`}
      >
        <div className="flex items-center gap-4">
          {bulkMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
            />
          )}
          
          <button
            onClick={onToggleComplete}
            className={`flex-shrink-0 transition-colors ${
              todo.is_completed 
                ? 'text-green-400 hover:text-green-300' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {todo.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyPress}
                className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                autoFocus
              />
            ) : (
              <h3 
                className={`font-semibold cursor-pointer ${
                  todo.is_completed ? 'text-slate-400 line-through' : 'text-white'
                }`}
                onClick={() => setIsEditing(true)}
              >
                {todo.title}
              </h3>
            )}
            
            {todo.description && (
              <p className="text-slate-400 text-sm mt-1 truncate">{todo.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {todo.priority && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPriorityColor(todo.priority)}`}>
                {getPriorityIcon(todo.priority)}
                {todo.priority}
              </span>
            )}

            {todo.due_date && (
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                isOverdue 
                  ? 'text-red-400 bg-red-500/20' 
                  : isDueToday 
                    ? 'text-yellow-400 bg-yellow-500/20' 
                    : 'text-slate-400 bg-slate-500/20'
              }`}>
                {isOverdue && <AlertTriangle className="w-3 h-3" />}
                <Calendar className="w-3 h-3" />
                {new Date(todo.due_date).toLocaleDateString()}
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onUpdate({ is_archived: true });
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Archive size={14} />
                    Archive
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-red-400 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
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
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`group bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/20 ${
        todo.is_completed 
          ? 'border-slate-600/30 opacity-75' 
          : isOverdue 
            ? 'border-red-500/50 hover:border-red-400/70' 
            : 'border-slate-700/50 hover:border-slate-600/70'
      } ${isSelected ? 'ring-2 ring-blue-500/50' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {bulkMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
            />
          )}
          
          <button
            onClick={onToggleComplete}
            className={`flex-shrink-0 transition-colors ${
              todo.is_completed 
                ? 'text-green-400 hover:text-green-300' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {todo.is_completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {todo.priority && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPriorityColor(todo.priority)}`}>
              {getPriorityIcon(todo.priority)}
              {todo.priority}
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onUpdate({ is_archived: true });
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                >
                  <Archive size={14} />
                  Archive
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-red-400 hover:bg-slate-700 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyPress}
            className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            autoFocus
          />
        ) : (
          <h3 
            className={`font-semibold text-lg cursor-pointer mb-2 ${
              todo.is_completed ? 'text-slate-400 line-through' : 'text-white'
            }`}
            onClick={() => setIsEditing(true)}
          >
            {todo.title}
          </h3>
        )}
        
        {todo.description && (
          <p className="text-slate-400 text-sm line-clamp-3">{todo.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          {todo.due_date && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              isOverdue 
                ? 'text-red-400 bg-red-500/20' 
                : isDueToday 
                  ? 'text-yellow-400 bg-yellow-500/20' 
                  : 'text-slate-400 bg-slate-500/20'
            }`}>
              {isOverdue && <AlertTriangle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              {new Date(todo.due_date).toLocaleDateString()}
            </div>
          )}

          {todo.goal && (
            <div className="flex items-center gap-1 text-slate-400">
              <Target className="w-3 h-3" />
              <span>Goal</span>
            </div>
          )}
        </div>

        {todo.created_at && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(todo.created_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TodoCard;
