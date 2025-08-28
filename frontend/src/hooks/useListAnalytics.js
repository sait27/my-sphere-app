import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';

export const useListAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  


  const fetchAnalytics = useCallback(async (period = 'month') => {
    setLoading(true);
    setError(null);
    
    const mockAnalytics = {
      total_lists: 12,
      active_lists: 8,
      completed_items: 45,
      total_items: 67,
      pending_items: 22,
      completion_rate: 67.2,
      productivity_score: 85,
      lists_trend: 15,
      completion_trend: 8,
      productivity_trend: -3,
      items_trend: 12,
      avg_completion_time: 3.5,
      items_per_list: 5.6,
      daily_completion_rate: 2.3,
      category_breakdown: {
        shopping: 5,
        work: 3,
        personal: 2,
        todo: 2
      },
      insights: [
        {
          type: 'productivity',
          title: 'Great Progress!',
          description: 'You\'ve completed 67% of your tasks this month. Keep up the excellent work!'
        },
        {
          type: 'completion',
          title: 'Shopping Lists Excel',
          description: 'Your shopping lists have the highest completion rate at 89%.'
        }
      ]
    };
    
    try {
      const response = await apiClient.get(`/lists/analytics/?period=${period}`);
      
      if (response.data && typeof response.data === 'object' && Object.keys(response.data).length > 0) {
        setAnalytics(response.data);
        setError(null);
      } else {
        setAnalytics(mockAnalytics);
        setError('No analytics data available - using demo data');
      }
    } catch (err) {
      setAnalytics(mockAnalytics);
      setError('Unable to load analytics - using demo data');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics
  };
};