// hooks/useListInsights.js

import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

export const useListInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch insights for a specific list
  const fetchInsights = useCallback(async (listId) => {
    if (!listId) {
      setError('List ID is required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching insights for list:', listId);
      const response = await apiClient.get(`/lists/${listId}/insights/`);
      console.log('List insights response:', response.data);
      
      setInsights(response.data);
      return response.data;
    } catch (err) {
      console.error('Insights fetch error:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      setError('Failed to fetch insights');
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to load insights data';
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    insights,
    loading,
    error,
    fetchInsights
  };
};