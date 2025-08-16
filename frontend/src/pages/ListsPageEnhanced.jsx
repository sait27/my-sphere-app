// pages/ListsPageEnhanced.jsx

import React, { useState, useEffect } from 'react';
import { useLists } from '../hooks/useLists';
import { useListAnalytics } from '../hooks/useListAnalytics';
import SmartFilters from '../components/lists/SmartFilters';
import ListInsights from '../components/lists/ListInsights';
import ListifyDashboard from '../components/lists/ListifyDashboard';
import CreateListFromTemplateModal from '../components/modals/CreateListFromTemplateModal';
import EditListModal from '../components/modals/EditListModal';
import ListItemsModal from '../components/lists/ListItemsModal';
import ShareListModal from '../components/modals/ShareListModal';
import CreateListModal from '../components/modals/CreateListModal';
import { 
  ListChecks, Plus, Search, Filter, Trash2, 
  CheckCircle, BarChart3, FileText, Users,
  Download, Archive, Grid3X3,
  List as ListIcon, Target
} from 'lucide-react';
import toast from 'react-hot-toast';

const ListsPageEnhanced = () => {
  const [activeTab, setActiveTab] = useState('lists');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedListForShare, setSelectedListForShare] = useState(null);
  const [selectedListForItems, setSelectedListForItems] = useState(null);
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [itemPrices, setItemPrices] = useState({});
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

  const tabs = [
    { id: 'lists', label: 'My Lists', icon: ListChecks },
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

  // Fetch lists on component mount and when filters/sort change
  useEffect(() => {
    fetchLists();
  }, [filters, sortBy, fetchLists]);

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
          // This would call the expenses API
          // await apiClient.post('/expenses/', { text: expenseText });
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
        {/* Enhanced Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-3 text-white bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
            Smart Lists
          </h2>
          <p className="text-slate-400 text-lg">Organize your tasks and shopping with AI-powered lists</p>
          
          {/* Quick Stats */}
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <ListChecks size={16} />
              <span>{stats.total} total</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={16} />
              <span>{stats.completed} completed</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Target size={16} />
              <span>{stats.active} active</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <Users size={16} />
              <span>{stats.shared} shared</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
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
          <div className="space-y-8">
            {/* Controls Bar */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Create List Button */}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Create List
                  </button>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search lists..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 w-64"
                    />
                  </div>

                  {/* Filters Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Filter size={18} />
                    Filters
                  </button>

                  {/* View Mode Toggle */}
                  <div className="flex bg-slate-700/50 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Grid3X3 size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ListIcon size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Bulk Mode Toggle */}
                  <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      bulkMode ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <CheckCircle size={18} />
                    Bulk Select
                  </button>

                  {/* Export */}
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <Download size={18} />
                    Export
                  </button>

                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="flex gap-4 pt-4 border-t border-slate-700/50 animate-slide-down">
                  <select
                    value={filters.list_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, list_type: e.target.value }))}
                    className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    {listTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>

                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 text-slate-400">
                    <input
                      type="checkbox"
                      checked={filters.is_archived}
                      onChange={(e) => setFilters(prev => ({ ...prev, is_archived: e.target.checked }))}
                      className="rounded"
                    />
                    Show Archived
                  </label>
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

            {/* Lists Display */}
            {lists.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {lists.map((list, index) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    index={index}
                    viewMode={viewMode}
                    bulkMode={bulkMode}
                    isSelected={selectedItems.has(list.id)}
                    onSelect={() => toggleItemSelection(list.id)}
                    onEdit={(id, data) => updateList(id, data)}
                    onDelete={handleDeleteList}
                    onDuplicate={handleDuplicateList}
                    onShare={handleShareList}
                    onViewDetails={(list) => {
                      setSelectedListForItems(list);
                      fetchListDetails(list.id);
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyListsState onCreateList={() => setShowCreateModal(true)} />
            )}
          </div>
        )}

        {activeTab === 'analytics' && <ListAnalytics />}
        {activeTab === 'templates' && <ListTemplates onCreateFromTemplate={fetchLists} />}

        {/* Create List Modal */}
        <CreateListModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateList}
        />

        {/* List Items Modal */}
        {selectedListForItems && (
          <ListItemsModal
            selectedList={selectedListForItems}
            isOpen={!!selectedListForItems}
            onClose={() => setSelectedListForItems(null)}
          />
        )}

        {/* Share List Modal */}
        <ShareListModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedListForShare(null);
          }}
          list={selectedListForShare}
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
      </div>
    </div>
  );
};

// Sub-components are imported from separate files

const EmptyListsState = ({ onCreateList }) => {
  return (
    <div className="text-center py-16">
      <div className="mb-6">
        <ListChecks size={64} className="mx-auto text-slate-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Lists Yet</h3>
        <p className="text-slate-400 mb-6">Create your first list to get started with organizing your tasks</p>
        <button
          onClick={onCreateList}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2 mx-auto"
        >
          <Plus size={20} />
          Create Your First List
        </button>
      </div>
    </div>
  );
};

export default ListsPageEnhanced;
