// pages/ListsPageEnhanced.jsx

import React, { useState, useEffect } from 'react';
import { useLists } from '../hooks/useLists';
import { useListAnalytics } from '../hooks/useListAnalytics';
import { useListSharing } from '../hooks/useListSharing';
import SmartFilters from '../components/lists/SmartFilters';
import ListInsights from '../components/lists/ListInsights';
import ListifyDashboard from '../components/lists/ListifyDashboard';
import CreateListFromTemplateModal from '../components/modals/CreateListFromTemplateModal';
import EditListModal from '../components/modals/EditListModal';
import ListAnalytics from '../components/lists/ListAnalytics';
import ListTemplates from '../components/lists/ListTemplates';
import EnhancedListCard from '../components/lists/EnhancedListCard';
import ListItemsModal from '../components/lists/ListItemsModal';
import ShareListModal from '../components/modals/ShareListModal';
import CreateListModal from '../components/modals/CreateListModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import InputModal from '../components/modals/InputModal';
import ListShareView from '../components/lists/ListShareView';
import { 
  ListChecks, Plus, Search, Filter, Trash2, 
  CheckCircle, BarChart3, FileText, Users,
  Download, Archive, Grid3x3,
  List as ListIcon, Target, Edit3, Settings,
  Calendar, Clock, Star, Share2, Copy, 
  Eye, EyeOff, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/axiosConfig';

const ListsPageEnhanced = () => {
  const [activeTab, setActiveTab] = useState('lists');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSmartFilters, setShowSmartFilters] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedListForShare, setSelectedListForShare] = useState(null);
  const [selectedListForItems, setSelectedListForItems] = useState(null);
  const [selectedListForEdit, setSelectedListForEdit] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [itemPrices, setItemPrices] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [inputModal, setInputModal] = useState({ isOpen: false, title: '', message: '', onSubmit: () => {}, initialValue: '' });

  const {
    lists,
    selectedList,
    loading,
    error,
    filters,
    sortBy,
    selectedItems,
    hasSelectedItems,
    stats,
    fetchLists,
    createList,
    updateList,
    deleteList,
    duplicateList,
    fetchListDetails,
    addItemsWithAI,
    createItem,
    updateItem,
    deleteItem,
    bulkOperations,
    exportLists,
    toggleItemSelection,
    selectAllItems,
    clearSelections,
    setFilters,
    setSortBy,
    setSelectedList
  } = useLists();

  // Use analytics hook for insights
  const {
    analytics,
    insights,
    loading: analyticsLoading,
    error: analyticsError,
    fetchAnalytics
  } = useListAnalytics();
  
  // Sharing functionality coming soon

  // Remove the incorrect setLists function since useLists doesn't provide it
  // The component should use fetchLists() to refresh data instead

  const tabs = [
    { id: 'lists', label: 'My Lists', icon: ListChecks },
    { id: 'shared', label: 'Shared Lists', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'templates', label: 'Templates', icon: FileText }
  ];

  const listTypes = [
    { value: '', label: 'All Types' },
    { value: 'checklist', label: 'Checklist' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'todo', label: 'To-Do' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'wishlist', label: 'Wishlist' },
    { value: 'packing', label: 'Packing' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const sortOptions = [
    { value: '-updated_at', label: 'Recently Updated' },
    { value: '-created_at', label: 'Recently Created' },
    { value: 'name', label: 'Name A-Z' },
    { value: '-name', label: 'Name Z-A' },
    { value: '-completion_percentage', label: 'Most Complete' },
    { value: 'completion_percentage', label: 'Least Complete' }
  ];

  // Fetch lists and analytics on component mount and when filters/sort change
  useEffect(() => {
    console.log('ListsPageEnhanced: useEffect triggered with filters:', filters, 'sortBy:', sortBy);
    const timeoutId = setTimeout(() => {
      console.log('ListsPageEnhanced: Calling fetchLists...');
      fetchLists();
    }, filters.search ? 300 : 0); // Only debounce when there's search text
    
    return () => clearTimeout(timeoutId);
  }, [filters, sortBy, fetchLists]);
  
  // Shared lists functionality coming soon

  // Fetch analytics when lists change
  useEffect(() => {
    console.log('ListsPageEnhanced: Fetching analytics...');
    fetchAnalytics();
  }, [lists]);
  
  // This effect is not needed as we already have another useEffect handling shared lists above

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if not typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            setShowCreateModal(true);
            break;
          case 'f':
            e.preventDefault();
            document.querySelector('input[placeholder*="Search"]')?.focus();
            break;
          case 'k':
            e.preventDefault();
            setShowFilters(!showFilters);
            break;
        }
      }
      
      // Escape key to close modals
      if (e.key === 'Escape') {
        setShowCreateModal(false);
        setShowEditModal(false);
        setShowItemsModal(false);
        setShowFilters(false);
        setShowInsights(false);
        setShowDashboard(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showFilters]);

  const handleToggleFavorite = async (list) => {
    try {
      await updateList(list.id, { is_favorite: !list.is_favorite });
      toast.success(list.is_favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  // FIX: Add handler for toggling the archive status
  const handleToggleArchive = async (list) => {
    try {
      await updateList(list.id, { is_archived: !list.is_archived });
      toast.success(list.is_archived ? 'List unarchived' : 'List archived');
    } catch (error) {
      toast.error('Failed to update archive status');
    }
  };

  // Handle list creation
  const handleCreateList = async (listData) => {
    try {
      await createList(listData);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleDeleteList = (listId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete List',
      message: 'Are you sure you want to delete this list and all its items? This action cannot be undone.',
      onConfirm: () => deleteList(listId),
    });
  };

  const handleDuplicateList = (list) => {
    setInputModal({
      isOpen: true,
      title: 'Duplicate List',
      message: `Enter a new name for the duplicated list.`,
      inputLabel: 'List Name',
      initialValue: `${list.name} (Copy)`,
      ctaText: 'Duplicate',
      onSubmit: (newName) => {
        duplicateList(list.id, newName);
        setInputModal({ isOpen: false });
      },
    });
  };

  // Handle item creation with AI
  const handleAddItems = async (listId, text) => {
    try {
      await addItemsWithAI(listId, text);
    } catch (error) {
      console.error('Failed to add items:', error);
    }
  };

  // Handle list sharing
  const handleShareList = (list) => {
    setSelectedListForShare(list);
    setShowShareModal(true);
  };

  // Handle list editing
  const handleEditList = (list) => {
    setSelectedListForEdit(list);
    setShowEditModal(true);
  };

  // Handle edit list submission
  const handleEditListSubmit = async (listData) => {
    try {
      if (selectedListForEdit) {
        await updateList(selectedListForEdit.id, listData);
        setShowEditModal(false);
        setSelectedListForEdit(null);
        toast.success('List updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update list:', error);
      toast.error('Failed to update list');
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation, additionalData = {}) => {
    if (!hasSelectedItems) return;
    
    try {
      await bulkOperations(operation, selectedItems, additionalData);
    } catch (error) {
      console.error('Bulk operation failed:', error);
    }
  };

  // Handle export
  const handleExport = async (format = 'csv') => {
    const selectedLists = bulkMode && hasSelectedItems 
      ? lists.filter(list => selectedItems.has(list.id))
      : lists;
    
    try {
      setIsExporting(true);
      const { exportListsToCSV, exportListsToPDF } = await import('../utils/exportUtils');
      
      if (format === 'csv') {
        await exportListsToCSV(selectedLists);
      } else if (format === 'pdf') {
        await exportListsToPDF(selectedLists);
      }
      
      toast.success(`${selectedLists.length} lists exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle shopping mode
  const handlePriceChange = (itemId, price) => {
    setItemPrices(prev => ({ ...prev, [itemId]: price }));
  };

  const handlePriceUpdate = async (itemId) => {
    const price = itemPrices[itemId];
    if (!price || price < 0) return;
    
    try {
      await updateItem(itemId, { price: parseFloat(price) });
    } catch (error) {
      console.error('Failed to update price:', error);
    }
  };

  const calculateShoppingTotal = () => {
    return Object.values(itemPrices).reduce((total, price) => 
      total + parseFloat(price || 0), 0
    );
  };

  const handleFinishShopping = async () => {
    const total = calculateShoppingTotal();
    if (total <= 0) {
      setIsShoppingMode(false);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Log Expense",
      message: `Your total is ₹${total.toFixed(2)}. Log this as a new expense?`,
      onConfirm: async () => {
        try {
          const expenseText = `Shopping for '${selectedList.name}' list, total was ${total.toFixed(2)}`;
          await apiClient.post('/expenses/', { text: expenseText });
          toast.success("Expense logged from your shopping trip!");
          setIsShoppingMode(false);
          setItemPrices({});
        } catch (error) {
          toast.error("Failed to log expense.");
        }
      }
    });
  };

  if (loading && lists.length === 0) {
    return (
      <div className="animate-slide-up">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-3 text-white bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
            Smart Lists
          </h2>
          <p className="text-slate-400 text-lg">Organize your tasks and shopping with AI-powered lists</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="animate-slide-up">
        {/* Clean Header with Stats */}
        <div className="relative mb-12">
          {/* Main Title */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              Smart Lists
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Organize your world with AI-powered list management
            </p>
          </div>
          
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">{stats.total}</p>
                  <p className="text-sm text-slate-400">Total Lists</p>
                </div>
                <ListChecks className="text-cyan-400 group-hover:scale-110 transition-transform" size={24} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 hover:border-green-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">{stats.completed}</p>
                  <p className="text-sm text-slate-400">Completed</p>
                </div>
                <CheckCircle className="text-green-400 group-hover:scale-110 transition-transform" size={24} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{stats.active}</p>
                  <p className="text-sm text-slate-400">Active</p>
                </div>
                <Target className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">{stats.shared}</p>
                  <p className="text-sm text-slate-400">Shared</p>
                </div>
                <Users className="text-purple-400 group-hover:scale-110 transition-transform" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Tab Navigation */}
        <div className="mb-8">
          <div className="flex gap-2 bg-slate-800/50 p-2 rounded-xl w-fit">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-cyan-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'lists' && (
          <> {/* <-- FIX: Added opening React Fragment tag */}
            <div className="space-y-10">
              {/* Horizontal Action Bar */}
              <div className="flex items-center justify-between gap-4 mb-8">
                {/* Left - Create Button */}
                <div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    title="Create New List (Ctrl+N)"
                  >
                    <Plus size={18} />
                    Create New List
                  </button>
                </div>

                {/* Center - Search Bar */}
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search your lists... (Ctrl+F)"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                  />
                </div>

                {/* Right Side - Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                    title="Toggle Filters (Ctrl+K)"
                  >
                    <Filter size={16} />
                    Filters
                  </button>
                    
                    <button
                      onClick={() => setShowInsights(!showInsights)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                        showInsights ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <Eye size={16} />
                      Insights
                    </button>
                    
                    <button
                      onClick={() => setShowDashboard(!showDashboard)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                        showDashboard ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <BarChart3 size={16} />
                      Dashboard
                    </button>

                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-700/50 rounded-lg p-1 ml-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded transition-colors ${
                          viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Grid View"
                      >
                        <Grid3x3 size={16} />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition-colors ${
                          viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="List View"
                      >
                        <ListIcon size={16} />
                      </button>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => setShowTemplateModal(true)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Create from Template"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => setBulkMode(!bulkMode)}
                        className={`p-2 rounded-lg transition-colors ${
                          bulkMode ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                        title="Bulk Select"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="Export Lists"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clean Filters Panel */}
                {showFilters && (
                  <div className="border-t border-slate-700/30 pt-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {/* Filter Dropdowns */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">List Type</label>
                        <select
                          value={filters.list_type}
                          onChange={(e) => setFilters(prev => ({ ...prev, list_type: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/40 rounded-xl text-white focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                        >
                          {listTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Priority</label>
                        <select
                          value={filters.priority}
                          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/40 rounded-xl text-white focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                        >
                          {priorities.map(priority => (
                            <option key={priority.value} value={priority.value}>{priority.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Sort By</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/40 rounded-xl text-white focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                        >
                          {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-medium text-slate-300">Options</label>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filters.is_archived}
                              onChange={(e) => setFilters(prev => ({ ...prev, is_archived: e.target.checked }))}
                              className="w-5 h-5 rounded-lg border-2 border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/20 transition-all duration-200"
                            />
                            <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
                              {filters.is_archived ? <EyeOff size={16} /> : <Archive size={16} />}
                              <span>Show Archived</span>
                            </div>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filters.is_favorite || false}
                              onChange={(e) => setFilters(prev => ({ ...prev, is_favorite: e.target.checked }))}
                              className="w-5 h-5 rounded-lg border-2 border-slate-600 bg-slate-800 text-yellow-500 focus:ring-yellow-500/20 transition-all duration-200"
                            />
                            <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
                              <Star size={16} className={filters.is_favorite ? 'text-yellow-400 fill-current' : ''} />
                              <span>Favorites Only</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Smart Filters Panel */}
                {showSmartFilters && (
                  <div className="pt-4 border-t border-slate-700/50 animate-slide-down">
                    <SmartFilters 
                      filters={filters}
                      onFiltersChange={setFilters}
                      lists={lists}
                    />
                  </div>
                )}
                
                {/* Insights Panel */}
                {showInsights && (
                  <div className="pt-4 border-t border-slate-700/50 animate-slide-down">
                    <ListInsights 
                      insights={insights}
                      loading={analyticsLoading}
                      error={analyticsError}
                    />
                  </div>
                )}

                {/* Bulk Actions */}
                {bulkMode && hasSelectedItems && (
                  <div className="flex gap-2 pt-4 border-t border-slate-700/50 animate-slide-down">
                    <button
                      onClick={() => handleBulkOperation('archive_lists')}
                      className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-colors"
                    >
                      <Archive size={16} />
                      Archive ({selectedItems.size})
                    </button>
                    <button
                      onClick={() => handleBulkOperation('bulk_delete_items')}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete ({selectedItems.size})
                    </button>
                    <button
                      onClick={clearSelections}
                      className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>

              {/* Dashboard View */}
              {showDashboard && (
                <div className="mb-8">
                  <ListifyDashboard 
                    lists={lists}
                    analytics={analytics}
                    insights={insights}
                    loading={loading || analyticsLoading}
                    onCreateList={() => setShowCreateModal(true)}
                  />
                </div>
              )}
              
              {/* Enhanced Lists Display */}
              {lists.length > 0 ? (
                <div className={`transition-all duration-500 ${
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-6"
                }`}>
                  {lists.map((list,index) => {
                    const isPrivate = list.visibility === 'private';
                    const isShared = list.is_shared;
                    const isFavorite = list.is_favorite;
                    const isBookmarked = list.is_bookmarked;
                    
                    return (
                      <div 
                        key={list.id} 
                        className="relative group transform transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Subtle Status Badge */}
                        <div className="absolute -top-2 -right-2 z-20 flex gap-1">
                          {isFavorite && (
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1.5 shadow-lg">
                              <Star size={12} className="text-white fill-current" />
                            </div>
                          )}
                          {isShared && (
                            <div className="bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full p-1.5 shadow-lg">
                              <Users size={12} className="text-white" />
                            </div>
                          )}
                          {isPrivate && (
                            <div className="bg-gradient-to-r from-slate-500 to-slate-600 rounded-full p-1.5 shadow-lg">
                              <Lock size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Enhanced List Card */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-cyan-500/10">
                          <EnhancedListCard
                            key={list.id}
                            list={list}
                            isSelected={selectedItems.has(list.id)}
                            onEdit={handleEditList}
                            onDelete={handleDeleteList}
                            onDuplicate={handleDuplicateList}
                            onShare={handleShareList}
                            onToggleFavorite={handleToggleFavorite}
                            onToggleArchive={handleToggleArchive}
                            onViewDetails={async (list) => {
                              try {
                                setSelectedListForItems(list);
                                setShowItemsModal(true);
                                const updatedList = await fetchListDetails(list.id);
                                if (updatedList) {
                                  setSelectedListForItems(updatedList);
                                }
                              } catch (error) {
                                console.error('Failed to fetch list details:', error);
                                toast.error('Failed to load list items');
                              }
                            }}
                          />
                          
                          {/* Floating Quick Actions */}
                          <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <div className="flex gap-2 bg-slate-800/90 backdrop-blur-xl rounded-2xl p-2 border border-slate-600/30 shadow-xl">
                              <button
                                onClick={() => handleEditList(list)}
                                className="p-2 bg-cyan-500/20 hover:bg-cyan-500/40 rounded-xl text-cyan-400 hover:text-white transition-all duration-200 hover:scale-110"
                                title="Edit List"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleShareList(list)}
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-xl text-blue-400 hover:text-white transition-all duration-200 hover:scale-110"
                                title="Share List"
                              >
                                <Share2 size={14} />
                              </button>
                              <button
                                onClick={() => console.log('View insights for list:', list.id)}
                                className="p-2 bg-green-500/20 hover:bg-green-500/40 rounded-xl text-green-400 hover:text-white transition-all duration-200 hover:scale-110"
                                title="View Insights"
                              >
                                <BarChart3 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyListsState onCreateList={() => setShowCreateModal(true)} />
              )}
          </> // <-- FIX: Added closing React Fragment tag
        )}

        {activeTab === 'shared' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Coming Soon!</h3>
            <p className="text-slate-400 max-w-md text-center">
              List sharing functionality is currently under development. Stay tuned for updates!
            </p>
          </div>
        )}
        {activeTab === 'analytics' && (
          <ListAnalytics 
            analytics={analytics} 
            loading={analyticsLoading} 
            error={analyticsError}
            fetchAnalytics={fetchAnalytics} // Pass the function to allow period changes
          />
        )}
        {activeTab === 'templates' && <ListTemplates onCreateFromTemplate={fetchLists} />}

        {/* Edit List Modal */}
        <EditListModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedListForEdit(null);
          }}
          onSubmit={handleEditListSubmit}
          initialData={selectedListForEdit}
        />

        {/* List Items Modal */}
        <ListItemsModal
          selectedList={selectedListForItems}
          isOpen={showItemsModal && !!selectedListForItems}
          onClose={() => {
            setSelectedListForItems(null);
            setShowItemsModal(false);
          }}
          onListUpdated={(updatedList) => {
            // Update the selectedListForItems with fresh data
            setSelectedListForItems(updatedList);
            // Refresh the lists to get updated data
            fetchLists();
          }}
          updateItem={updateItem}
          deleteItem={deleteItem}
          addItemsWithAI={addItemsWithAI}
        />

        {/* Share List Modal */}
        <ShareListModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedListForShare(null);
          }}
          list={selectedListForShare}
        />

        {/* Create List Modal */}
        <CreateListModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateList}
        />

        {/* Confirm Modal */}
        {confirmModal.isOpen && (
          <ConfirmModal 
            {...confirmModal}
            onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          />
        )}

        {/* Input Modal */}
        {inputModal.isOpen && (
          <InputModal 
            {...inputModal}
            onClose={() => setInputModal({ ...inputModal, isOpen: false })}
          />
        )}
        
        {/* Create From Template Modal */}
        <CreateListFromTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSubmit={(templateData) => {
            console.log('Creating list from template:', templateData);
            setShowTemplateModal(false);
            fetchLists(); // Refresh lists after creation
          }}
        />
      </div>
    </div>
  );
};

// Sub-components are imported from separate files

const EmptyListsState = ({ onCreateList }) => {
  return (
    <div className="relative flex flex-col items-center justify-center py-16 px-6">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/10 to-slate-900/10 rounded-2xl"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-sm">
        {/* Simple Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center border border-slate-600/30">
            <ListChecks className="text-slate-400" size={24} />
          </div>
        </div>

        {/* Text */}
        <h3 className="text-xl font-semibold text-white mb-3">
          No Lists Yet
        </h3>
        <p className="text-slate-400 mb-6 text-sm">
          Create your first list to get started with smart organization
        </p>

        {/* Simple CTA Button */}
        <button
          onClick={onCreateList}
          className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-300 font-medium rounded-xl border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-200"
        >
          <Plus size={18} />
          Create List
        </button>
      </div>
    </div>
  );
};

export default ListsPageEnhanced;