import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

export const useAIFeatures = () => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const getAIInsights = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/lists/ai/insights/');
      setInsights(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get AI insights:', error);
      toast.error('Failed to get AI insights');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAISuggestions = useCallback(async (listName, listType, context = '') => {
    try {
      const response = await apiClient.post('/lists/ai/suggestions/', {
        list_name: listName,
        list_type: listType,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      throw error;
    }
  }, []);

  const parseWithAI = useCallback(async (text) => {
    try {
      const response = await apiClient.post('/lists/ai/parse/', { text });
      return response.data;
    } catch (error) {
      console.error('Failed to parse with AI:', error);
      throw error;
    }
  }, []);

  const getAIAnalytics = useCallback(async () => {
    try {
      const response = await apiClient.get('/lists/ai/analytics/');
      return response.data;
    } catch (error) {
      console.error('Failed to get AI analytics:', error);
      throw error;
    }
  }, []);

  const getSmartSuggestions = useCallback(async (listId) => {
    try {
      const response = await apiClient.get(`/lists/${listId}/suggestions/`);
      return response.data;
    } catch (error) {
      console.error('Failed to get smart suggestions:', error);
      throw error;
    }
  }, []);

  const getSmartCompletion = useCallback(async (listId) => {
    try {
      const response = await apiClient.post(`/lists/${listId}/smart_completion/`);
      return response.data;
    } catch (error) {
      console.error('Failed to get smart completion:', error);
      throw error;
    }
  }, []);

  return {
    loading,
    insights,
    getAIInsights,
    getAISuggestions,
    parseWithAI,
    getAIAnalytics,
    getSmartSuggestions,
    getSmartCompletion
  };
};