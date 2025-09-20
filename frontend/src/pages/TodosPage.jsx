import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, CheckSquare, BarChart3, Target, Calendar, 
  Sparkles, Filter, Grid, List
} from 'lucide-react';
import { useTodos } from '../hooks/useTodos';
import TodoCard from '../components/todos/TodoCard';
import TodoFilters from '../components/todos/TodoFilters';
import CreateTodoModal from '../components/todos/CreateTodoModal';
import TodoAnalytics from '../components/todos/TodoAnalytics';
import GoalCard from '../components/todos/GoalCard';
import CreateGoalModal from '../components/todos/CreateGoalModal';
import TimeTracker from '../components/todos/TimeTracker';
import { toast } from 'react-hot-toast';

const TodosPage = () => {
  const {
    todos,
    goals,
    tags,
    templates,
    loading,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    createGoal,
    createFromNaturalLanguage,
    getDashboardStats
  } = useTodos();

  const [activeTab, setActiveTab] = useState('tasks');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('ai_priority');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchTodos();
    loadStats();
  }, [fetchTodos]);

  const loadStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCreateTask = async (data) => {
    try {
      if (data.isAI) {
        await createFromNaturalLanguage(data.text);
      } else {
        // Clean the data before sending
        const cleanData = {
          ...data,
          due_date: data.due_date || null,
          estimated_duration: data.estimated_duration || null,
          goal: data.goal || null
        };
        await createTodo(cleanData);
      }
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleCreateGoal = async (data) => {
    try {
      await createGoal(data);
      setShowCreateGoalModal(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         todo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || todo.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || todo.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    switch (sortBy) {
      case 'ai_priority':
        return (b.ai_priority_score || 0) - (a.ai_priority_score || 0);
      case 'due_date':
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      case 'created':
        return new Date(b.created_at) - new Date(a.created_at);
      default:
        return 0;
    }
  });

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const QuickStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <CheckSquare className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Total Tasks</p>
            <p className="text-white text-2xl font-bold">{stats?.total_tasks || 0}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="group bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <CheckSquare className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Completed Today</p>
            <p className="text-white text-2xl font-bold">{stats?.completed_today || 0}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="group bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Calendar className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Overdue</p>
            <p className="text-white text-2xl font-bold">{stats?.overdue || 0}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Target className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">High Priority</p>
            <p className="text-white text-2xl font-bold">{stats?.high_priority || 0}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Task Management</h1>
            <p className="text-slate-400">AI-powered productivity with smart insights</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 mt-4 lg:mt-0"
          >
            <Sparkles size={22} className="group-hover:rotate-12 transition-transform duration-300" />
            Create Task
          </button>
        </div>

        {/* Quick Stats */}
        <QuickStats />

        {/* Enhanced Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-2 border border-slate-700/50 w-fit shadow-xl">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === id 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50 hover:scale-102'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'tasks' && (
              <div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <TodoFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    priorityFilter={priorityFilter}
                    setPriorityFilter={setPriorityFilter}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                  />
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>

                <div className={`grid gap-4 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {sortedTodos.map(todo => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onUpdate={updateTodo}
                      onDelete={deleteTodo}
                    />
                  ))}
                </div>

                {sortedTodos.length === 0 && (
                  <div className="text-center text-slate-400 py-12">
                    <CheckSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No tasks found. Create your first task!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'goals' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Goals</h2>
                  <button
                    onClick={() => setShowCreateGoalModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus size={16} />
                    Create Goal
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {goals.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onUpdate={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>

                {goals.length === 0 && (
                  <div className="text-center text-slate-400 py-12">
                    <Target size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No goals yet. Set your first goal!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && <TodoAnalytics />}
          </motion.div>
        </AnimatePresence>

        {/* Create Modal */}
        <CreateTodoModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
          goals={goals}
          tags={tags}
        />

        <CreateGoalModal
          isOpen={showCreateGoalModal}
          onClose={() => setShowCreateGoalModal(false)}
          onSubmit={handleCreateGoal}
        />
      </div>
    </div>
  );
};

export default TodosPage;