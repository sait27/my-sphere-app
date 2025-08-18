import React from 'react';
import { Filter, ChevronDown, Tag } from 'lucide-react';

const TodoFilters = ({ selectedFilters, setSelectedFilters, goals = [] }) => {
  const handleFilterChange = (key, value) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Filter size={16} />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      {/* Status Filter */}
      <div className="relative">
        <select
          value={selectedFilters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="appearance-none bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 pr-8 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
        >
          <option value="all">All Tasks</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>

      {/* Priority Filter */}
      <div className="relative">
        <select
          value={selectedFilters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="appearance-none bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 pr-8 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>

      {/* Goal Filter */}
      {goals.length > 0 && (
        <div className="relative">
          <select
            value={selectedFilters.goal}
            onChange={(e) => handleFilterChange('goal', e.target.value)}
            className="appearance-none bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 pr-8 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
          >
            <option value="all">All Goals</option>
            {goals.map(goal => (
              <option key={goal.id} value={goal.id.toString()}>
                {goal.title}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      )}

      {/* Category Filter */}
      <div className="relative">
        <select
          value={selectedFilters.category || 'all'}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="appearance-none bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 pr-8 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
        >
          <option value="all">All Categories</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="health">Health</option>
          <option value="education">Education</option>
          <option value="finance">Finance</option>
          <option value="social">Social</option>
          <option value="home">Home</option>
          <option value="other">Other</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>
    </div>
  );
};

export default TodoFilters;