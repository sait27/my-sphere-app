import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { handleApiError, retryOperation } from '../utils/errorHandler';

export const useSubscriptions = () => {
  const [loading, setLoading] = useState(false);
  
  const createSubscription = useCallback(async (subscriptionData) => {
    setLoading(true);
    try {
      const response = await retryOperation(() => 
        apiClient.post('/subscriptions/subscriptions/', subscriptionData)
      );
      toast.success('Subscription created successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to create subscription');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const updateSubscription = useCallback(async (subscriptionId, updateData) => {
    setLoading(true);
    try {
      const response = await retryOperation(() => 
        apiClient.patch(`/subscriptions/subscriptions/${subscriptionId}/`, updateData)
      );
      toast.success('Subscription updated successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update subscription');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const pauseSubscription = useCallback(async (subscriptionId) => {
    setLoading(true);
    try {
      const response = await retryOperation(() => 
        apiClient.post(`/subscriptions/subscriptions/${subscriptionId}/pause/`)
      );
      toast.success('Subscription paused successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to pause subscription');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const resumeSubscription = useCallback(async (subscriptionId) => {
    setLoading(true);
    try {
      const response = await retryOperation(() => 
        apiClient.post(`/subscriptions/subscriptions/${subscriptionId}/resume/`)
      );
      toast.success('Subscription resumed successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to resume subscription');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const cancelSubscription = useCallback(async (subscriptionId) => {
    setLoading(true);
    try {
      const response = await retryOperation(() => 
        apiClient.post(`/subscriptions/subscriptions/${subscriptionId}/cancel/`)
      );
      toast.success('Subscription cancelled successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to cancel subscription');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const addPayment = useCallback(async (subscriptionId, paymentData) => {
    setLoading(true);
    try {
      const response = await retryOperation(() => 
        apiClient.post(`/subscriptions/subscriptions/${subscriptionId}/add_payment/`, paymentData)
      );
      toast.success('Payment recorded successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to record payment');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const addUsage = useCallback(async (subscriptionId, usageData) => {
    setLoading(true);
    try {
      const response = await retryOperation(() => 
        apiClient.post(`/subscriptions/subscriptions/${subscriptionId}/add_usage/`, usageData)
      );
      toast.success('Usage recorded successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to record usage');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const deleteSubscription = useCallback(async (subscriptionId) => {
    setLoading(true);
    try {
      const response = await retryOperation(() => 
        apiClient.delete(`/subscriptions/subscriptions/${subscriptionId}/`)
      );
      toast.success('Subscription deleted successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete subscription');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createSubscription,
    updateSubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    deleteSubscription,
    addPayment,
    addUsage
  };
};