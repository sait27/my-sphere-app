import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Target, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Star,
  MoreHorizontal,
  Edit3,
  Trash2,
  Archive,
  Flag,
  Brain,
  TrendingUp,
  BarChart4,
  Users,
  Zap,
  Timer,
  Layout,
  List,
  Tag,
  Paperclip,
  MessageCircle,
  Play,
  Pause,
  FileText,
  Repeat,
  Settings,
  Download,
  Upload,
  Copy
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTodos } from '../hooks/useTodos';

// Advanced Task Card Component with all features
const AdvancedTaskCard = ({ 
  todo, 
  onUpdate, 
  onDelete, 
  onToggleComplete, 
  onStartTimer, 
  onStopTimer, 
  onAddSubtask,
  onToggleSubtask,
  onAddComment,
  onUploadFile,
  tags = [],
  activeTimer,
  isSelected,
  onToggleSelection,
  bulkMode
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: todo.title,
    description: todo.description || ''
  });
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (subtaskTitle.trim()) {
      onAddSubtask(todo.id, { title: subtaskTitle });
      setSubtaskTitle('');
      setShowSubtaskForm(false);
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(todo.id, commentText);
      setCommentText('');
      setShowCommentForm(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const isTimerActive = activeTimer?.task === todo.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 p-6 ${
        isSelected ? 'ring-2 ring-cyan-500/50' : ''
      } ${
        todo.status === 'completed' ? 'opacity-75' : ''
      }`}
    >
      {/* Bulk Selection */}
      {bulkMode && (
        <div className="absolute top-4 right-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
          />
        </div>
      )}

      {/* Priority & Status Indicators */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleComplete(todo.id)}
            className={`p-1 rounded-full transition-all duration-200 ${
              todo.status === 'completed'
                ? 'text-green-400 hover:text-green-300'
                : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            {todo.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>
          
          {isEditing ? (
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
              className="flex-1 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              autoFocus
            />
          ) : (
            <h3 className={`font-semibold text-white flex-1 cursor-pointer ${
              todo.status === 'completed' ? 'line-through text-slate-400' : ''
            }`} onClick={() => setIsExpanded(!isExpanded)}>
              {todo.title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
            todo.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            todo.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
            todo.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
            'bg-green-500/20 text-green-400 border-green-500/30'
          }`}>
            {todo.priority}
          </span>

          {/* Timer Button */}
          {isTimerActive ? (
            <button
              onClick={() => onStopTimer(activeTimer.id)}
              className="p-1 text-red-400 hover:text-red-300 transition-colors"
              title="Stop Timer"
            >
              <Pause size={16} />
            </button>
          ) : (
            <button
              onClick={() => onStartTimer(todo.id)}
              className="p-1 text-green-400 hover:text-green-300 transition-colors"
              title="Start Timer"
            >
              <Play size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      {todo.tag_assignments && todo.tag_assignments.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {todo.tag_assignments.map((assignment) => (
            <span
              key={assignment.id}
              className="px-2 py-1 text-xs rounded-full text-white"
              style={{ backgroundColor: `${assignment.tag_color}40`, borderColor: assignment.tag_color }}
            >
              {assignment.tag_name}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {(todo.description || isEditing) && (
        <div className="mb-4">
          {isEditing ? (
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
              rows={3}
            />
          ) : (
            <p className="text-slate-300 text-sm">{todo.description}</p>
          )}
        </div>
      )}

      {/* Subtasks Progress */}
      {todo.subtasks && todo.subtasks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">
              Subtasks ({todo.subtasks.filter(s => s.is_completed).length}/{todo.subtasks.length})
            </span>
            <span className="text-xs text-cyan-400">{todo.completion_percentage}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${todo.completion_percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Time Tracking Display */}
      {todo.total_time_spent > 0 && (
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
          <Clock size={12} />
          <span>{todo.total_time_spent}h logged</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
        <div className="flex items-center gap-4">
          <span className={`px-2 py-1 rounded-full border ${
            todo.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            todo.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
            'bg-slate-500/20 text-slate-400 border-slate-500/30'
          }`}>
            {todo.status.replace('_', ' ')}
          </span>
          
          {todo.due_date && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(todo.due_date)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Info Icons */}
          {todo.attachments && todo.attachments.length > 0 && (
            <div className="flex items-center gap-1" title={`${todo.attachments.length} attachments`}>
              <Paperclip size={12} />
              <span>{todo.attachments.length}</span>
            </div>
          )}
          
          {todo.comments && todo.comments.length > 0 && (
            <div className="flex items-center gap-1" title={`${todo.comments.length} comments`}>
              <MessageCircle size={12} />
              <span>{todo.comments.length}</span>
            </div>
          )}

          {/* Edit Actions */}
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="text-green-400 hover:text-green-300"
              >
                <CheckCircle2 size={14} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-300"
              >
                <Circle size={14} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-400 hover:text-cyan-400"
                title="Expand Details"
              >
                <MoreHorizontal size={14} />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-slate-400 hover:text-cyan-400"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                className="text-slate-400 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700 pt-4 space-y-4"
          >
            {/* Subtasks */}
            {todo.subtasks && todo.subtasks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Subtasks</h4>
                <div className="space-y-2">
                  {todo.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 text-sm">
                      <button
                        onClick={() => onToggleSubtask(subtask.id)}
                        className={`${
                          subtask.is_completed ? 'text-green-400' : 'text-slate-400'
                        }`}
                      >
                        {subtask.is_completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </button>
                      <span className={`flex-1 ${subtask.is_completed ? 'line-through text-slate-400' : 'text-slate-300'}`}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {todo.comments && todo.comments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Comments</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {todo.comments.slice(0, 3).map((comment) => (
                    <div key={comment.id} className="text-sm text-slate-300 bg-slate-700/30 rounded p-2">
                      <div className="font-medium text-cyan-400 text-xs">{comment.user_username}</div>
                      <div>{comment.content}</div>
                    </div>
                  ))}
                  {todo.comments.length > 3 && (
                    <div className="text-xs text-slate-400 text-center">
                      +{todo.comments.length - 3} more comments
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                + Subtask
              </button>
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                + Comment
              </button>
              <button
                onClick={() => document.getElementById(`file-input-${todo.id}`).click()}
                className="text-xs px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
              >
                + File
              </button>
            </div>

            {/* Add Subtask Form */}
            {showSubtaskForm && (
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Subtask title..."
                  className="flex-1 text-sm bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-cyan-500 text-white rounded text-sm hover:bg-cyan-600 transition-colors"
                >
                  Add
                </button>
              </form>
            )}

            {/* Add Comment Form */}
            {showCommentForm && (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                  rows={2}
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                >
                  Post
                </button>
              </form>
            )}

            {/* Hidden File Input */}
            <input
              id={`file-input-${todo.id}`}
              type="file"
              hidden
              onChange={(e) => {
                if (e.target.files[0]) {
                  onUploadFile(todo.id, e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Advanced Create Task Modal
const AdvancedCreateTaskModal = ({ 
  onClose, 
  onSubmit, 
  goals = [], 
  tags = [], 
  templates = [],
  onCreateFromTemplate,
  onCreateFromNaturalLanguage 
}) => {
  const [activeTab, setActiveTab] = useState('manual'); // manual, template, natural
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    task_type: 'personal',
    due_date: '',
    scheduled_for: '',
    goal: '',
    estimated_duration: '',
    selectedTags: []
  });
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    const todoData = {
      ...formData,
      due_date: formData.due_date || null,
      scheduled_for: formData.scheduled_for || null,
      goal: formData.goal || null,
      estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null
    };
    
    onSubmit(todoData);
  };

  const handleNaturalLanguageSubmit = async (e) => {
    e.preventDefault();
    if (!naturalLanguageInput.trim()) return;
    
    try {
      await onCreateFromNaturalLanguage(naturalLanguageInput);
      onClose();
      toast.success('Task created from description!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    
    try {
      await onCreateFromTemplate(selectedTemplate, formData);
      onClose();
      toast.success('Task created from template!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700 mb-6">
          {[
            { id: 'manual', label: 'Manual', icon: Edit3 },
            { id: 'template', label: 'From Template', icon: FileText },
            { id: 'natural', label: 'Natural Language', icon: Brain }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Manual Creation Form */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <select
                  value={formData.task_type}
                  onChange={(e) => setFormData({...formData, task_type: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="health">Health</option>
                  <option value="finance">Finance</option>
                  <option value="learning">Learning</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({...formData, estimated_duration: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  min="1"
                />
              </div>
            </div>

            {goals.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Goal (Optional)</label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({...formData, goal: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="">No Goal</option>
                  {goals.map(goal => (
                    <option key={goal.id} value={goal.id}>{goal.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg transition-all duration-200"
              >
                Create Task
              </button>
            </div>
          </form>
        )}

        {/* Template Creation */}
        {activeTab === 'template' && (
          <form onSubmit={handleTemplateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                required
              >
                <option value="">Choose a template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Custom Title (Optional)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="Leave blank to use template title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg transition-all duration-200"
              >
                Create from Template
              </button>
            </div>
          </form>
        )}

        {/* Natural Language Creation */}
        {activeTab === 'natural' && (
          <form onSubmit={handleNaturalLanguageSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Describe your task in natural language
              </label>
              <textarea
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                rows={4}
                placeholder="e.g., 'Call dentist tomorrow at 2pm for checkup appointment' or 'Finish the quarterly report by Friday, high priority'"
                required
              />
            </div>
            
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-2">💡 AI will automatically extract:</p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Task title and description</li>
                <li>• Due dates and times</li>
                <li>• Priority levels</li>
                <li>• Task categories</li>
                <li>• Duration estimates</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-lg transition-all duration-200"
              >
                Create with AI
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

// Main Advanced Todos Page Component
const AdvancedTodosPage = () => {
  const { 
    todos, 
    goals,
    tags,
    templates,
    loading, 
    error, 
    activeTimer,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    createSubtask,
    toggleSubtaskComplete,
    addComment,
    startTimer,
    stopTimer,
    uploadAttachment,
    createTaskFromNaturalLanguage,
    createTaskFromTemplate
  } = useTodos();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all',
    priority: 'all',
    goal: 'all',
    category: 'all',
    tag: 'all'
  });
  const [viewMode, setViewMode] = useState('grid');
  const [selectedTodos, setSelectedTodos] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchTodos();
  }, []);

  // Advanced filtering
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedFilters.status === 'all' || 
                         todo.status === selectedFilters.status;
    
    const matchesPriority = selectedFilters.priority === 'all' || 
                           todo.priority === selectedFilters.priority;
    
    const matchesGoal = selectedFilters.goal === 'all' || 
                       todo.goal?.toString() === selectedFilters.goal;

    const matchesCategory = selectedFilters.category === 'all' ||
                          todo.task_type === selectedFilters.category;

    const matchesTag = selectedFilters.tag === 'all' ||
                      todo.tag_assignments?.some(assignment => assignment.tag.toString() === selectedFilters.tag);

    return matchesSearch && matchesStatus && matchesPriority && matchesGoal && matchesCategory && matchesTag;
  });

  // Advanced sorting
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === 'due_date' && aValue && bValue) {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      aValue = priorityOrder[aValue] || 0;
      bValue = priorityOrder[bValue] || 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleCreateTodo = async (todoData) => {
    try {
      await createTodo(todoData);
      setShowCreateModal(false);
      toast.success('Task created successfully!');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTodo = async (id, updates) => {
    try {
      await updateTodo(id, updates);
      toast.success('Task updated successfully!');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTodo = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTodo(id);
        toast.success('Task deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const handleToggleComplete = async (id) => {
    try {
      await toggleComplete(id);
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleStartTimer = async (taskId) => {
    try {
      await startTimer(taskId);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleStopTimer = async (timeEntryId) => {
    try {
      await stopTimer(timeEntryId);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddSubtask = async (parentTaskId, subtaskData) => {
    try {
      await createSubtask(parentTaskId, subtaskData);
      toast.success('Subtask added successfully!');
    } catch (error) {
      toast.error('Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await toggleSubtaskComplete(subtaskId);
    } catch (error) {
      toast.error('Failed to toggle subtask');
    }
  };

  const handleAddComment = async (taskId, content) => {
    try {
      await addComment(taskId, content);
      toast.success('Comment added successfully!');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleUploadFile = async (taskId, file) => {
    try {
      await uploadAttachment(taskId, file);
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  const toggleTodoSelection = (todoId) => {
    const newSelected = new Set(selectedTodos);
    if (newSelected.has(todoId)) {
      newSelected.delete(todoId);
    } else {
      newSelected.add(todoId);
    }
    setSelectedTodos(newSelected);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-slate-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Advanced Task Manager</h1>
            <p className="text-slate-400 mt-1">Comprehensive task management with AI assistance</p>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTimer && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                <Timer size={16} />
                <span className="text-sm">Timer Active</span>
              </div>
            )}
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2"
            >
              <Plus size={18} />
              New Task
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700 mb-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'tasks' 
                ? 'text-cyan-400 border-b-2 border-cyan-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tasks ({filteredTodos.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-1 ${
              activeTab === 'analytics' 
                ? 'text-cyan-400 border-b-2 border-cyan-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart4 size={16} />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-1 ${
              activeTab === 'templates' 
                ? 'text-cyan-400 border-b-2 border-cyan-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={16} />
            Templates
          </button>
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <>
            {/* Advanced Search and Filters */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                  <Search className="text-purple-400" size={20} />
                </div>
                <h3 className="font-bold text-lg text-white">Advanced Search & Filters</h3>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tasks, descriptions, comments..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="created_at">Created</option>
                    <option value="due_date">Due Date</option>
                    <option value="priority">Priority</option>
                    <option value="title">Title</option>
                    <option value="status">Status</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className={`p-2 rounded-lg transition-colors ${
                      sortOrder === 'asc' 
                        ? 'bg-cyan-500/20 text-cyan-400' 
                        : 'bg-slate-600/50 text-slate-400 hover:text-white'
                    }`}
                  >
                    ↑↓
                  </button>
                  
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-cyan-500/20 text-cyan-400' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {viewMode === 'grid' ? <Layout size={20} /> : <List size={20} />}
                  </button>
                  
                  <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className={`p-2 rounded-lg transition-colors ${
                      bulkMode 
                        ? 'bg-amber-500/20 text-amber-400' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 size={20} />
                  </button>
                </div>
              </div>

              {/* Filter Options Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={selectedFilters.status}
                    onChange={(e) => setSelectedFilters({...selectedFilters, status: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                  <select
                    value={selectedFilters.priority}
                    onChange={(e) => setSelectedFilters({...selectedFilters, priority: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                  <select
                    value={selectedFilters.category}
                    onChange={(e) => setSelectedFilters({...selectedFilters, category: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="all">All Types</option>
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="health">Health</option>
                    <option value="finance">Finance</option>
                    <option value="learning">Learning</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Goal</label>
                  <select
                    value={selectedFilters.goal}
                    onChange={(e) => setSelectedFilters({...selectedFilters, goal: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="all">All Goals</option>
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>{goal.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tag</label>
                  <select
                    value={selectedFilters.tag}
                    onChange={(e) => setSelectedFilters({...selectedFilters, tag: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="all">All Tags</option>
                    {tags.map(tag => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                    <CheckCircle2 className="text-blue-400" size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-white">Your Tasks</h3>
                  <span className="text-sm text-slate-400">({sortedTodos.length} tasks)</span>
                </div>
                
                {bulkMode && selectedTodos.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">{selectedTodos.size} selected</span>
                    <button className="text-xs px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                      Complete
                    </button>
                    <button className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {sortedTodos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
                    <CheckCircle2 className="text-slate-400" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No tasks found</h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    {searchTerm || Object.values(selectedFilters).some(v => v !== 'all') 
                      ? "Try adjusting your search or filters to find what you're looking for."
                      : "You don't have any tasks yet. Click the 'New Task' button to create one."}
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
                }>
                  <AnimatePresence>
                    {sortedTodos.map((todo) => (
                      <AdvancedTaskCard
                        key={todo.id}
                        todo={todo}
                        onUpdate={(updates) => handleUpdateTodo(todo.id, updates)}
                        onDelete={handleDeleteTodo}
                        onToggleComplete={handleToggleComplete}
                        onStartTimer={handleStartTimer}
                        onStopTimer={handleStopTimer}
                        onAddSubtask={handleAddSubtask}
                        onToggleSubtask={handleToggleSubtask}
                        onAddComment={handleAddComment}
                        onUploadFile={handleUploadFile}
                        tags={tags}
                        activeTimer={activeTimer}
                        isSelected={selectedTodos.has(todo.id)}
                        onToggleSelection={() => toggleTodoSelection(todo.id)}
                        bulkMode={bulkMode}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6 rounded-xl border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Total Tasks</p>
                    <p className="text-3xl font-bold text-white">{todos.length}</p>
                  </div>
                  <CheckCircle2 className="text-blue-400" size={32} />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-6 rounded-xl border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold text-white">{todos.filter(t => t.status === 'completed').length}</p>
                  </div>
                  <CheckCircle2 className="text-green-400" size={32} />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-6 rounded-xl border border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">In Progress</p>
                    <p className="text-3xl font-bold text-white">{todos.filter(t => t.status === 'in_progress').length}</p>
                  </div>
                  <Clock className="text-yellow-400" size={32} />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 p-6 rounded-xl border border-red-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-400 text-sm font-medium">Overdue</p>
                    <p className="text-3xl font-bold text-white">{todos.filter(t => 
                      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
                    ).length}</p>
                  </div>
                  <AlertCircle className="text-red-400" size={32} />
                </div>
              </div>
            </div>

            {/* Charts Placeholders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50">
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-cyan-400" size={20} />
                  Completion Trend
                </h3>
                <div className="text-center py-8">
                  <TrendingUp className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-400">Task completion trends coming soon!</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50">
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <BarChart4 className="text-purple-400" size={20} />
                  Priority Distribution
                </h3>
                <div className="space-y-3">
                  {['urgent', 'high', 'medium', 'low'].map(priority => {
                    const count = todos.filter(t => t.priority === priority && t.status !== 'completed').length;
                    const percentage = todos.length > 0 ? (count / todos.length) * 100 : 0;
                    const color = priority === 'urgent' ? 'red' : 
                                priority === 'high' ? 'orange' :
                                priority === 'medium' ? 'yellow' : 'green';
                    
                    return (
                      <div key={priority}>
                        <div className="flex justify-between text-sm text-slate-300 mb-1">
                          <span className="capitalize">{priority}</span>
                          <span>{count}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Templates Coming Soon</h3>
            <p className="text-slate-400">Create reusable task templates to speed up your workflow</p>
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateModal && (
          <AdvancedCreateTaskModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateTodo}
            goals={goals}
            tags={tags}
            templates={templates}
            onCreateFromTemplate={createTaskFromTemplate}
            onCreateFromNaturalLanguage={createTaskFromNaturalLanguage}
          />
        )}
      </div>
    </div>
  );
};

export default AdvancedTodosPage;
