import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Plus, Search, Star, Users, 
  Copy, Clock, Filter, Grid3X3, List as ListIcon
} from 'lucide-react';
import CreateTemplateModal from './CreateTemplateModal';
import { useListTemplates } from '../../hooks/useListTemplates';
import toast from 'react-hot-toast';

const ListTemplatesView = ({ templates = [], loading, onCreateFromTemplate, onCreateTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const handleCreateTemplate = async (templateData) => {
    if (onCreateTemplate) {
      await onCreateTemplate(templateData);
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
    { value: 'travel', label: 'Travel' },
    { value: 'health', label: 'Health' },
    { value: 'education', label: 'Education' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = async (template) => {
    try {
      if (onCreateFromTemplate) {
        await onCreateFromTemplate(template);
        toast.success('List created from template!');
      }
    } catch (error) {
      console.error('Failed to create list from template:', error);
      toast.error('Failed to create list from template');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
        </div>
      </div>
    );
  }

  const TemplateCard = ({ template, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 group h-full flex flex-col"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
            <FileText className="text-purple-400" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-white text-lg">{template.name}</h4>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
              <span className="capitalize">{template.category || 'general'}</span>
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
        
        {template.is_featured && (
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Star className="text-yellow-400" size={16} fill="currentColor" />
          </div>
        )}
      </div>

      <div className="h-16 mb-4">
        {template.description && (
          <p className="text-slate-400 text-sm line-clamp-3">
            {template.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <Copy size={14} />
            <span>{template.use_count || 0} uses</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{new Date(template.created_at || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Template Preview */}
      {template.preview_items && template.preview_items.length > 0 && (
        <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
          <div className="text-xs text-slate-400 mb-2">Preview items:</div>
          <div className="space-y-1">
            {template.preview_items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                {item}
              </div>
            ))}
            {template.preview_items.length > 3 && (
              <div className="text-xs text-slate-400">
                +{template.preview_items.length - 3} more items
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => handleUseTemplate(template)}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-purple-500/25"
        >
          <Copy size={18} />
          Use Template
        </button>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-bold text-white mb-2">List Templates</h3>
          <p className="text-slate-400">Quick-start templates for common list types</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
        >
          <Plus size={20} />
          Create Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 flex-1 max-w-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-slate-800/50 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' 
                ? 'bg-purple-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list' 
                ? 'bg-purple-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <AnimatePresence>
        {filteredTemplates.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr'
              : 'space-y-4'
          }>
            {filteredTemplates.map((template, index) => (
              <TemplateCard key={template.id} template={template} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="p-4 bg-slate-700/30 rounded-full mb-6">
              <FileText className="text-slate-400" size={48} />
            </div>
            <h4 className="text-2xl font-semibold text-white mb-4">
              {searchQuery || selectedCategory !== 'all' ? 'No templates found' : 'No templates available'}
            </h4>
            <p className="text-slate-400 mb-8 max-w-md">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria to find templates'
                : 'Create your first template to help others get started with their lists'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25"
              >
                Create First Template
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>


      
      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTemplate}
      />
    </motion.div>
  );
};

export default ListTemplatesView;