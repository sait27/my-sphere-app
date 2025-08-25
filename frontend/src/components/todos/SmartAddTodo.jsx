// src/components/SmartAddTodo.jsx

import React, { useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SmartAddTodo = ({ onSmartAdd, isCreating }) => {
  const [text, setText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Please enter a task description.");
      return;
    }

    try {
      await onSmartAdd(text);
      setText(''); // Clear input on successful creation
    } catch (error) {
      // Error is already handled in the useTodos hook, but you could add more here if needed
      console.error(error);
    }
  };

  return (
    <div className="mb-8 animate-scale-in" style={{ animationDelay: '0.1s' }}>
      <form 
        onSubmit={handleSubmit} 
        className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
            <Sparkles className="text-purple-400" size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Smart Add Task</h3>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Zap className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isCreating}
            placeholder="e.g., 'Call client about project proposal tomorrow at 2pm #work @high'"
            className="w-full pl-12 pr-32 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="absolute inset-y-0 right-0 m-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
          >
            {isCreating ? 'Adding...' : 'Add Task'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 pl-1">
          Tip: Use '#' for categories (e.g., #work, #personal) and '@' for priority (e.g., @high, @low).
        </p>
      </form>
    </div>
  );
};

export default SmartAddTodo;