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
  List
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTodos } from '../hooks/useTodos';
import ProductivityAnalytics from '../components/ProductivityAnalytics';

// Priority colors mapping
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

// Status colors mapping
const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'pending': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

// TodoCard Component
const TodoCardComponent = ({ todo, viewMode, bulkMode, isSelected, onToggleSelection, onToggleComplete, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');

  const handleSaveEdit = () => {
    onUpdate({ title: editTitle, description: editDescription });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 p-6 ${
        isSelected ? 'ring-2 ring-cyan-500/50' : ''
      } ${
        todo.status === 'completed' ? 'opacity-75' : ''
      }`}
    >
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

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onToggleComplete}
            className={`p-1 rounded-full transition-all duration-200 ${
              todo.status === 'completed'
                ? 'text-green-400 hover:text-green-300'
                : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            {todo.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>
          
          {isEditing ? (
            <div className="flex-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                autoFocus
              />
            </div>
          ) : (
            <h3 className={`font-semibold text-white flex-1 ${
              todo.status === 'completed' ? 'line-through text-slate-400' : ''
            }`}>
              {todo.title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
            {todo.priority}
          </span>
        </div>
      </div>

      {(todo.description || isEditing) && (
        <div className="mb-4">
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
              rows={3}
            />
          ) : (
            <p className="text-slate-300 text-sm">{todo.description}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className={`px-2 py-1 rounded-full border ${getStatusColor(todo.status)}`}>
            {todo.status}
          </span>
          {todo.task_type && (
            <span className="px-2 py-1 bg-slate-600/30 rounded-full">
              {todo.task_type}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {todo.due_date && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(todo.due_date)}</span>
            </div>
          )}
          
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
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
                onClick={() => setIsEditing(true)}
                className="text-slate-400 hover:text-cyan-400"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={onDelete}
                className="text-slate-400 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Create Todo Modal Component
const CreateTodoModal = ({ onClose, onSubmit, goals }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    task_type: 'personal',
    due_date: '',
    goal: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    const todoData = {
      ...formData,
      due_date: formData.due_date || null,
      goal: formData.goal || null
    };
    
    onSubmit(todoData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
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
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
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
      </motion.div>
    </div>
  );
};

const TodosPage = () => {
  const { 
    todos, 
    goals,
    loading, 
    error, 
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete
  } = useTodos();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all',
    priority: 'all',
    goal: 'all',
    category: 'all'
  });
  const [viewMode, setViewMode] = useState('grid');
  const [selectedTodos, setSelectedTodos] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [orderedTodos, setOrderedTodos] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks'); // New state for tab switching: 'tasks' or 'analytics'
  const [analyticsDateRange, setAnalyticsDateRange] = useState('7d');

  useEffect(() => {
    fetchTodos();
  }, []);

  // Update orderedTodos when todos or filters change
  useEffect(() => {
    setOrderedTodos(filteredTodos);
  }, [todos, selectedFilters, searchTerm]);

  // Filter todos based on search and filters
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedFilters.status === 'all' || 
                         (selectedFilters.status === 'completed' && todo.is_completed) ||
                         (selectedFilters.status === 'pending' && !todo.is_completed);
    
    const matchesPriority = selectedFilters.priority === 'all' || 
                           todo.priority === selectedFilters.priority;
    
    const matchesGoal = selectedFilters.goal === 'all' || 
                       todo.goal?.toString() === selectedFilters.goal;

    const matchesCategory = selectedFilters.category === 'all' ||
                          todo.category === selectedFilters.category;

    return matchesSearch && matchesStatus && matchesPriority && matchesGoal && matchesCategory;
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

  const handleDragEnd = (result) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = Array.from(orderedTodos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedTodos(items);

    // Here you would typically update the order in the backend
    // For now, we'll just update the local state
    toast.success('Task order updated');
  };

  const handleBulkAction = async (action) => {
    const todoIds = Array.from(selectedTodos);
    
    try {
      switch (action) {
        case 'complete':
          await Promise.all(todoIds.map(id => updateTodo(id, { is_completed: true })));
          toast.success(`${todoIds.length} tasks marked as completed`);
          break;
        case 'incomplete':
          await Promise.all(todoIds.map(id => updateTodo(id, { is_completed: false })));
          toast.success(`${todoIds.length} tasks marked as incomplete`);
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${todoIds.length} tasks?`)) {
            await Promise.all(todoIds.map(id => deleteTodo(id)));
            toast.success(`${todoIds.length} tasks deleted`);
          }
          break;
        case 'archive':
          await Promise.all(todoIds.map(id => updateTodo(id, { is_archived: true })));
          toast.success(`${todoIds.length} tasks archived`);
          break;
      }
      setSelectedTodos(new Set());
      setBulkMode(false);
    } catch (error) {
      toast.error('Failed to perform bulk action');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 todos-container">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-slate-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 todos-container">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 todos-header">
          <h1 className="text-3xl font-bold text-white">Task Manager</h1>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2 todos-button"
            >
              <Plus size={18} />
              New Task
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700 mb-6 todos-tabs">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 font-medium text-sm transition-colors todos-tab ${activeTab === 'tasks' ? 'active' : 'text-slate-400 hover:text-white'}`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-1 todos-tab ${activeTab === 'analytics' ? 'active' : 'text-slate-400 hover:text-white'}`}
          >
            <BarChart4 size={16} />
            Analytics
          </button>
        </div>

        {/* Tasks Tab Content */}
        {activeTab === 'tasks' && (
          <>
            {/* Search and Filters */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 mb-8 animate-scale-in filter-section" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                  <Filter className="text-purple-400" size={20} />
                </div>
                <h3 className="font-bold text-lg text-white">Search & Filter Tasks</h3>
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
                    placeholder="Search tasks..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                    title="Grid View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                    title="List View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className={`p-2 rounded-lg transition-colors ${bulkMode ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}
                    title="Bulk Select"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Filter Options */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Task Type</label>
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
              </div>
            </div>

            {/* Task List */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 mb-8 animate-scale-in task-list-section" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                    <CheckCircle2 className="text-blue-400" size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-white">Your Tasks</h3>
                  <span className="text-sm text-slate-400">({filteredTodos.length} tasks)</span>
                </div>
                
                {bulkMode && selectedTodos.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkAction('complete')}
                      className="text-xs px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleBulkAction('incomplete')}
                      className="text-xs px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                    >
                      Incomplete
                    </button>
                    <button
                      onClick={() => handleBulkAction('archive')}
                      className="text-xs px-3 py-1.5 bg-slate-500/20 text-slate-400 rounded-lg hover:bg-slate-500/30 transition-colors"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {filteredTodos.length === 0 ? (
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
                    {orderedTodos.map((todo, index) => (
                      <TodoCardComponent
                        key={todo.id}
                        todo={todo}
                        index={index}
                        viewMode={viewMode}
                        bulkMode={bulkMode}
                        isSelected={selectedTodos.has(todo.id)}
                        onToggleSelection={() => toggleTodoSelection(todo.id)}
                        onToggleComplete={() => handleToggleComplete(todo.id)}
                        onUpdate={(updates) => handleUpdateTodo(todo.id, updates)}
                        onDelete={() => handleDeleteTodo(todo.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <ProductivityAnalytics
            todos={todos}
            timeEntries={[]} // Will be populated when time tracking data is available
            goals={goals}
            dateRange={analyticsDateRange}
            onDateRangeChange={setAnalyticsDateRange}
            isVisible={true}
          />
        )}

        {/* Create Todo Modal */}
        {showCreateModal && (
          <CreateTodoModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateTodo}
            goals={goals}
          />
        )}
      </div>
    </div>
  );
};

export default TodosPage;
