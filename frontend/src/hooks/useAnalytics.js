// hooks/useAnalytics.js
/**
 * Custom hook for expense analytics - following React best practices
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/axiosConfig';

export const useAnalytics = (period = 'month') => {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [budgetAnalysis, setBudgetAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsRes, trendsRes, budgetRes] = await Promise.allSettled([
        apiClient.get(`/expenses/advanced/analytics/?period=${period}`),
        apiClient.get(`/expenses/advanced/trends/?months=6`),
        apiClient.get('/expenses/advanced/budget_analysis/')
      ]);

      // Handle analytics response
      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data);
      } else {
        console.error('Analytics fetch failed:', analyticsRes.reason);
      }

      // Handle trends response
      if (trendsRes.status === 'fulfilled') {
        setTrends(trendsRes.value.data);
      } else {
        console.error('Trends fetch failed:', trendsRes.reason);
      }

      // Handle budget analysis response
      if (budgetRes.status === 'fulfilled') {
        setBudgetAnalysis(budgetRes.value.data);
      } else {
        console.error('Budget analysis fetch failed:', budgetRes.reason);
      }

    } catch (err) {
      const errorMessage = 'Failed to fetch analytics data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Computed analytics values
  const summaryStats = useMemo(() => {
    if (!analytics?.summary) return null;

    const { total_amount, expense_count, average_amount } = analytics.summary;
    const dailyAverage = total_amount ? (total_amount / 30).toFixed(2) : 0;

    return {
      totalSpent: total_amount || 0,
      averageExpense: average_amount || 0,
      totalTransactions: expense_count || 0,
      dailyAverage: parseFloat(dailyAverage)
    };
  }, [analytics]);

  // Top spending categories
  const topCategories = useMemo(() => {
    if (!analytics?.category_breakdown) return [];
    
    return analytics.category_breakdown
      .slice(0, 3)
      .map((category, index) => ({
        ...category,
        rank: index + 1,
        percentage: analytics.summary?.total_amount 
          ? ((category.total / analytics.summary.total_amount) * 100).toFixed(1)
          : 0
      }));
  }, [analytics]);

  // Category breakdown with percentages
  const categoryBreakdown = useMemo(() => {
    if (!analytics?.category_breakdown || !analytics?.summary?.total_amount) return [];

    return analytics.category_breakdown.map(category => ({
      ...category,
      percentage: ((category.total / analytics.summary.total_amount) * 100).toFixed(1)
    }));
  }, [analytics]);

  // Payment method breakdown
  const paymentMethodBreakdown = useMemo(() => {
    if (!analytics?.payment_method_breakdown || !analytics?.summary?.total_amount) return [];

    return analytics.payment_method_breakdown.map(method => ({
      ...method,
      percentage: ((method.total / analytics.summary.total_amount) * 100).toFixed(1)
    }));
  }, [analytics]);

  // Spending insights
  const spendingInsights = useMemo(() => {
    if (!analytics || !summaryStats) return [];

    const insights = [];

    // High spending category insight
    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      insights.push({
        type: 'category',
        title: `Highest Spending: ${topCategory.category}`,
        value: `₹${topCategory.total}`,
        description: `${topCategory.percentage}% of total spending`,
        color: 'text-red-400'
      });
    }

    // Daily average insight
    if (summaryStats.dailyAverage > 0) {
      insights.push({
        type: 'daily',
        title: 'Daily Average',
        value: `₹${summaryStats.dailyAverage}`,
        description: 'Average spending per day',
        color: 'text-blue-400'
      });
    }

    // Transaction frequency insight
    if (summaryStats.totalTransactions > 0) {
      const avgPerTransaction = (summaryStats.totalSpent / summaryStats.totalTransactions).toFixed(2);
      insights.push({
        type: 'transaction',
        title: 'Average per Transaction',
        value: `₹${avgPerTransaction}`,
        description: `Across ${summaryStats.totalTransactions} transactions`,
        color: 'text-green-400'
      });
    }

    return insights;
  }, [analytics, summaryStats, topCategories]);

  // Initialize on mount and when period changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    // Raw data
    analytics,
    trends,
    budgetAnalysis,
    
    // State
    loading,
    error,
    
    // Computed data
    summaryStats,
    topCategories,
    categoryBreakdown,
    paymentMethodBreakdown,
    spendingInsights,
    
    // Actions
    fetchAnalytics,
    refetch: fetchAnalytics
  };
};
