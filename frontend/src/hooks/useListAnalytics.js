// hooks/useListAnalytics.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

export const useListAnalytics = (period = 'month') => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (selectedPeriod = period) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching list analytics for period:', selectedPeriod);
      const response = await apiClient.get(`/lists/analytics/?period=${selectedPeriod}`);
      console.log('List analytics response:', response.data);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      setError('Failed to fetch analytics');
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to load analytics data';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Computed analytics values
  const computedAnalytics = useMemo(() => {
    if (!analytics) return {};

    const { summary, productivity, categories, list_types, completion_trends, insights } = analytics;

    return {
      // Summary metrics
      totalLists: summary?.total_lists || 0,
      activeLists: summary?.active_lists || 0,
      completedLists: summary?.completed_lists || 0,
      totalItems: summary?.total_items || 0,
      completedItems: summary?.completed_items || 0,
      averageCompletion: summary?.average_completion || 0,
      totalEstimatedCost: summary?.total_estimated_cost || 0,

      // Productivity metrics
      itemsCompleted: productivity?.items_completed || 0,
      averageCompletionTime: productivity?.average_completion_time_hours || 0,
      productivityScore: productivity?.productivity_score || 0,

      // Category insights
      topCategories: categories?.slice(0, 5) || [],
      categoryData: categories?.map(cat => ({
        name: cat.category__name || 'Uncategorized',
        count: cat.count,
        color: cat.category__color || '#3B82F6'
      })) || [],

      // List type insights
      listTypeData: list_types?.map(type => ({
        type: type.list_type,
        count: type.count,
        label: type.list_type.charAt(0).toUpperCase() + type.list_type.slice(1)
      })) || [],

      // Completion trends
      completionTrends: completion_trends || [],

      // AI insights
      insights: insights || [],

      // Completion rate
      completionRate: summary?.total_items > 0 
        ? Math.round((summary.completed_items / summary.total_items) * 100)
        : 0,

      // List completion rate
      listCompletionRate: summary?.total_lists > 0
        ? Math.round((summary.completed_lists / summary.total_lists) * 100)
        : 0,

      // Productivity level
      productivityLevel: productivity?.productivity_score >= 80 ? 'High' :
                        productivity?.productivity_score >= 60 ? 'Medium' :
                        productivity?.productivity_score >= 40 ? 'Low' : 'Very Low'
    };
  }, [analytics]);

  // Get trend data for charts
  const getTrendData = useCallback((metric = 'completed_items') => {
    if (!analytics?.completion_trends) return [];
    
    return analytics.completion_trends.map(trend => ({
      date: trend.date,
      value: trend[metric] || 0,
      label: new Date(trend.date).toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
  }, [analytics]);

  // Get category chart data
  const getCategoryChartData = useCallback(() => {
    if (!computedAnalytics.categoryData) return { labels: [], datasets: [] };

    const data = computedAnalytics.categoryData;
    
    return {
      labels: data.map(item => item.name),
      datasets: [{
        data: data.map(item => item.count),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 2,
        hoverBorderWidth: 3
      }]
    };
  }, [computedAnalytics.categoryData]);

  // Get list type chart data
  const getListTypeChartData = useCallback(() => {
    if (!computedAnalytics.listTypeData) return { labels: [], datasets: [] };

    const data = computedAnalytics.listTypeData;
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];
    
    return {
      labels: data.map(item => item.label),
      datasets: [{
        data: data.map(item => item.count),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length),
        borderWidth: 2,
        hoverBorderWidth: 3
      }]
    };
  }, [computedAnalytics.listTypeData]);

  // Get completion trend chart data
  const getCompletionTrendData = useCallback(() => {
    const trendData = getTrendData('completed_items');
    
    return {
      labels: trendData.map(item => item.label),
      datasets: [{
        label: 'Completed Items',
        data: trendData.map(item => item.value),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    };
  }, [getTrendData]);

  // Get insights by type
  const getInsightsByType = useCallback((type) => {
    if (!computedAnalytics.insights) return [];
    return computedAnalytics.insights.filter(insight => insight.type === type);
  }, [computedAnalytics.insights]);

  // Format completion time
  const formatCompletionTime = useCallback((hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else if (hours < 24) {
      return `${Math.round(hours)} hours`;
    } else {
      const days = Math.round(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }, []);

  // Get productivity color
  const getProductivityColor = useCallback((score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  }, []);

  // Initialize
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    // Raw data
    analytics,
    loading,
    error,

    // Computed data
    ...computedAnalytics,

    // Chart data functions
    getCategoryChartData,
    getListTypeChartData,
    getCompletionTrendData,
    getTrendData,

    // Utility functions
    getInsightsByType,
    formatCompletionTime,
    getProductivityColor,

    // Actions
    fetchAnalytics,
    refetch: () => fetchAnalytics(period)
  };
};
