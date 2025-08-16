import React from 'react';
import { Search, Filter, Calendar, Tag, DollarSign, CreditCard } from 'lucide-react';

const ExpenseFilters = ({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  dateRange,
  setDateRange,
  sortBy,
  setSortBy,
  paymentMethod,
  setPaymentMethod,
  expenseType,
  setExpenseType,
  amountRange,
  setAmountRange,
  categories,
  onClearFilters
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Filter className="mr-2" size={20} />
          Advanced Filters
        </h3>
        <button
          onClick={onClearFilters}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center">
            <Search className="mr-1" size={16} />
            Search
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search expenses..."
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center">
            <Tag className="mr-1" size={16} />
            Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center">
            <Calendar className="mr-1" size={16} />
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="date_desc">Date (Newest First)</option>
            <option value="date_asc">Date (Oldest First)</option>
            <option value="amount_desc">Amount (High to Low)</option>
            <option value="amount_asc">Amount (Low to High)</option>
            <option value="category">Category</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center">
            <CreditCard className="mr-1" size={16} />
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">All Methods</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="digital_wallet">Digital Wallet</option>
            <option value="check">Check</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Expense Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Expense Type
          </label>
          <select
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="one_time">One Time</option>
            <option value="recurring">Recurring</option>
            <option value="subscription">Subscription</option>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </select>
        </div>

        {/* Amount Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center">
            <DollarSign className="mr-1" size={16} />
            Amount Range
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={amountRange.min}
              onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
              placeholder="Min"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <input
              type="number"
              value={amountRange.max}
              onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
              placeholder="Max"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseFilters;
