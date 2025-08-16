import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

export const useDashboard = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch summary data with fallback
      const summaryPromise = apiClient.get('/expenses/summary/')
        .then(res => res.data)
        .catch(err => {
          console.error('Summary API error:', err);
          toast.error('Failed to load expense summary');
          return { today: 0, week: 0, month: 0, current_budget: 0 };
        });

      // Fetch agenda data with fallback
      const agendaPromise = apiClient.get('/lists/agenda/')
        .then(res => res.data)
        .catch(err => {
          console.error('Agenda API error:', err);
          toast.error('Failed to load agenda');
          return { list_name: null, items: [] };
        });

      const [summaryResult, agendaResult] = await Promise.all([
        summaryPromise,
        agendaPromise
      ]);

      setSummaryData(summaryResult);
      setAgenda(agendaResult);

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Failed to load dashboard data');
      toast.error('Dashboard failed to load');
      
      // Set fallback data
      setSummaryData({ today: 0, week: 0, month: 0, current_budget: 0 });
      setAgenda({ list_name: null, items: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh specific data
  const refreshSummary = useCallback(async () => {
    try {
      const response = await apiClient.get('/expenses/summary/');
      setSummaryData(response.data);
      toast.success('Summary refreshed');
    } catch (error) {
      console.error('Summary refresh error:', error);
      toast.error('Failed to refresh summary');
    }
  }, []);

  const refreshAgenda = useCallback(async () => {
    try {
      const response = await apiClient.get('/lists/agenda/');
      setAgenda(response.data);
      toast.success('Agenda refreshed');
    } catch (error) {
      console.error('Agenda refresh error:', error);
      toast.error('Failed to refresh agenda');
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    // Data
    summaryData,
    agenda,
    
    // State
    loading,
    error,
    
    // Actions
    fetchDashboardData,
    refreshSummary,
    refreshAgenda
  };
};
