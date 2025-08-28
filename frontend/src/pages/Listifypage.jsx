import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Grid3X3, List, MoreHorizontal,
  CheckCircle, Clock, Star, Users, Archive, Trash2,
  Edit3, Copy, Eye, Target, Activity, BarChart3,
  FileText, Sparkles, ArrowUp, ArrowDown, X, Edit2,
  TrendingUp, Award, PieChart, Zap, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLists } from '../hooks/useLists';
import { useOptimisticUpdates } from '../hooks/useOptimisticUpdates';
import { useDebounce } from '../hooks/useDebounce';
import { useListAnalytics } from '../hooks/useListAnalytics';
import { useListTemplates } from '../hooks/useListTemplates';
import { useAIFeatures } from '../hooks/useAIFeatures';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ListCard from '../components/lists/ListCard';
import ListItemsModal from '../components/lists/ListItemsModal';
import ListAnalyticsView from '../components/lists/ListAnalyticsView';
import ListTemplatesView from '../components/lists/ListTemplatesView';
import AIInsightsView from '../components/lists/AIInsightsView';
import CreateListModal from '../components/lists/CreateListModal';
import ShoppingModeView from '../components/lists/ShoppingModeView';
import toast from 'react-hot-toast';

const ListifyPage = () => {
  const [activeTab, setActiveTab] = useState('lists');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLists, setSelectedLists] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [showItemsView, setShowItemsView] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  const {
    lists,
    loading,
    stats,
    fetchLists,
    createList,
    updateList,
    deleteList,
    duplicateList,
    addItemsWithAI,
    updateItem,
    deleteItem,
    fetchListDetails,
    bulkOperations,
    exportLists
  } = useLists();

  const { analytics, loading: analyticsLoading, error: analyticsError, fetchAnalytics } = useListAnalytics();
  const { templates, loading: templatesLoading, fetchTemplates, createTemplate, createListFromTemplate } = useListTemplates();
  const { getAIInsights, getAISuggestions, parseWithAI, getSmartSuggestions } = useAIFeatures();
  
  const handleTemplateCreated = async (templateData) => {
    try {
      await createTemplate(templateData);
      await fetchTemplates(); // Refresh templates after creation
      toast.success('Template created successfully!');
    } catch (error) {
      toast.error('Failed to create template');
      throw error;
    }
  };
  
  // Fallback templates if none are loaded
  const fallbackTemplates = [
    {
      id: 'fallback-1',
      name: 'Weekly Grocery List',
      description: 'Essential items for weekly shopping',
      category: 'shopping',
      is_public: true,
      use_count: 0,
      created_at: new Date().toISOString(),
      preview_items: ['Milk', 'Bread', 'Eggs', 'Fruits', 'Vegetables']
    },
    {
      id: 'fallback-2', 
      name: 'Project Checklist',
      description: 'Track project milestones and tasks',
      category: 'work',
      is_public: true,
      use_count: 0,
      created_at: new Date().toISOString(),
      preview_items: ['Define requirements', 'Create timeline', 'Assign tasks', 'Review progress']
    },
    {
      id: 'fallback-3',
      name: 'Travel Packing',
      description: 'Never forget important travel items',
      category: 'travel', 
      is_public: true,
      use_count: 0,
      created_at: new Date().toISOString(),
      preview_items: ['Passport', 'Tickets', 'Clothes', 'Toiletries', 'Electronics']
    }
  ];
  
  const displayTemplates = templates && templates.length > 0 ? templates : fallbackTemplates;

  // Performance optimizations
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data: optimisticListsData, setData: setOptimisticData, optimisticAdd, optimisticUpdate, optimisticDelete, pendingOperations } = useOptimisticUpdates(lists || []);

  useEffect(() => {
    fetchLists();
    if (fetchTemplates) {
      fetchTemplates();
    }
  }, [fetchLists, fetchTemplates]);

  // Fetch analytics when analytics tab becomes active
  useEffect(() => {
    if (activeTab === 'analytics' && fetchAnalytics) {
      console.log('Analytics tab activated, fetching analytics...');
      fetchAnalytics('month');
    }
  }, [activeTab, fetchAnalytics]);

  // Update optimistic lists when real lists change
  useEffect(() => {
    if (lists) {
      setOptimisticData(lists);
    }
  }, [lists, setOptimisticData]);

  const filteredLists = (optimisticListsData && optimisticListsData.length > 0 ? optimisticListsData : lists || []).filter(list => {
    const matchesSearch = list.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                         (list.description && list.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'active' && !list.is_archived) ||
      (selectedFilter === 'completed' && list.completion_percentage === 100) ||
      (selectedFilter === 'favorites' && list.is_favorite) ||
      (selectedFilter === 'recent' && new Date(list.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const matchesPriority = selectedPriority === 'all' || list.priority === selectedPriority;
    const matchesType = selectedType === 'all' || list.list_type === selectedType;
    return matchesSearch && matchesFilter && matchesPriority && matchesType;
  }).sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'updated_at' || sortBy === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleCreateList = async (data) => {
    try {
      const newList = await optimisticAdd(data, createList);
      setShowCreateModal(false);
      toast.success(`List "${newList.name}" created successfully!`);
    } catch (error) {
      toast.error('Failed to create list');
    }
  };
  
  const handleUpdateList = async (listId, updates) => {
    try {
      await optimisticUpdate(listId, updates, (id, data) => updateList(id, data));
      toast.success('List updated successfully!');
    } catch (error) {
      toast.error('Failed to update list');
    }
  };
  
  const handleDeleteList = async (listId) => {
    if (window.confirm('Are you sure you want to delete this list?')) {
      try {
        await optimisticDelete(listId, deleteList);
        toast.success('List deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete list');
      }
    }
  };

  const handleViewList = async (list) => {
    // Don't open modal if we have selections - show bulk actions instead
    if (selectedLists.length > 0) {
      setShowBulkActions(true);
      return;
    }
    
    try {
      // Fetch fresh list details to ensure we have the latest data
      const freshList = await fetchListDetails(list.id);
      setSelectedList(freshList || list);
      setShowItemsView(true);
    } catch (error) {
      console.error('Error fetching list details:', error);
      // Fallback to using the list data we have
      setSelectedList(list);
      setShowItemsView(true);
    }
  };
  
  const handleShoppingMode = async (list) => {
    try {
      // First, ensure we have the latest list data
      const freshList = await fetchListDetails(list.id);
      
      // Update the list type to shopping if it's not already
      if (freshList.list_type !== 'shopping') {
        await updateList(list.id, { list_type: 'shopping' });
        freshList.list_type = 'shopping';
      }
      
      setSelectedList(freshList);
      setShowItemsView(true);
      toast.success('Shopping mode activated!');
    } catch (error) {
      console.error('Shopping mode error:', error);
      toast.error('Failed to activate shopping mode');
    }
  };

  const handleBulkAction = async (action) => {
    try {
      if (action === 'delete') {
        if (window.confirm(`Delete ${selectedLists.length} lists?`)) {
          await bulkOperations('delete_lists', selectedLists);
          setSelectedLists([]);
          toast.success(`${selectedLists.length} lists deleted`);
        }
      } else if (action === 'duplicate') {
        await bulkOperations('duplicate_lists', selectedLists);
        setSelectedLists([]);
        toast.success(`${selectedLists.length} lists duplicated`);
      } else if (action === 'archive') {
        await bulkOperations('archive_lists', selectedLists);
        setSelectedLists([]);
        toast.success(`${selectedLists.length} lists archived`);
      } else if (action === 'export') {
        await exportLists(selectedLists, 'csv');
        toast.success('Lists exported successfully!');
      }
    } catch (error) {
      toast.error('Bulk action failed');
    } finally {
      setShowBulkActions(false);
    }
  };

  const handleListSelection = (listId, isSelected) => {
    if (isSelected) {
      setSelectedLists([...selectedLists, listId]);
    } else {
      setSelectedLists(selectedLists.filter(id => id !== listId));
    }
  };

  const handleCreateFromTemplate = async (template) => {
    try {
      // For fallback templates, create a simple list with items
      if (template.id.startsWith('fallback-')) {
        const listData = {
          name: template.name,
          description: template.description,
          list_type: template.category === 'shopping' ? 'shopping' : 'checklist',
          priority: 'medium'
        };
        const newList = await createList(listData);
        
        // Add template items if available
        if (template.preview_items && template.preview_items.length > 0) {
          const itemsText = template.preview_items.join(', ');
          await addItemsWithAI(newList.id, itemsText);
        }
        
        await fetchLists();
        toast.success('List created from template!');
        setActiveTab('lists');
        return;
      }
      
      // For real templates, use the createListFromTemplate hook function
      try {
        const newList = await createListFromTemplate(template.id, {
          name: template.name,
          description: template.description
        });
        await fetchLists();
        toast.success('List created from template!');
        setActiveTab('lists');
        return;
      } catch (templateError) {
        // Try direct API call as fallback
        const response = await fetch(`http://localhost:8000/api/v1/lists/templates/${template.id}/create/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({ 
            name: template.name,
            description: template.description 
          })
        });
        
        if (response.ok) {
          await fetchLists();
          toast.success('List created from template!');
          setActiveTab('lists');
          return;
        } else {
          throw new Error(`Template API failed: ${response.status}`);
        }
      }
      
    } catch (error) {
      // Final fallback: create list manually
      try {
        const listData = {
          name: template.name,
          description: template.description,
          list_type: template.category === 'shopping' ? 'shopping' : 'checklist',
          priority: 'medium'
        };
        const newList = await createList(listData);
        
        // Add template items if available
        if (template.preview_items && template.preview_items.length > 0) {
          const itemsText = template.preview_items.join(', ');
          await addItemsWithAI(newList.id, itemsText);
        }
        
        await fetchLists();
        toast.success('List created from template!');
        setActiveTab('lists');
      } catch (fallbackError) {
        toast.error('Failed to create list from template');
      }
    }
  };

  const tabs = [
    { id: 'lists', label: 'My Lists', icon: List },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'templates', label: 'Templates', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Listify
              </h1>
              <p className="text-slate-400 mt-2">Organize your world, one list at a time</p>
            </div>
            
            {activeTab === 'lists' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Plus size={20} />
                New List
              </motion.button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 bg-slate-800/50 p-2 rounded-xl w-fit mb-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Filters and Search - Only show on lists tab */}
          {activeTab === 'lists' && (
            <div className="mb-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search lists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                {/* Filter Buttons */}
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All', icon: List },
                    { id: 'active', label: 'Active', icon: Activity },
                    { id: 'completed', label: 'Completed', icon: CheckCircle },
                    { id: 'favorites', label: 'Favorites', icon: Star }
                  ].map(filter => {
                    const Icon = filter.icon;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedFilter === filter.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        <Icon size={16} />
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
                
                {/* Advanced Filters Toggle */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Filter size={16} />
                  Filters
                </button>
                
                {/* View Mode Toggle */}
                <div className="flex bg-slate-800/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
              
              {/* Advanced Filters */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-slate-800/30 rounded-xl p-4 mb-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Priority Filter */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                        <select
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="all">All Priorities</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      
                      {/* Type Filter */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                        <select
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="all">All Types</option>
                          <option value="checklist">Checklist</option>
                          <option value="todo">Todo</option>
                          <option value="shopping">Shopping</option>
                          <option value="notes">Notes</option>
                        </select>
                      </div>
                      
                      {/* Sort By */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Sort By</label>
                        <div className="flex gap-2">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="updated_at">Last Updated</option>
                            <option value="created_at">Created Date</option>
                            <option value="name">Name</option>
                            <option value="completion_percentage">Progress</option>
                          </select>
                          <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 transition-colors"
                          >
                            {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Stats Cards - Only show on lists tab */}
          {activeTab === 'lists' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Lists', value: stats.total, icon: List, color: 'blue' },
                { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'green' },
                { label: 'Active', value: stats.active, icon: Activity, color: 'orange' },
                { label: 'Favorites', value: stats.favorites || 0, icon: Star, color: 'purple' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-slate-400">{stat.label}</p>
                    </div>
                    <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                      <stat.icon className={`text-${stat.color}-400`} size={20} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Bulk Actions Bar */}
          {selectedLists.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">{selectedLists.length} lists selected</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('duplicate')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Copy size={16} />
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleBulkAction('archive')}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Archive size={16} />
                    Archive
                  </button>
                  <button
                    onClick={() => handleBulkAction('export')}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Export
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedLists([])}
                    className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'lists' && (
          loading ? (
            <LoadingSpinner size="lg" text="Loading lists..." />
          ) : filteredLists.length === 0 ? (
            <EmptyState onCreateList={() => setShowCreateModal(true)} />
          ) : (
            <motion.div
              layout
              className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr'
                : 'space-y-4'
              }
            >
              <AnimatePresence>
                {filteredLists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    viewMode={viewMode}
                    onView={handleViewList}
                    onEdit={(list) => console.log('Edit:', list)}
                    onDelete={handleDeleteList}
                    onDuplicate={async (list) => {
                      try {
                        const duplicated = await duplicateList(list.id, `${list.name} (Copy)`);
                        toast.success(`List "${duplicated.name}" created successfully!`);
                      } catch (error) {
                        console.error('Duplicate failed:', error);
                        toast.error('Failed to duplicate list');
                      }
                    }}
                    onShoppingMode={() => handleShoppingMode(list)}
                    onToggleFavorite={async (list) => {
                      try {
                        await updateList(list.id, { is_favorite: !list.is_favorite });
                        toast.success(list.is_favorite ? 'Removed from favorites' : 'Added to favorites');
                      } catch (error) {
                        toast.error('Failed to update favorite status');
                      }
                    }}
                    isSelected={selectedLists.includes(list.id)}
                    onSelect={(isSelected) => handleListSelection(list.id, isSelected)}
                    isPending={pendingOperations.has(list.id)}
                    selectionMode={selectedLists.length > 0}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )
        )}

        {activeTab === 'analytics' && (
          <ListAnalyticsView 
            analytics={analytics}
            loading={analyticsLoading}
            error={analyticsError}
            fetchAnalytics={fetchAnalytics}
          />
        )}
        
        {activeTab === 'templates' && (
          <ListTemplatesView 
            templates={displayTemplates}
            loading={templatesLoading}
            onCreateFromTemplate={handleCreateFromTemplate}
            onCreateTemplate={handleTemplateCreated}
          />
        )}
        


        {/* Modals */}
        <AnimatePresence>
          {showCreateModal && (
            <CreateListModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreateList}
            />
          )}
          
          {showItemsView && selectedList && (
            selectedList.list_type === 'shopping' ? (
              <ShoppingModeView
                list={selectedList}
                isOpen={showItemsView}
                onClose={() => {
                  setShowItemsView(false);
                  setSelectedList(null);
                  // Refresh the lists to get updated data
                  fetchLists();
                }}
                onAddItems={async (listId, text) => {
                  try {
                    const updatedList = await addItemsWithAI(listId, text);
                    setSelectedList(updatedList);
                    return updatedList;
                  } catch (error) {
                    throw error;
                  }
                }}
                onUpdateItem={async (itemId, updateData) => {
                  try {
                    const updatedItem = await updateItem(itemId, updateData);
                    return updatedItem;
                  } catch (error) {
                    throw error;
                  }
                }}
                onDeleteItem={async (itemId) => {
                  try {
                    await deleteItem(itemId);
                    toast.success('Item deleted successfully');
                  } catch (error) {
                    throw error;
                  }
                }}
              />
            ) : (
              <ListItemsModal
                list={selectedList}
                isOpen={showItemsView}
                onClose={() => {
                  setShowItemsView(false);
                  setSelectedList(null);
                  // Refresh the lists to get updated data
                  fetchLists();
                }}
                onAddItems={async (listId, text) => {
                  try {
                    const updatedList = await addItemsWithAI(listId, text);
                    setSelectedList(updatedList);
                    return updatedList;
                  } catch (error) {
                    throw error;
                  }
                }}
                onUpdateItem={async (itemId, updateData) => {
                  try {
                    const updatedItem = await updateItem(itemId, updateData);
                    return updatedItem;
                  } catch (error) {
                    throw error;
                  }
                }}
                onDeleteItem={async (itemId) => {
                  try {
                    await deleteItem(itemId);
                    toast.success('Item deleted successfully');
                  } catch (error) {
                    throw error;
                  }
                }}
              />
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const EmptyState = ({ onCreateList }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-20"
  >
    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
      <List className="text-slate-400" size={32} />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">No lists yet</h3>
    <p className="text-slate-400 mb-6">Create your first list to get started</p>
    <button
      onClick={onCreateList}
      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
    >
      Create Your First List
    </button>
  </motion.div>
);

export default ListifyPage;