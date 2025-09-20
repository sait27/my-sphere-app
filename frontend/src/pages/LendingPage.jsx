import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, 
  BarChart3, PieChart, Filter, Search, Calendar, Download, 
  CheckCircle, Clock, Target, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Components

import LendingFilters from '../components/lending/LendingFilters';
import TransactionCard from '../components/lending/TransactionCard';
import CreateTransactionModal from '../components/lending/CreateTransactionModal';
import AddPaymentModal from '../components/lending/AddPaymentModal';
import LendingBulkActions from '../components/lending/LendingBulkActions';
import LendingAnalytics from '../components/lending/LendingAnalytics';
import ContactManagement from '../components/lending/ContactManagement';
import TransactionTemplates from '../components/lending/TransactionTemplates';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/modals/ConfirmModal';

// Hooks and API
import { useLending } from '../hooks/useLending';
import { testLendingAPI } from '../utils/testLendingAPI';

function LendingPage() {
  // State management
  const [viewMode, setViewMode] = useState('list'); // 'list', 'analytics', 'contacts', 'templates'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [transactionType, setTransactionType] = useState('all');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });

  // Custom hook for lending functionality
  const {
    transactions,
    categories,
    contacts,
    dashboardData,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    markCompleted,
    addPayment,
    bulkOperations,
    fetchTransactions,
    createContact
  } = useLending();

  // Test API connectivity on mount
  useEffect(() => {
    testLendingAPI();
  }, []);

  // Filtered and sorted transactions
  const filteredAndSortedTransactions = useMemo(() => {
    return transactions
      .filter(transaction => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          transaction.person_name?.toLowerCase().includes(searchLower) ||
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.notes?.toLowerCase().includes(searchLower) ||
          transaction.category?.toLowerCase().includes(searchLower)
        );

        const matchesType = transactionType === 'all' || transaction.transaction_type === transactionType;
        const matchesStatus = status === 'all' || transaction.status === status;
        const matchesPriority = priority === 'all' || transaction.priority === priority;
        const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;

        const matchesAmountRange = (() => {
          const amount = parseFloat(transaction.amount);
          const minAmount = amountRange.min ? parseFloat(amountRange.min) : 0;
          const maxAmount = amountRange.max ? parseFloat(amountRange.max) : Infinity;
          return amount >= minAmount && amount <= maxAmount;
        })();

        const matchesDateRange = (() => {
          if (dateRange === 'all') return true;
          const transactionDate = new Date(transaction.transaction_date);
          const now = new Date();

          switch (dateRange) {
            case 'today':
              return transactionDate.toDateString() === now.toDateString();
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return transactionDate >= weekAgo;
            case 'month':
              return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
            case 'quarter':
              const quarter = Math.floor(now.getMonth() / 3);
              const transactionQuarter = Math.floor(transactionDate.getMonth() / 3);
              return quarter === transactionQuarter && transactionDate.getFullYear() === now.getFullYear();
            case 'year':
              return transactionDate.getFullYear() === now.getFullYear();
            default:
              return true;
          }
        })();

        return matchesSearch && matchesType && matchesStatus && matchesPriority && 
               matchesCategory && matchesAmountRange && matchesDateRange;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'amount_desc':
            return b.amount - a.amount;
          case 'amount_asc':
            return a.amount - b.amount;
          case 'date_desc':
          default:
            return new Date(b.transaction_date) - new Date(a.transaction_date);
          case 'date_asc':
            return new Date(a.transaction_date) - new Date(b.transaction_date);
          case 'person_name':
            return a.person_name.localeCompare(b.person_name);
          case 'due_date':
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
        }
      });
  }, [transactions, searchTerm, transactionType, status, priority, filterCategory, amountRange, dateRange, sortBy]);

  // Summary calculations
  const summary = useMemo(() => {
    const totalLent = transactions
      .filter(t => t.transaction_type === 'lend')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalBorrowed = transactions
      .filter(t => t.transaction_type === 'borrow')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const overdueCount = transactions
      .filter(t => t.status === 'overdue' || (t.due_date && new Date(t.due_date) < new Date() && t.status === 'active'))
      .length;

    return {
      totalLent,
      totalBorrowed,
      netAmount: totalLent - totalBorrowed,
      overdueCount,
      totalTransactions: transactions.length,
      activeTransactions: transactions.filter(t => t.status === 'active').length
    };
  }, [transactions]);

  // Event handlers
  const handleCreateTransaction = async (formData) => {
    try {
      await createTransaction(formData);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsCreateModalOpen(true);
  };

  const handleDeleteRequest = (transactionId) => {
    setDeletingTransactionId(transactionId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteTransaction(deletingTransactionId);
      setShowConfirmModal(false);
      setDeletingTransactionId(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleAddPayment = (transaction) => {
    setSelectedTransaction(transaction);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (transactionId, paymentData) => {
    try {
      await addPayment(transactionId, paymentData);
      setIsPaymentModalOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Failed to add payment:', error);
    }
  };

  const handleSelectTransaction = (transactionId) => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredAndSortedTransactions.map(t => t.lending_id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkActionComplete = async (actionData) => {
    try {
      await bulkOperations(actionData);
      setSelectedTransactions([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setDateRange('all');
    setSortBy('date_desc');
    setTransactionType('all');
    setStatus('all');
    setPriority('all');
    setAmountRange({ min: '', max: '' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-3 text-white bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
          Lending & Borrowing
        </h2>
        <p className="text-slate-400 text-lg">Manage your personal loans and track financial relationships</p>
        
        {/* View Mode Selector */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                viewMode === 'list'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Activity size={16} />
              <span>Transactions</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                viewMode === 'analytics'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <BarChart3 size={16} />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setViewMode('contacts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                viewMode === 'contacts'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Users size={16} />
              <span>Contacts</span>
            </button>
            <button
              onClick={() => setViewMode('templates')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                viewMode === 'templates'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Target size={16} />
              <span>Templates</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-green-500/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl">
              <TrendingUp className="text-green-400" size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(summary.totalLent)}</h3>
            <p className="text-slate-400 text-sm font-medium">Total Lent</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl">
              <TrendingDown className="text-orange-400" size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(summary.totalBorrowed)}</h3>
            <p className="text-slate-400 text-sm font-medium">Total Borrowed</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl">
              <DollarSign className="text-blue-400" size={24} />
            </div>
          </div>
          <div>
            <h3 className={`text-2xl font-bold mb-1 ${summary.netAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(Math.abs(summary.netAmount))}
            </h3>
            <p className="text-slate-400 text-sm font-medium">
              Net {summary.netAmount >= 0 ? 'Receivable' : 'Payable'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-red-500/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{summary.overdueCount}</h3>
            <p className="text-slate-400 text-sm font-medium">Overdue Transactions</p>
          </div>
        </motion.div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'analytics' ? (
        <LendingAnalytics />
      ) : viewMode === 'contacts' ? (
        <ContactManagement 
          contacts={contacts}
          onCreateContact={createContact}
          onUpdateContact={(id, data) => updateTransaction(id, data)}
          onDeleteContact={(id) => deleteTransaction(id)}
        />
      ) : viewMode === 'templates' ? (
        <TransactionTemplates 
          templates={[]}
          onCreateTemplate={createTransaction}
          onUpdateTemplate={updateTransaction}
          onDeleteTemplate={deleteTransaction}
          onUseTemplate={(template) => {
            setSelectedTransaction(template);
            setIsCreateModalOpen(true);
          }}
        />
      ) : (
        <div>
          {/* Filters */}
          <LendingFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            dateRange={dateRange}
            setDateRange={setDateRange}
            sortBy={sortBy}
            setSortBy={setSortBy}
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            status={status}
            setStatus={setStatus}
            priority={priority}
            setPriority={setPriority}
            amountRange={amountRange}
            setAmountRange={setAmountRange}
            categories={categories}
            onClearFilters={clearFilters}
          />

          {/* Bulk Actions */}
          <LendingBulkActions
            selectedTransactions={selectedTransactions}
            onActionComplete={handleBulkActionComplete}
            categories={categories}
          />

          {/* Transactions List */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
            {filteredAndSortedTransactions.length > 0 ? (
              <div>
                {/* Select All Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-600/30">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                    />
                    <span className="text-slate-300 text-sm font-medium">
                      Select All ({filteredAndSortedTransactions.length})
                    </span>
                  </div>
                  <span className="text-slate-400 text-sm">
                    Total: {formatCurrency(filteredAndSortedTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0))}
                  </span>
                </div>

                <div className="grid gap-4">
                  {filteredAndSortedTransactions.map((transaction, index) => (
                    <TransactionCard
                      key={transaction.lending_id}
                      transaction={transaction}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteRequest}
                      onMarkCompleted={markCompleted}
                      onAddPayment={handleAddPayment}
                      isSelected={selectedTransactions.includes(transaction.lending_id)}
                      onSelect={handleSelectTransaction}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={DollarSign}
                title="No transactions found"
                description="Start by creating your first lending or borrowing transaction, or adjust your filters."
              />
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedTransaction(null);
        }}
        onSubmit={handleCreateTransaction}
        categories={categories}
        contacts={contacts}
        transaction={selectedTransaction}
      />

      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onSubmit={handlePaymentSubmit}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  );
}

export default LendingPage;