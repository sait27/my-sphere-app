import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { handleApiError, retryOperation } from '../utils/errorHandler';

export const useAlerts = () => {
  const [loading, setLoading] = useState(false);
  
  const markAsRead = useCallback(async (alertId) => {
    setLoading(true);
    try {
      await retryOperation(() => 
        apiClient.post(`/subscriptions/alerts/${alertId}/mark_read/`)
      );
      return true;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to mark alert as read');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const dismissAlert = useCallback(async (alertId) => {
    setLoading(true);
    try {
      await retryOperation(() => 
        apiClient.post(`/subscriptions/alerts/${alertId}/dismiss/`)
      );
      toast.success('Alert dismissed');
      return true;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to dismiss alert');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const deleteAlert = useCallback(async (alertId) => {
    setLoading(true);
    try {
      await retryOperation(() => 
        apiClient.delete(`/subscriptions/alerts/${alertId}/delete_alert/`)
      );
      toast.success('Alert deleted permanently');
      return true;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete alert');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    markAsRead,
    dismissAlert,
    deleteAlert
  };
};