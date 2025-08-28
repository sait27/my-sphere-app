import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, DollarSign, TrendingUp, AlertTriangle, Plus, BarChart3, CreditCard, Edit3, Download, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import SubscriptionCard from './SubscriptionCard';
import CreateSubscriptionModal from './CreateSubscriptionModal';
import EditSubscriptionModal from './EditSubscriptionModal';
import SubscriptionFilters from './SubscriptionFilters';
import SubscriptionBulkActions from './SubscriptionBulkActions';
import CategoryManagementModal from './CategoryManagementModal';
import NotificationBell from './NotificationBell';
import AlertsPanel from './AlertsPanel';
import apiClient from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import SubscriptionAnalytics from './SubscriptionAnalytics';

const SubscriptionDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [billingCycleFilter, setBillingCycleFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('date_desc');
  
  // Bulk operations
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // View mode and UI states
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions', 'analytics', 'alerts'
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchSubscriptions();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/subscriptions/subscriptions/dashboard/');
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await apiClient.get('/subscriptions/subscriptions/');
      setSubscriptions(response.data);
    } catch (error) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionCreated = () => {
    fetchDashboardData();
    fetchSubscriptions();
    setShowCreateModal(false);
  };

  const handleEditSubscription = (subscription) => {
    setCurrentSubscription(subscription);
    setShowEditModal(true);
  };

  const handleSubscriptionUpdated = () => {
    fetchDashboardData();
    fetchSubscriptions();
    setShowEditModal(false);
    setCurrentSubscription(null);
  };

  const handleSelectSubscription = (subscriptionId) => {
    setSelectedSubscriptions(prev => {
      if (prev.includes(subscriptionId)) {
        return prev.filter(id => id !== subscriptionId);
      } else {
        return [...prev, subscriptionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSubscriptions([]);
    } else {
      setSelectedSubscriptions(filteredAndSortedSubscriptions.map(sub => sub.subscription_id));
    }
    setSelectAll(!selectAll);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setBillingCycleFilter('all');
    setPaymentMethodFilter('all');
    setAmountRange({ min: '', max: '' });
    setSortBy('date_desc');
  };

  const handleBulkActionComplete = () => {
    setSelectedSubscriptions([]);
    setSelectAll(false);
    fetchDashboardData();
    fetchSubscriptions();
  };

  // Filtered and sorted subscriptions
  const filteredAndSortedSubscriptions = useMemo(() => {
    return subscriptions
      .filter(subscription => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          subscription.name?.toLowerCase().includes(searchLower) ||
          subscription.provider?.toLowerCase().includes(searchLower) ||
          subscription.description?.toLowerCase().includes(searchLower)
        );
        
        const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
        const matchesBillingCycle = billingCycleFilter === 'all' || subscription.billing_cycle === billingCycleFilter;
        const matchesPaymentMethod = paymentMethodFilter === 'all' || subscription.payment_method === paymentMethodFilter;
        
        const matchesAmountRange = (() => {
          const amount = parseFloat(subscription.monthly_cost || subscription.amount);
          const minAmount = amountRange.min ? parseFloat(amountRange.min) : 0;
          const maxAmount = amountRange.max ? parseFloat(amountRange.max) : Infinity;
          return amount >= minAmount && amount <= maxAmount;
        })();
        
        return matchesSearch && matchesStatus && matchesBillingCycle && matchesPaymentMethod && matchesAmountRange;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'amount_desc':
            return (b.monthly_cost || b.amount) - (a.monthly_cost || a.amount);
          case 'amount_asc':
            return (a.monthly_cost || a.amount) - (b.monthly_cost || b.amount);
          case 'date_desc':
          default:
            return new Date(b.created_at) - new Date(a.created_at);
          case 'date_asc':
            return new Date(a.created_at) - new Date(b.created_at);
          case 'name':
            return a.name.localeCompare(b.name);
          case 'provider':
            return (a.provider || '').localeCompare(b.provider || '');
        }
      });
  }, [subscriptions, searchTerm, statusFilter, billingCycleFilter, paymentMethodFilter, amountRange, sortBy]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(subscriptions.map(sub => sub.category?.name).filter(Boolean))];
    return uniqueCategories.sort();
  }, [subscriptions]);

  const totalFilteredAmount = useMemo(() => {
    return filteredAndSortedSubscriptions.reduce((total, sub) => total + parseFloat(sub.monthly_cost || sub.amount || 0), 0);
  }, [filteredAndSortedSubscriptions]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="animate-slide-up">
      {/* Enhanced Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-3 text-white bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
          Subscription Tracker
        </h2>
        <p className="text-slate-400 text-lg">Manage and optimize your recurring subscriptions with AI insights</p>
        
        {/* Tabs */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center bg-slate-700/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'subscriptions'
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              My Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Alerts
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Subscription
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">
                {dashboardData?.active_subscriptions || 0}
              </p>
              <p className="text-sm text-slate-400">Active</p>
            </div>
          </div>
          <p className="text-slate-300 font-medium">Active Subscriptions</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 animate-scale-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">
                ₹{dashboardData?.monthly_cost?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-slate-400">Monthly</p>
            </div>
          </div>
          <p className="text-slate-300 font-medium">Monthly Cost</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 animate-scale-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">
                ₹{dashboardData?.yearly_cost?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-slate-400">Yearly</p>
            </div>
          </div>
          <p className="text-slate-300 font-medium">Yearly Cost</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 animate-scale-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">
                {dashboardData?.upcoming_renewals || 0}
              </p>
              <p className="text-sm text-slate-400">This Month</p>
            </div>
          </div>
          <p className="text-slate-300 font-medium">Upcoming Renewals</p>
        </div>
      </div>



      {/* Category Breakdown */}
      {dashboardData?.categories && Object.keys(dashboardData.categories).length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 mb-8 animate-scale-in" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg">
                <BarChart3 className="text-indigo-400" size={24} />
              </div>
              <h3 className="font-bold text-xl text-white">Spending by Category</h3>
            </div>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
            >
              <Edit3 className="w-4 h-4" />
              Manage Categories
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(dashboardData.categories).map(([category, data]) => (
              <div key={category} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-white">{category}</h4>
                  <span className="px-2 py-1 bg-slate-600/50 text-slate-300 text-xs rounded-lg">
                    {data.count} subs
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ₹{data.cost.toFixed(2)}/mo
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <>
          {/* Filter Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl transition-all duration-200 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <SubscriptionFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              billingCycleFilter={billingCycleFilter}
              setBillingCycleFilter={setBillingCycleFilter}
              paymentMethodFilter={paymentMethodFilter}
              setPaymentMethodFilter={setPaymentMethodFilter}
              amountRange={amountRange}
              setAmountRange={setAmountRange}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onClearFilters={clearFilters}
              categories={categories}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          )}

          {/* Bulk Actions */}
          <SubscriptionBulkActions
            selectedSubscriptions={selectedSubscriptions}
            onActionComplete={handleBulkActionComplete}
            categories={categories}
          />

          {/* Enhanced Subscriptions List */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 animate-scale-in" style={{animationDelay: '0.5s'}}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
              <CreditCard className="text-cyan-400" size={24} />
            </div>
            <h3 className="font-bold text-xl text-white">Your Subscriptions</h3>
            <span className="text-slate-400 text-sm">({filteredAndSortedSubscriptions.length} of {subscriptions.length})</span>
          </div>
          
          {filteredAndSortedSubscriptions.length > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-white">₹{totalFilteredAmount.toFixed(2)}</p>
              <p className="text-xs text-slate-400">Total Monthly Cost</p>
            </div>
          )}
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gradient-to-br from-slate-700/30 to-slate-600/20 rounded-2xl inline-block mb-4">
              <CreditCard className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-slate-400 mb-6 text-lg">No subscriptions yet</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
            >
              Add Your First Subscription
            </button>
          </div>
        ) : filteredAndSortedSubscriptions.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gradient-to-br from-slate-700/30 to-slate-600/20 rounded-2xl inline-block mb-4">
              <Filter className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-slate-400 mb-6 text-lg">No subscriptions match your filters</p>
            <button 
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div>
            {/* Select All Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-600/30">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                />
                <span className="text-slate-300 text-sm font-medium">
                  Select All ({filteredAndSortedSubscriptions.length})
                </span>
              </div>
              <span className="text-slate-400 text-sm">
                Total: ₹{totalFilteredAmount.toFixed(2)}/month
              </span>
            </div>

            <div className={`grid gap-4 sm:gap-3 ${
              viewMode === 'grid' 
                ? 'md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' 
                : 'md:grid-cols-1'
            }`}>
              {filteredAndSortedSubscriptions.map((subscription, index) => (
                <SubscriptionCard
                  key={subscription.subscription_id}
                  subscription={subscription}
                  onUpdate={fetchSubscriptions}
                  onEdit={handleEditSubscription}
                  onSelect={handleSelectSubscription}
                  isSelected={selectedSubscriptions.includes(subscription.subscription_id)}
                  index={index}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </div>
        )}
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <SubscriptionAnalytics />
      )}

      {activeTab === 'alerts' && (
        <AlertsPanel />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateSubscriptionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSubscriptionCreated}
        />
      )}
      
      {showEditModal && (
        <EditSubscriptionModal
          subscription={currentSubscription}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleSubscriptionUpdated}
        />
      )}
      
      {showCategoryModal && (
        <CategoryManagementModal
          onClose={() => setShowCategoryModal(false)}
          onSuccess={() => {
            fetchDashboardData();
            fetchSubscriptions();
          }}
        />
      )}
    </div>
  );
};

export default SubscriptionDashboard;