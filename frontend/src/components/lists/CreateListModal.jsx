import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles } from 'lucide-react';

const CreateListModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    list_type: 'checklist',
    priority: 'medium',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        description: '',
        list_type: 'checklist',
        priority: 'medium',
        category: 'general'
      });
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        description: '',
        list_type: 'checklist',
        priority: 'medium',
        category: 'general'
      });
      onClose();
    }
  };

  const listTypes = [
    { value: 'checklist', label: 'Checklist', icon: '✓', description: 'Simple task completion' },
    { value: 'shopping', label: 'Shopping', icon: '🛒', description: 'Shopping and purchases' },
    { value: 'todo', label: 'To-Do', icon: '📋', description: 'Tasks and reminders' },
    { value: 'wishlist', label: 'Wishlist', icon: '⭐', description: 'Things you want' },
    { value: 'notes', label: 'Notes', icon: '📝', description: 'Information and ideas' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'from-green-400 to-green-500' },
    { value: 'medium', label: 'Medium', color: 'from-yellow-400 to-orange-500' },
    { value: 'high', label: 'High', color: 'from-red-400 to-red-500' }
  ];

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'travel', label: 'Travel' },
    { value: 'health', label: 'Health' },
    { value: 'education', label: 'Education' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-800 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                <Plus className="text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create New List</h2>
                <p className="text-slate-400">Organize your tasks and ideas</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                List Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="e.g., Weekly Grocery List, Project Tasks..."
                required
                disabled={isSubmitting}
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                rows="3"
                placeholder="Optional description for your list..."
                disabled={isSubmitting}
              />
            </div>

            {/* List Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                List Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {listTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, list_type: type.value })}
                    disabled={isSubmitting}
                    className={`p-4 rounded-xl border-2 transition-all text-left disabled:opacity-50 ${
                      formData.list_type === type.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{type.icon}</span>
                      <span className="font-medium text-white">{type.label}</span>
                    </div>
                    <p className="text-sm text-slate-400">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Priority and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Priority
                </label>
                <div className="space-y-2">
                  {priorities.map(priority => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: priority.value })}
                      disabled={isSubmitting}
                      className={`w-full p-3 rounded-lg border transition-all text-left disabled:opacity-50 ${
                        formData.priority === priority.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${priority.color}`}></div>
                        <span className="text-white font-medium">{priority.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isSubmitting}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Suggestion */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-purple-400" size={16} />
                <span className="text-sm font-medium text-purple-300">AI Tip</span>
              </div>
              <p className="text-sm text-slate-300">
                After creating your list, you can add multiple items at once by typing them naturally. 
                Our AI will automatically separate and organize them for you!
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Create List
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateListModal;