import React, { useState, useEffect } from 'react';
import { X, Edit, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EditListModal = ({ isOpen, onClose, list, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    list_type: '',
    is_public: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (list) {
      setFormData({
        name: list.name || '',
        description: list.description || '',
        list_type: list.list_type || '',
        is_public: list.is_public || false
      });
    }
  }, [list]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('List name is required');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(list.id, formData);
      toast.success('List updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update list');
      console.error('Error updating list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(list.id);
      toast.success('List deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete list');
      console.error('Error deleting list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit List
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              List Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter list name"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter list description"
            />
          </div>

          <div>
            <label htmlFor="list_type" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="list_type"
              value={formData.list_type}
              onChange={(e) => setFormData({ ...formData, list_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              <option value="shopping">Shopping</option>
              <option value="todo">Todo</option>
              <option value="packing">Packing</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
              Make this list public
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListModal;
