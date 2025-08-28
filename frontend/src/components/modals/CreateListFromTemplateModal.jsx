// components/CreateListFromTemplateModal.jsx

import React, { useState } from 'react';
import toast from 'react-hot-toast';

const CreateListFromTemplateModal = ({ isOpen, onClose, template, onCreate }) => {
  const [listName, setListName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !template) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!listName.trim()) {
      toast.error('Please enter a name for the new list.');
      return;
    }
    setLoading(true);
    try {
      await onCreate(template, listName);
      onClose();
      setListName('');
      toast.success('List created from template!');
    } catch (error) {
      console.error('Template creation error:', error);
      toast.error('Failed to create list from template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md animate-scale-in">
        <h3 className="text-xl font-bold text-white mb-2">Create List from Template</h3>
        <p className="text-slate-400 mb-4">Using template: <span className="font-semibold text-purple-400">{template?.name || 'Unknown Template'}</span></p>
        
        {template?.description && (
          <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
            <p className="text-slate-300 text-sm">{template.description}</p>
          </div>
        )}
        
        {template?.preview_items && template.preview_items.length > 0 && (
          <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
            <p className="text-slate-400 text-xs mb-2">Template includes:</p>
            <div className="flex flex-wrap gap-1">
              {template.preview_items.slice(0, 5).map((item, index) => (
                <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                  {item}
                </span>
              ))}
              {template.preview_items.length > 5 && (
                <span className="px-2 py-1 bg-slate-600 text-slate-400 text-xs rounded">
                  +{template.preview_items.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              New List Name
            </label>
            <input
              type="text"
              required
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              placeholder="e.g., My Awesome Grocery List"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListFromTemplateModal;
