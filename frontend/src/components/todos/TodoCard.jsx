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
  AlertTriangle,
  Tag,
  MessageSquare,
  Paperclip,
  FileText,
  ExternalLink
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
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getPriorityGradient = (priority) => {
    switch (priority) {
      case 'high': return 'from-red-500/10 to-red-600/5';
      case 'medium': return 'from-yellow-500/10 to-amber-600/5';
      case 'low': return 'from-green-500/10 to-emerald-600/5';
      default: return 'from-slate-500/10 to-slate-600/5';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'personal': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'health': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'education': return 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30';
      case 'finance': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'social': return 'text-pink-400 bg-pink-500/20 border-pink-500/30';
      case 'home': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'other': return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getCategoryGradient = (category) => {
    switch (category) {
      case 'work': return 'from-blue-500/10 to-blue-600/5';
      case 'personal': return 'from-purple-500/10 to-purple-600/5';
      case 'health': return 'from-green-500/10 to-green-600/5';
      case 'education': return 'from-indigo-500/10 to-indigo-600/5';
      case 'finance': return 'from-emerald-500/10 to-emerald-600/5';
      case 'social': return 'from-pink-500/10 to-pink-600/5';
      case 'home': return 'from-amber-500/10 to-amber-600/5';
      case 'other': return 'from-slate-500/10 to-slate-600/5';
      default: return 'from-slate-500/10 to-slate-600/5';
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
  
  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!todo.due_date) return null;
    
    const dueDate = new Date(todo.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const daysRemaining = getDaysRemaining();

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

  // Get the appropriate color bar based on category or priority
  const getColorBar = () => {
    if (todo.category) {
      switch (todo.category) {
        case 'work': return 'bg-blue-500';
        case 'personal': return 'bg-purple-500';
        case 'health': return 'bg-green-500';
        case 'education': return 'bg-indigo-500';
        case 'finance': return 'bg-emerald-500';
        case 'social': return 'bg-pink-500';
        case 'home': return 'bg-amber-500';
        default: return 'bg-slate-500';
      }
    } else if (todo.priority) {
      switch (todo.priority) {
        case 'high': return 'bg-red-500';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-green-500';
        default: return 'bg-slate-500';
      }
    }
    return 'bg-slate-500';
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`group relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:shadow-xl ${isSelected 
          ? `bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/40 shadow-lg shadow-cyan-500/20` 
          : `bg-gradient-to-br ${todo.category ? getCategoryGradient(todo.category) : getPriorityGradient(todo.priority)} from-slate-800/50 to-slate-700/30 hover:from-slate-700/60 hover:to-slate-600/40 border-slate-600/30 hover:border-slate-500/50`
        }`}
        style={{animationDelay: `${0.1 * index}s`}}
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        {/* Category/Priority Color Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${getColorBar()}`}></div>
        
        <div className="flex items-center gap-4 mt-1">
          {bulkMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
            className={`flex-shrink-0 transition-colors p-2 rounded-full ${todo.is_completed 
              ? 'text-green-400 hover:text-green-300 bg-green-500/10' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
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
                className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3 
                className={`font-semibold cursor-pointer ${todo.is_completed ? 'text-slate-400 line-through' : 'text-white'}`}
              >
                {todo.title}
              </h3>
            )}
            
            {todo.description && !isExpanded && (
              <p className="text-slate-400 text-sm mt-1 truncate">{todo.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {todo.priority && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getPriorityColor(todo.priority)}`}>
                {getPriorityIcon(todo.priority)}
                {todo.priority}
              </span>
            )}

            {todo.due_date && (
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${isOverdue 
                ? 'text-red-400 bg-red-500/20 border-red-500/30' 
                : isDueToday 
                  ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' 
                  : 'text-slate-400 bg-slate-500/20 border-slate-500/30'
              }`}>
                {isOverdue && <AlertTriangle className="w-3 h-3" />}
                <Calendar className="w-3 h-3" />
                {daysRemaining === 0 ? 'Today' : 
                 daysRemaining === 1 ? 'Tomorrow' : 
                 daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : 
                 `${daysRemaining}d left`}
              </div>
            )}

            {todo.category && (
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${getCategoryColor(todo.category)}`}>
                <Tag className="w-3 h-3" />
                {todo.category}
              </div>
            )}

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <div 
                  className="absolute right-0 top-8 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 min-w-[120px] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onUpdate({ is_archived: true });
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <Archive size={14} />
                    Archive
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded view with more details */}
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-700/50"
          >
            {todo.description && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <MessageSquare size={14} />
                  Description
                </h4>
                <p className="text-slate-400 text-sm">{todo.description}</p>
              </div>
            )}
            
            {todo.category && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Tag size={14} />
                  Category
                </h4>
                <span className="inline-block bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded">
                  {todo.category}
                </span>
              </div>
            )}
            
            {todo.created_at && (
              <div className="text-xs text-slate-500">
                Created: {new Date(todo.created_at).toLocaleString()}
                {todo.is_completed && todo.completed_at && (
                  <span className="ml-3">
                    Completed: {new Date(todo.completed_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Grid view with similar enhancements
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`group relative overflow-hidden bg-gradient-to-br rounded-xl p-6 border transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 ${isSelected 
        ? `from-cyan-500/10 to-blue-500/5 border-cyan-500/40 shadow-lg shadow-cyan-500/20` 
        : `${todo.category ? getCategoryGradient(todo.category) : getPriorityGradient(todo.priority)} from-slate-800/50 to-slate-700/30 hover:from-slate-700/60 hover:to-slate-600/40 border-slate-600/30 hover:border-slate-500/50`
      }`}
      style={{animationDelay: `${0.1 * index}s`}}
      onClick={() => !isEditing && setIsExpanded(!isExpanded)}
    >
      {/* Category/Priority Color Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${getColorBar()}`}></div>
      
      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="flex items-center gap-3">
          {bulkMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
            className={`flex-shrink-0 transition-colors p-2 rounded-full ${todo.is_completed 
              ? 'text-green-400 hover:text-green-300 bg-green-500/10' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {todo.is_completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {todo.priority && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getPriorityColor(todo.priority)}`}>
              {getPriorityIcon(todo.priority)}
              {todo.priority}
            </span>
          )}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div 
                className="absolute right-0 top-8 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 min-w-[120px] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2 transition-colors"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onUpdate({ is_archived: true });
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2 transition-colors"
                >
                  <Archive size={14} />
                  Archive
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
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
            className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className={`text-lg font-semibold ${todo.is_completed ? 'text-slate-400 line-through' : 'text-white'}`}>
            {todo.title}
          </h3>
        )}
        
        {todo.description && !isExpanded && (
          <p className="text-slate-400 text-sm mt-2 line-clamp-2">{todo.description}</p>
        )}
      </div>

      {todo.due_date && (
        <div className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border ${isOverdue 
          ? 'text-red-400 bg-red-500/20 border-red-500/30' 
          : isDueToday 
            ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' 
            : 'text-slate-400 bg-slate-500/20 border-slate-500/30'
        }`}>
          {isOverdue && <AlertTriangle className="w-3 h-3" />}
          <Calendar className="w-3 h-3" />
          {daysRemaining === 0 ? 'Due Today' : 
           daysRemaining === 1 ? 'Due Tomorrow' : 
           daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : 
           `${daysRemaining} days left`}
        </div>
      )}
      
      {/* Expanded view with more details */}
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-slate-700/50"
        >
          {todo.description && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                <MessageSquare size={14} />
                Description
              </h4>
              <p className="text-slate-400 text-sm">{todo.description}</p>
            </div>
          )}
          
          {todo.notes && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                <FileText size={14} />
                Notes
              </h4>
              <p className="text-slate-400 text-sm whitespace-pre-wrap">{todo.notes}</p>
            </div>
          )}
          
          {todo.attachments && todo.attachments.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Paperclip size={14} />
                Attachments ({todo.attachments.length})
              </h4>
              <div className="space-y-2">
                {todo.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-700/30 p-2 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-slate-300 truncate">
                      <Paperclip size={14} />
                      <span className="truncate">{file.name}</span>
                      {file.size && <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>}
                    </div>
                    {file.url && (
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {todo.category && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Tag size={14} />
                Category
              </h4>
              <span className="inline-block bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded">
                {todo.category}
              </span>
            </div>
          )}
          
          {todo.created_at && (
            <div className="text-xs text-slate-500">
              Created: {new Date(todo.created_at).toLocaleString()}
              {todo.is_completed && todo.completed_at && (
                <span className="ml-3">
                  Completed: {new Date(todo.completed_at).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default TodoCard;
