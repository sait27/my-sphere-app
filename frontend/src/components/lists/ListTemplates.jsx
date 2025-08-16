// components/ListTemplates.jsx

import React, { useState } from 'react';
import { useListTemplates } from '../../hooks/useListTemplates';
import CreateListFromTemplateModal from '../modals/CreateListFromTemplateModal';
import toast from 'react-hot-toast';
import { 
  FileText, Plus, Search, Star, Users, 
  Copy, Clock
} from 'lucide-react';

const ListTemplates = ({ onCreateFromTemplate }) => {
  const {
    loading,
    filters,
    setFilters,
    filteredTemplates,
    createTemplate,
    createListFromTemplate,
  } = useListTemplates();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUseTemplateModal, setShowUseTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'general',
    is_public: false
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
    { value: 'travel', label: 'Travel' },
    { value: 'health', label: 'Health' }
  ];


  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await createTemplate(newTemplate);
      setShowCreateModal(false);
      setNewTemplate({ name: '', description: '', category: 'general', is_public: false });
    } catch (error) {
      // Error toast is handled in the hook
    }
  };

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setShowUseTemplateModal(true);
  };

  const handleCreateListFromTemplate = async (templateId, listName) => {
    const newList = await createListFromTemplate(templateId, listName);
    if (newList && onCreateFromTemplate) {
      // This will now call fetchLists() in the parent to refresh.
      onCreateFromTemplate();
    }
  };


  if (loading) {
    return (
      <div className="animate-slide-up">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">List Templates</h3>
          <p className="text-slate-400">Quick-start templates for common list types</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">List Templates</h3>
            <p className="text-slate-400">Quick-start templates for common list types</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
          >
            <Plus size={18} />
            Create Template
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search templates..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-slate-700 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <div
            key={template.id}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 animate-scale-in"
            style={{animationDelay: `${0.1 * index}s`}}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                  <FileText className="text-purple-400" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white">{template.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="capitalize">{template.category}</span>
                    {template.is_public && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span>Public</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {template.is_public && (
                <div className="p-1 bg-yellow-500/20 rounded">
                  <Star className="text-yellow-400" size={14} />
                </div>
              )}
            </div>

            {template.description && (
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                {template.description}
              </p>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Copy size={12} />
                  <span>{template.use_count} uses</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{new Date(template.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleUseTemplate(template)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Copy size={16} />
                Use Template
              </button>
              
            </div>
          </div>
        ))}
        
        {filteredTemplates.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-slate-700/30 rounded-full mb-4">
              <FileText className="text-slate-400" size={32} />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              {filters.search || filters.category !== 'all' ? 'No templates found' : 'No templates yet'}
            </h4>
            <p className="text-slate-400 mb-6">
              {filters.search || filters.category !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first template to get started'
              }
            </p>
            {!filters.search && filters.category === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25"
              >
                Create First Template
              </button>
            )}
          </div>
        )}
      </div>

      {/* Use Template Modal */}
      {showUseTemplateModal && selectedTemplate && (
        <CreateListFromTemplateModal
          isOpen={showUseTemplateModal}
          onClose={() => {
            setShowUseTemplateModal(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          onCreate={handleCreateListFromTemplate}
        />
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-4">Create New Template</h3>
            
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  placeholder="e.g., Weekly Grocery List"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  rows={3}
                  placeholder="Describe what this template is for..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newTemplate.is_public}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="isPublic" className="text-sm text-slate-300">
                  Make this template public for other users
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListTemplates;
