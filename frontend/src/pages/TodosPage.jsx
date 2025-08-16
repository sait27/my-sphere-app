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
  Flag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTodos } from '../hooks/useTodos';
import CreateTodoModal from '../components/todos/CreateTodoModal';
import TodoCard from '../components/todos/TodoCard';
import TodoFilters from '../components/todos/TodoFilters';
import TodoStats from '../components/todos/TodoStats';

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
    goal: 'all'
  });
  const [viewMode, setViewMode] = useState('grid');
  const [selectedTodos, setSelectedTodos] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

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

    return matchesSearch && matchesStatus && matchesPriority && matchesGoal;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tasks & Goals</h1>
            <p className="text-slate-400">Organize your work and achieve your goals</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus size={20} />
            New Task
          </button>
        </div>

        {/* Stats */}
        <TodoStats todos={todos} />

        {/* Search and Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
            </div>

            {/* Filters */}
            <TodoFilters
              filters={selectedFilters}
              onFiltersChange={setSelectedFilters}
              goals={goals}
            />

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkMode(!bulkMode)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  bulkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700/50 text-slate-400 hover:text-white'
                }`}
              >
                Select
              </button>
              <div className="flex bg-slate-700/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {bulkMode && selectedTodos.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 border border-slate-600 rounded-xl p-4 shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <span className="text-white font-medium">
                  {selectedTodos.size} task{selectedTodos.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('complete')}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <button
                    onClick={() => handleBulkAction('incomplete')}
                    className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Circle size={16} />
                  </button>
                  <button
                    onClick={() => handleBulkAction('archive')}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Archive size={16} />
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setSelectedTodos(new Set());
                    setBulkMode(false);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tasks Grid/List */}
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }`}>
          <AnimatePresence>
            {filteredTodos.map((todo, index) => (
              <TodoCard
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

        {/* Empty State */}
        {filteredTodos.length === 0 && !loading && (
          <div className="text-center py-16">
            <Target className="mx-auto text-slate-500 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || Object.values(selectedFilters).some(f => f !== 'all') 
                ? 'No tasks match your filters' 
                : 'No tasks yet'
              }
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || Object.values(selectedFilters).some(f => f !== 'all')
                ? 'Try adjusting your search or filters'
                : 'Create your first task to get started'
              }
            </p>
            {!searchTerm && !Object.values(selectedFilters).some(f => f !== 'all') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                Create First Task
              </button>
            )}
          </div>
        )}

        {/* Create Todo Modal */}
        <CreateTodoModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTodo}
          goals={goals}
        />
      </div>
    </div>
  );
};

export default TodosPage;
