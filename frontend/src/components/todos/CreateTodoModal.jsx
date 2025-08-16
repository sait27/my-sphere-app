import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Flag, Target, Clock, Plus } from 'lucide-react';

const CreateTodoModal = ({ isOpen, onClose, onSubmit, goals = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    goal: '',
    estimated_hours: ''
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      due_date: formData.due_date || null,
      goal: formData.goal || null,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null
    };

    onSubmit(submitData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      goal: '',
      estimated_hours: ''
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700/50 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Task</h2>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    errors.title ? 'border-red-500' : 'border-slate-600/50'
                  }`}
                  placeholder="Enter task title..."
                  autoFocus
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="Add task description..."
                  rows={3}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Flag className="inline w-4 h-4 mr-1" />
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Goal */}
              {goals.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Target className="inline w-4 h-4 mr-1" />
                    Goal
                  </label>
                  <select
                    value={formData.goal}
                    onChange={(e) => handleChange('goal', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">No goal</option>
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => handleChange('estimated_hours', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="0.5"
                  min="0"
                  step="0.5"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateTodoModal;
