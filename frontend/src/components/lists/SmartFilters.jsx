// components/SmartFilters.jsx

import React, { useState } from 'react';
import { 
  Filter, Search, Calendar, Tag, Star, 
  CheckCircle, Clock, Users, Archive,
  ChevronDown, X, Zap
} from 'lucide-react';

const SmartFilters = ({ 
  filters, 
  onFiltersChange, 
  stats = {},
  onClearFilters 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const categories = [
    { value: '', label: 'All Categories', count: stats.total || 0 },
    { value: 'shopping', label: 'Shopping', count: stats.shopping || 0 },
    { value: 'work', label: 'Work', count: stats.work || 0 },
    { value: 'personal', label: 'Personal', count: stats.personal || 0 },
    { value: 'travel', label: 'Travel', count: stats.travel || 0 },
    { value: 'health', label: 'Health', count: stats.health || 0 }
  ];

  const priorities = [
    { value: '', label: 'All Priorities' },
    { value: 'high', label: 'High Priority', color: 'text-red-400' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-400' },
    { value: 'low', label: 'Low Priority', color: 'text-green-400' }
  ];

  const listTypes = [
    { value: '', label: 'All Types' },
    { value: 'todo', label: 'Todo Lists', icon: '✅' },
    { value: 'shopping', label: 'Shopping Lists', icon: '🛒' },
    { value: 'work', label: 'Work Lists', icon: '💼' },
    { value: 'personal', label: 'Personal Lists', icon: '👤' }
  ];

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== false && value !== null
  );

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 mb-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search lists by name, description, or items..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-slate-700 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
        />
        {filters.search && (
          <button
            onClick={() => updateFilter('search', '')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => updateFilter('is_favorite', !filters.is_favorite)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            filters.is_favorite
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Star size={16} fill={filters.is_favorite ? 'currentColor' : 'none'} />
          Favorites
        </button>

        <button
          onClick={() => updateFilter('completion_status', filters.completion_status === 'completed' ? '' : 'completed')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            filters.completion_status === 'completed'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <CheckCircle size={16} />
          Completed
        </button>

        <button
          onClick={() => updateFilter('completion_status', filters.completion_status === 'active' ? '' : 'active')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            filters.completion_status === 'active'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Clock size={16} />
          Active
        </button>

        <button
          onClick={() => updateFilter('is_shared', !filters.is_shared)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            filters.is_shared
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Users size={16} />
          Shared
        </button>

        <button
          onClick={() => updateFilter('is_archived', !filters.is_archived)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            filters.is_archived
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Archive size={16} />
          Archived
        </button>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
      >
        <Filter size={16} />
        Advanced Filters
        <ChevronDown 
          size={16} 
          className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-700/20 rounded-xl border border-slate-600/30">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label} {cat.count > 0 && `(${cat.count})`}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <select
              value={filters.priority || ''}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          {/* List Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              List Type
            </label>
            <select
              value={filters.list_type || ''}
              onChange={(e) => updateFilter('list_type', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {listTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon && `${type.icon} `}{type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Created After
            </label>
            <input
              type="date"
              value={filters.created_after || ''}
              onChange={(e) => updateFilter('created_after', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Updated After
            </label>
            <input
              type="date"
              value={filters.updated_after || ''}
              onChange={(e) => updateFilter('updated_after', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Item Count Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Min Items
            </label>
            <input
              type="number"
              min="0"
              value={filters.min_items || ''}
              onChange={(e) => updateFilter('min_items', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="0"
            />
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700/50">
          <span className="text-sm text-slate-400">
            {Object.values(filters).filter(v => v !== '' && v !== false).length} filters active
          </span>
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X size={16} />
            Clear All Filters
          </button>
        </div>
      )}

      {/* AI Smart Filter Suggestions */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="text-cyan-400" size={16} />
          <span className="text-sm font-medium text-slate-300">Smart Suggestions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateFilter('smart_filter', filters.smart_filter === 'overdue' ? '' : 'overdue')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filters.smart_filter === 'overdue' 
                ? 'bg-red-500/30 text-red-300 border border-red-500/50' 
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            }`}
          >
            Overdue Items
          </button>
          <button
            onClick={() => updateFilter('smart_filter', filters.smart_filter === 'due_soon' ? '' : 'due_soon')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filters.smart_filter === 'due_soon' 
                ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' 
                : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
            }`}
          >
            Due Soon
          </button>
          <button
            onClick={() => updateFilter('smart_filter', filters.smart_filter === 'most_active' ? '' : 'most_active')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filters.smart_filter === 'most_active' 
                ? 'bg-green-500/30 text-green-300 border border-green-500/50' 
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
          >
            Most Active
          </button>
          <button
            onClick={() => updateFilter('smart_filter', filters.smart_filter === 'needs_attention' ? '' : 'needs_attention')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filters.smart_filter === 'needs_attention' 
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' 
                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
            }`}
          >
            Needs Attention
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartFilters;
