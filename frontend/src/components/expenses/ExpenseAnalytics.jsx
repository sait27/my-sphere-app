import React, { useState } from 'react';

import SummaryCards from './SummaryCards';
import CategoryInsights from './CategoryInsights';
import PaymentMethods from './PaymentMethods';
import SpendingTrends from './SpendingTrends';
import FinancialHabits from './FinancialHabits';
import { useExpenseAnalytics } from '../../hooks/useExpenseAnalytics';
import { getSpendingPatternAverages } from '../../utils/expenseAnalytics';

const ExpenseAnalytics = () => {
  const [period, setPeriod] = useState('month');
  const { analytics, trends, loading } = useExpenseAnalytics(period);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const categoryBreakdown = analytics?.category_insights?.category_breakdown || [];
  const paymentMethodBreakdown = analytics?.payment_method_breakdown || [];
  const summary = analytics?.summary;
  const spendingPatterns = getSpendingPatternAverages(analytics?.spending_patterns);
  const highValueTransactions = analytics?.high_value_transactions;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Expense Analytics</h2>
        <div className="flex space-x-2">
          {['month', 'quarter', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <SummaryCards summary={summary} period={period} />
      <CategoryInsights categoryBreakdown={categoryBreakdown} summary={summary} />
      <PaymentMethods paymentMethodBreakdown={paymentMethodBreakdown} summary={summary} />
      <SpendingTrends trends={trends} />
      <FinancialHabits spendingPatterns={spendingPatterns} highValueTransactions={highValueTransactions} />
    </div>
  );
};

export default ExpenseAnalytics;