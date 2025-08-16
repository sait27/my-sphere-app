// components/ListifyDashboard.jsx

import React, { useState, useEffect } from 'react';
import { 
  Plus, Grid, List, BarChart3, Settings, 
  Search, Filter, Star, Clock, TrendingUp,
  Package, CheckCircle, Users, Calendar
} from 'lucide-react';
import { useLists } from '../../hooks/useLists';
import { useListAnalytics } from '../../hooks/useListAnalytics';
import EnhancedListCard from './EnhancedListCard';
import SmartFilters from './SmartFilters';
import BulkOperationsBar from './BulkOperationsBar';
import ListItemsModal from './ListItemsModal';
import ListAnalytics from './ListAnalytics';
import ListTemplates from './ListTemplates';
import ListInsights from './ListInsights';
import CreateListModal from '../modals/CreateListModal';
import ConfirmModal from '../modals/ConfirmModal';
import ErrorBoundary from '../common/ErrorBoundary';
import { SlideUp, StaggerContainer, StaggerItem, FadeIn } from '../ui/AnimatedTransitions';
import toast from 'react-hot-toast';

const ListifyDashboard = () => {
  const {
    lists,
    selectedList,
    loading,
    error,
    filters,
    selectedItems,
    stats,
    fetchLists,
    createList,
    updateList,
    deleteList,
    duplicateList,
    setSelectedList,
    setFilters,
    toggleItemSelection,
    selectAllItems,
    clearSelections,
    bulkOperations
  } = useLists();

  const { analytics, fetchAnalytics } = useListAnalytics();

  const [viewMode, setViewMode] = useState('grid'); // grid, list, analytics, templates
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLists();
    fetchAnalytics('month');
  }, []);

  const handleCreateList = async (listData) => {
    try {
      await createList(listData);
      setShowCreateModal(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSelectList = (list) => {
    setSelectedList(list);
    setShowItemsModal(true);
  };

  const handleDeleteList = (list) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete List',
      message: `Are you sure you want to delete "${list.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteList(list.id);
          toast.success('List deleted successfully');
        } catch (error) {
          toast.error('Failed to delete list');
        }
      }
    });
  };

  const handleDuplicateList = async (list) => {
    try {
      await duplicateList(list.id, `${list.name} (Copy)`);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleBulkOperation = async (operation, itemIds) => {
    return bulkOperations(operation, itemIds);
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      list_type: '',
      priority: '',
      is_archived: false,
      category: '',
      is_favorite: false,
      is_shared: false,
      completion_status: ''
    });
  };

  const filteredLists = lists.filter(list => {
    if (searchQuery && !list.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const renderViewContent = () => {
    switch (viewMode) {
      case 'analytics':
        return (
          <ErrorBoundary fallbackMessage="Failed to load analytics">
            <ListAnalytics />
          </ErrorBoundary>
        );
      
      case 'templates':
        return (
          <ErrorBoundary fallbackMessage="Failed to load templates">
            <ListTemplates onCreateFromTemplate={fetchLists} />
          </ErrorBoundary>
        );
      
      case 'list':
      case 'grid':
      default:
        return (
          <div className="space-y-6">
            {/* Smart Filters */}
            <SmartFilters
              filters={filters}
              onFiltersChange={setFilters}
              stats={stats}
              onClearFilters={clearAllFilters}
            />

            {/* Lists Grid/List View */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-400 mb-2">Failed to load lists</div>
                <button 
                  onClick={fetchLists}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  Try again
                </button>
              </div>
            ) : filteredLists.length === 0 ? (
              <FadeIn>
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-slate-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Lists Found</h3>
                  <p className="text-slate-400 mb-6">
                    {Object.values(filters).some(v => v !== '' && v !== false) 
                      ? 'Try adjusting your filters or create a new list'
                      : 'Create your first list to get started'
                    }
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25"
                  >
                    Create Your First List
                  </button>
                </div>
              </FadeIn>
            ) : (
              <StaggerContainer className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-4'
              }>
                {filteredLists.map((list, index) => (
                  <StaggerItem key={list.id}>
                    <EnhancedListCard
                      list={list}
                      onSelect={handleSelectList}
                      onEdit={(list) => {
                        setSelectedList(list);
                        setShowCreateModal(true);
                      }}
                      onDelete={handleDeleteList}
                      onDuplicate={handleDuplicateList}
                      isSelected={selectedItems.has(list.id)}
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}

            {/* Bulk Operations Bar */}
            <BulkOperationsBar
              selectedItems={selectedItems}
              onClearSelection={clearSelections}
              onBulkOperation={handleBulkOperation}
              totalItems={filteredLists.length}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <SlideUp>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold text-white mb-2">
                Listify Dashboard
              </h1>
              <p className="text-slate-400">
                Manage your lists with AI-powered insights and smart organization
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Quick search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 w-64"
                />
              </div>

              {/* Create List Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25"
              >
                <Plus size={18} />
                New List
              </button>
            </div>
          </div>
        </SlideUp>

        {/* Stats Cards */}
        <SlideUp delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
                  <Package className="text-cyan-400" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.total || 0}</div>
                  <div className="text-sm text-slate-400">Total Lists</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                  <CheckCircle className="text-green-400" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.completed || 0}</div>
                  <div className="text-sm text-slate-400">Completed</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
                  <Clock className="text-orange-400" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.active || 0}</div>
                  <div className="text-sm text-slate-400">Active</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                  <Users className="text-purple-400" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.shared || 0}</div>
                  <div className="text-sm text-slate-400">Shared</div>
                </div>
              </div>
            </div>
          </div>
        </SlideUp>

        {/* View Mode Tabs */}
        <SlideUp delay={0.2}>
          <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl mb-8 w-fit">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Grid size={16} />
              Grid View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <List size={16} />
              List View
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'analytics'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
            <button
              onClick={() => setViewMode('templates')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'templates'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Star size={16} />
              Templates
            </button>
          </div>
        </SlideUp>

        {/* Main Content */}
        <SlideUp delay={0.3}>
          {renderViewContent()}
        </SlideUp>

        {/* Modals */}
        <CreateListModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedList(null);
          }}
          onSubmit={handleCreateList}
          editingList={selectedList}
        />

        <ListItemsModal
          isOpen={showItemsModal}
          onClose={() => {
            setShowItemsModal(false);
            setSelectedList(null);
          }}
          selectedList={selectedList}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false })}
          onConfirm={() => {
            if (confirmModal.onConfirm) confirmModal.onConfirm();
            setConfirmModal({ isOpen: false });
          }}
          title={confirmModal.title || "Confirm Action"}
          message={confirmModal.message || "Are you sure?"}
        />
      </div>
    </div>
  );
};

export default ListifyDashboard;
