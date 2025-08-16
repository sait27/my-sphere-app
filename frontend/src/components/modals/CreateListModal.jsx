// components/CreateListModal.jsx

import React, { useState } from 'react';
import { X, Plus, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateListModal = ({ isOpen, onClose, onSubmit, editingList }) => {
  const [formData, setFormData] = useState({
    name: editingList?.name || '',
    description: editingList?.description || '',
    list_type: editingList?.list_type || 'checklist',
    priority: editingList?.priority || 'medium'
  });
  const [isLoading, setIsLoading] = useState(false);

  const listTypes = [
    { value: 'checklist', label: 'Checklist', icon: '✅' },
    { value: 'shopping', label: 'Shopping', icon: '🛒' },
    { value: 'todo', label: 'To-Do', icon: '📝' },
    { value: 'inventory', label: 'Inventory', icon: '📦' },
    { value: 'wishlist', label: 'Wishlist', icon: '⭐' },
    { value: 'packing', label: 'Packing', icon: '🧳' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-400' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'high', label: 'High', color: 'text-orange-400' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-400' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a list name');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      const action = editingList ? 'updated' : 'created';
      toast.success(`List ${action} successfully!`);
      onClose();
      if (!editingList) {
        setFormData({
          name: '',
          description: '',
          list_type: 'checklist',
          priority: 'medium'
        });
      }
    } catch (error) {
      const action = editingList ? 'update' : 'create';
      toast.error(`Failed to ${action} list`);
      console.error(`${action} list error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListChecks className="text-cyan-400" size={20} />
            <h3 className="text-lg font-semibold text-white">{editingList ? 'Edit List' : 'Create New List'}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* List Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              List Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              placeholder="e.g., Weekly Groceries"
              maxLength={100}
              autoFocus
            />
            <div className="text-xs text-slate-400 mt-1">
              {formData.name.length}/100 characters
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
              rows={3}
              placeholder="What is this list for?"
              maxLength={500}
            />
            <div className="text-xs text-slate-400 mt-1">
              {formData.description.length}/500 characters
            </div>
          </div>

          {/* List Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              List Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {listTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('list_type', type.value)}
                  className={`p-2 rounded-lg border transition-colors ${
                    formData.list_type === type.value
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-xs">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {priorities.map(priority => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => handleChange('priority', priority.value)}
                  className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                    formData.priority === priority.value
                      ? 'border-cyan-500 bg-cyan-500/20'
                      : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    formData.priority === priority.value ? 'text-cyan-400' : priority.color
                  }`}>
                    {priority.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {editingList ? 'Update List' : 'Create List'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListModal;
