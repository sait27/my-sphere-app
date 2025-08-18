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
      await onCreate(template.id, listName);
      onClose();
      setListName('');
    } catch (error) {
      // Error toast is handled in the hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md animate-scale-in">
        <h3 className="text-xl font-bold text-white mb-2">Create List from Template</h3>
        <p className="text-slate-400 mb-4">Using template: <span className="font-semibold text-purple-400">{template?.name || 'Unknown Template'}</span></p>
        
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
