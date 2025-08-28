import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { handleApiError, retryOperation } from '../utils/errorHandler';

export const useCategories = () => {
  const [loading, setLoading] = useState(false);
  
  const createCategory = useCallback(async (categoryData) => {
    setLoading(true);
    try {
      const response = await retryOperation(() => 
        apiClient.post('/subscriptions/categories/', categoryData)
      );
      toast.success('Category created successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to create category');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const updateCategory = useCallback(async (categoryId, updateData) => {
    setLoading(true);
    try {
      const response = await retryOperation(() => 
        apiClient.patch(`/subscriptions/categories/${categoryId}/`, updateData)
      );
      toast.success('Category updated successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update category');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const deleteCategory = useCallback(async (categoryId) => {
    setLoading(true);
    try {
      await retryOperation(() => 
        apiClient.delete(`/subscriptions/categories/${categoryId}/`)
      );
      toast.success('Category deleted successfully!');
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete category');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createCategory,
    updateCategory,
    deleteCategory
  };
};