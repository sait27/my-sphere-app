import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Download, Upload, Edit3, Trash2, Calendar, DollarSign, Tag, BarChart3, PieChart, TrendingUp, Wallet, MapPin, ShoppingBag, Coffee, Car, Gamepad2, Zap, Heart, GraduationCap, MoreHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseAPI } from '../api/expenses';
import ExpenseFilters from '../components/expenses/ExpenseFilters';
import ExpenseBulkActions from '../components/expenses/ExpenseBulkActions';
import ExpenseAnalytics from '../components/expenses/ExpenseAnalytics';
import ExpenseAIInsights from '../components/expenses/ExpenseAIInsights';
import EditExpenseModal from '../components/modals/EditExpenseModal';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/modals/ConfirmModal';
import CategoryPieChart from '../components/expenses/CategoryPieChart';

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [expenseText, setExpenseText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [expenseType, setExpenseType] = useState('all');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'chart', 'analytics'
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchExpenses = async () => {
    try {
      const response = await expenseAPI.getExpenses();
      setExpenses(response.data);
    } catch (error) {
      // Failed to fetch expenses
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    if (!expenseText.trim()) return;
    setIsSubmitting(true);
    try {
      await expenseAPI.createExpense(expenseText);
      toast.success("Expense added successfully!");
      setExpenseText('');
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to add expense.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeleteRequest = (expenseId) => {
  // This function just prepares for the deletion by opening the modal
  setDeletingExpenseId(expenseId);
  setShowConfirmModal(true);
};

const confirmDelete = async () => {
  // This function runs when the user clicks "Confirm" in the modal
  try {
    await expenseAPI.deleteExpense(deletingExpenseId);
    toast.success("Expense deleted.");
    fetchExpenses(); // Refresh the list
  } catch (error) {
    toast.error("Failed to delete expense.");
  } finally {
    // Clean up and close the modal
    setShowConfirmModal(false);
    setDeletingExpenseId(null);
  }
};

  const handleUpdateExpense = async (updatedExpenseData) => {
    await expenseAPI.updateExpense(updatedExpenseData.expense_id, updatedExpenseData);
    fetchExpenses();
  };

  const handleOpenEditModal = (expense) => {
    setCurrentExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentExpense(null);
  };

  const filteredAndSortedExpenses = useMemo(() => {
    return expenses
      .filter(expense => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          expense.vendor?.toLowerCase().includes(searchLower) ||
          expense.category.toLowerCase().includes(searchLower) ||
          expense.raw_text.toLowerCase().includes(searchLower)
        );
        
        const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
        const matchesPaymentMethod = paymentMethod === 'all' || expense.payment_method === paymentMethod;
        const matchesExpenseType = expenseType === 'all' || expense.expense_type === expenseType;
        
        const matchesAmountRange = (() => {
          const amount = parseFloat(expense.amount);
          const minAmount = amountRange.min ? parseFloat(amountRange.min) : 0;
          const maxAmount = amountRange.max ? parseFloat(amountRange.max) : Infinity;
          return amount >= minAmount && amount <= maxAmount;
        })();
        
        const matchesDateRange = (() => {
          if (dateRange === 'all') return true;
          const expenseDate = new Date(expense.transaction_date);
          const now = new Date();
          
          switch (dateRange) {
            case 'today':
              return expenseDate.toDateString() === now.toDateString();
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return expenseDate >= weekAgo;
            case 'month':
              return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
            case 'quarter':
              const quarter = Math.floor(now.getMonth() / 3);
              const expenseQuarter = Math.floor(expenseDate.getMonth() / 3);
              return quarter === expenseQuarter && expenseDate.getFullYear() === now.getFullYear();
            case 'year':
              return expenseDate.getFullYear() === now.getFullYear();
            default:
              return true;
          }
        })();
        
        return matchesSearch && matchesCategory && matchesPaymentMethod && matchesExpenseType && matchesAmountRange && matchesDateRange;
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
          case 'category':
            return a.category.localeCompare(b.category);
          case 'vendor':
            return (a.vendor || '').localeCompare(b.vendor || '');
        }
      });
  }, [expenses, searchTerm, sortBy, filterCategory, dateRange, paymentMethod, expenseType, amountRange]);

  const totalAmount = useMemo(() => {
    return filteredAndSortedExpenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  }, [filteredAndSortedExpenses]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredAndSortedExpenses.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, dateRange, paymentMethod, expenseType, amountRange]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(expenses.map(expense => expense.category))];
    return uniqueCategories.filter(Boolean).sort();
  }, [expenses]);

  const handleSelectExpense = (expenseId) => {
    setSelectedExpenses(prev => {
      if (prev.includes(expenseId)) {
        return prev.filter(id => id !== expenseId);
      } else {
        return [...prev, expenseId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredAndSortedExpenses.map(expense => expense.expense_id));
    }
    setSelectAll(!selectAll);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setDateRange({ start: '', end: '' });
    setSortBy('date_desc');
    setPaymentMethod('all');
    setExpenseType('all');
    setAmountRange({ min: '', max: '' });
  };

  const handleBulkActionComplete = () => {
    setSelectedExpenses([]);
    setSelectAll(false);
    fetchExpenses();
  };

  // Category helper functions
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Food & Dining': <Coffee size={16} className="text-orange-400" />,
      'Groceries': <ShoppingBag size={16} className="text-green-400" />,
      'Shopping': <ShoppingBag size={16} className="text-blue-400" />,
      'Travel': <Car size={16} className="text-purple-400" />,
      'Entertainment': <Gamepad2 size={16} className="text-pink-400" />,
      'Utilities': <Zap size={16} className="text-yellow-400" />,
      'Health': <Heart size={16} className="text-red-400" />,
      'Education': <GraduationCap size={16} className="text-indigo-400" />,
      'Other': <MoreHorizontal size={16} className="text-slate-400" />
    };
    return iconMap[category] || iconMap['Other'];
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'Food & Dining': 'bg-orange-500',
      'Groceries': 'bg-green-500',
      'Shopping': 'bg-blue-500',
      'Travel': 'bg-purple-500',
      'Entertainment': 'bg-pink-500',
      'Utilities': 'bg-yellow-500',
      'Health': 'bg-red-500',
      'Education': 'bg-indigo-500',
      'Other': 'bg-slate-500'
    };
    return colorMap[category] || colorMap['Other'];
  };

  const getCategoryBgColor = (category) => {
    const colorMap = {
      'Food & Dining': 'bg-orange-500/20',
      'Groceries': 'bg-green-500/20',
      'Shopping': 'bg-blue-500/20',
      'Travel': 'bg-purple-500/20',
      'Entertainment': 'bg-pink-500/20',
      'Utilities': 'bg-yellow-500/20',
      'Health': 'bg-red-500/20',
      'Education': 'bg-indigo-500/20',
      'Other': 'bg-slate-500/20'
    };
    return colorMap[category] || colorMap['Other'];
  };

  const getCategoryTagColor = (category) => {
    const colorMap = {
      'Food & Dining': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      'Groceries': 'bg-green-500/20 text-green-300 border border-green-500/30',
      'Shopping': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      'Travel': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      'Entertainment': 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
      'Utilities': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      'Health': 'bg-red-500/20 text-red-300 border border-red-500/30',
      'Education': 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      'Other': 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
    };
    return colorMap[category] || colorMap['Other'];
  };


  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { exportExpensesToCSV, exportExpensesToPDF } = await import('../utils/exportUtils');
      
      // Export both CSV and PDF
      await exportExpensesToCSV(expenses);
      await exportExpensesToPDF(expenses);
      
      toast.success('Expenses exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export expenses');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="animate-slide-up">
      {/* Enhanced Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-3 text-white bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
          Expense Ledger
        </h2>
        <p className="text-slate-400 text-lg">Track and analyze your financial transactions with AI insights</p>
        
        {/* View Mode Selector */}
        <div className="flex items-center space-x-2 mt-4">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
              viewMode === 'list'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <BarChart3 size={16} />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
              viewMode === 'analytics'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <TrendingUp size={16} />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Enhanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                <TrendingUp className="text-cyan-400" size={24} />
              </div>
              <h3 className="font-bold text-xl text-white">Spending Analysis</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('chart')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'chart' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                title="Chart View"
              >
                <PieChart size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                title="List View"
              >
                <BarChart3 size={18} />
              </button>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            {expenses.length > 0 ? (
              <CategoryPieChart expenses={filteredAndSortedExpenses} />
            ) : (
              <div className="text-center">
                <p className="text-slate-400">No expenses to visualize</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 animate-scale-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">
              <DollarSign className="text-green-400" size={20} />
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Total Expenses</h3>
          </div>
          <p className="text-4xl font-bold text-white mb-4">₹{totalAmount.toFixed(2)}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Transactions</span>
              <span className="text-white font-semibold">{filteredAndSortedExpenses.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Average</span>
              <span className="text-white font-semibold">
                ₹{filteredAndSortedExpenses.length > 0 ? (totalAmount / filteredAndSortedExpenses.length).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className={`w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2 ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Enhanced Add Expense Form */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 mb-8 animate-scale-in" style={{animationDelay: '0.2s'}}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
            <Plus className="text-purple-400" size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Log a New Expense</h3>
        </div>
        <form onSubmit={handleExpenseSubmit} className="mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 rounded-xl p-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={expenseText}
                    onChange={(e) => setExpenseText(e.target.value)}
                    placeholder="Tell me about your expense..."
                    className="w-full px-4 py-3 bg-transparent text-white placeholder-slate-400 focus:outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                
                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 px-2">
                  <button
                    type="button"
                    onClick={() => setExpenseText('paid 100 for groceries')}
                    className="px-3 py-1 text-xs bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-1"
                    title="Quick: Groceries"
                  >
                    <ShoppingBag size={12} />
                    ₹100
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseText('paid 200 for dinner')}
                    className="px-3 py-1 text-xs bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors flex items-center gap-1"
                    title="Quick: Dining"
                  >
                    <Coffee size={12} />
                    ₹200
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseText('paid 50 for fuel')}
                    className="px-3 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-1"
                    title="Quick: Travel"
                  >
                    <Car size={12} />
                    ₹50
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !expenseText.trim()}
                  className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Plus size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* AI Suggestions */}
          {expenseText && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span>AI will parse:</span>
              <span className="text-cyan-400">Amount, Category, Vendor, Date</span>
            </div>
          )}
        </form>
        
        {/* Quick Example Pills */}
        <div className="mt-4 space-y-2">
          <div className="text-slate-400 text-xs font-medium">Quick examples:</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setExpenseText('paid 150 for groceries at BigBazaar')}
              className="px-3 py-1.5 text-xs bg-slate-700/40 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors border border-slate-600/30"
            >
              🛒 Groceries ₹150
            </button>
            <button
              type="button"
              onClick={() => setExpenseText('spent 300 on dinner at Pizza Hut')}
              className="px-3 py-1.5 text-xs bg-slate-700/40 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors border border-slate-600/30"
            >
              🍕 Dinner ₹300
            </button>
            <button
              type="button"
              onClick={() => setExpenseText('filled petrol for 2000 rupees')}
              className="px-3 py-1.5 text-xs bg-slate-700/40 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors border border-slate-600/30"
            >
              ⛽ Fuel ₹2000
            </button>
            <button
              type="button"
              onClick={() => setExpenseText('movie tickets cost 400')}
              className="px-3 py-1.5 text-xs bg-slate-700/40 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors border border-slate-600/30"
            >
              🎬 Movies ₹400
            </button>
            <button
              type="button"
              onClick={() => setExpenseText('uber ride 120 rupees')}
              className="px-3 py-1.5 text-xs bg-slate-700/40 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors border border-slate-600/30"
            >
              🚗 Transport ₹120
            </button>
            <button
              type="button"
              onClick={() => setExpenseText('coffee at Starbucks 250')}
              className="px-3 py-1.5 text-xs bg-slate-700/40 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors border border-slate-600/30"
            >
              ☕ Coffee ₹250
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Content Based on View Mode */}
      {viewMode === 'analytics' ? (
        <>
          <ExpenseAnalytics />
          <ExpenseAIInsights />
        </>
      ) : (
        <div>
          {/* Advanced Filters */}
          <ExpenseFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            dateRange={dateRange}
            setDateRange={setDateRange}
            sortBy={sortBy}
            setSortBy={setSortBy}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            expenseType={expenseType}
            setExpenseType={setExpenseType}
            amountRange={amountRange}
            setAmountRange={setAmountRange}
            categories={categories}
            onClearFilters={clearFilters}
          />

          {/* Bulk Actions */}
          <ExpenseBulkActions
            selectedExpenses={selectedExpenses}
            onActionComplete={handleBulkActionComplete}
            categories={categories}
          />

          {/* Enhanced Expenses List */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 animate-scale-in" style={{animationDelay: '0.4s'}}>
            {filteredAndSortedExpenses.length > 0 ? (
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
                      Select All ({paginatedExpenses.length})
                    </span>
                  </div>
                  <span className="text-slate-400 text-sm">
                    Total: ₹{totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="grid gap-4 sm:gap-3 md:grid-cols-1 lg:grid-cols-1">
                  {paginatedExpenses.map((expense, index) => (
                    <div
                      key={expense.expense_id}
                      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 animate-slideInUp ${
                        selectedExpenses.includes(expense.expense_id)
                          ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/40 shadow-lg shadow-cyan-500/20'
                          : 'bg-gradient-to-br from-slate-800/50 to-slate-700/30 hover:from-slate-700/60 hover:to-slate-600/40 border-slate-600/30 hover:border-slate-500/50'
                      }`}
                      style={{animationDelay: `${0.1 * index}s`}}
                    >
                      {/* Category Color Bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${getCategoryColor(expense.category)}`}></div>
                      
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedExpenses.includes(expense.expense_id)}
                              onChange={() => handleSelectExpense(expense.expense_id)}
                              className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                            />
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${getCategoryBgColor(expense.category)}`}>
                                {getCategoryIcon(expense.category)}
                              </div>
                              <div>
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-600/50 text-slate-400 font-mono text-xs rounded-md">
                                  {expense.display_id}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <button 
                              onClick={() => handleOpenEditModal(expense)}
                              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-xl transition-all duration-200 hover:scale-110"
                              title="Edit expense"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteRequest(expense.expense_id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-200 hover:scale-110"
                              title="Delete expense"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-lg sm:text-xl truncate mb-1">
                                {expense.vendor || expense.description || expense.category}
                              </h4>
                              <p className="text-sm text-slate-400 truncate">
                                {expense.description || expense.raw_text}
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                                ₹{parseFloat(expense.amount).toLocaleString('en-IN')}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(expense.transaction_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryTagColor(expense.category)}`}>
                                {expense.category}
                              </span>
                              {expense.payment_method && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  {expense.payment_method.replace('_', ' ').toUpperCase()}
                                </span>
                              )}
                              {expense.expense_type && expense.expense_type !== 'personal' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  {expense.expense_type.toUpperCase()}
                                </span>
                              )}
                            </div>
                            
                            {expense.location && (
                              <div className="flex items-center text-xs text-slate-500">
                                <MapPin size={12} className="mr-1" />
                                <span className="truncate max-w-32">{expense.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Pagination Controls */}
                {totalPages > 1 && (
                  <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-2xl p-6 mt-6 border border-slate-600/30">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl px-4 py-2 border border-slate-600/30">
                          <span className="text-slate-300 text-sm font-medium">Show:</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-transparent border-none text-cyan-400 text-sm font-semibold focus:outline-none cursor-pointer"
                          >
                            <option value={5} className="bg-slate-800">5</option>
                            <option value={10} className="bg-slate-800">10</option>
                            <option value={20} className="bg-slate-800">20</option>
                            <option value={50} className="bg-slate-800">50</option>
                          </select>
                        </div>
                        <div className="text-slate-400 text-sm bg-slate-700/30 rounded-xl px-4 py-2 border border-slate-600/20">
                          <span className="text-white font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredAndSortedExpenses.length)}</span> of <span className="text-cyan-400 font-semibold">{filteredAndSortedExpenses.length}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="p-3 text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 border border-slate-600/30 hover:border-cyan-500/50"
                          title="First page"
                        >
                          <ChevronsLeft size={18} />
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-3 text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 border border-slate-600/30 hover:border-cyan-500/50"
                          title="Previous page"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        
                        {/* Enhanced Page Numbers */}
                        <div className="flex items-center gap-1 mx-3 bg-slate-700/30 rounded-xl p-1 border border-slate-600/30">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`min-w-[40px] h-10 text-sm font-semibold rounded-lg transition-all duration-300 hover:scale-105 ${
                                  currentPage === pageNum
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/50'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50 border border-transparent hover:border-slate-500/50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-3 text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 border border-slate-600/30 hover:border-cyan-500/50"
                          title="Next page"
                        >
                          <ChevronRight size={18} />
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="p-3 text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 border border-slate-600/30 hover:border-cyan-500/50"
                          title="Last page"
                        >
                          <ChevronsRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={Wallet}
                title="No expenses found"
                description="Start by adding your first expense or adjust your filters."
              />
            )}
          </div>

          {/* Modals */}
          <EditExpenseModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            expense={currentExpense}
            onUpdate={handleUpdateExpense}
          />

          <ConfirmModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={confirmDelete}
            title="Delete Expense"
            message="Are you sure you want to delete this expense? This action cannot be undone."
          />
        </div>
      )}
    </div>
  );
}

export default ExpensesPage;