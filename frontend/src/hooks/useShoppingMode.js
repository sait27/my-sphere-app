import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { handleApiError, retryOperation } from '../utils/errorHandler';

export const useShoppingMode = () => {
  const [loading, setLoading] = useState(false);
  
  const activateShoppingMode = useCallback(async (listId) => {
    try {
      const response = await retryOperation(() => 
        apiClient.post(`/lists/${listId}/shopping-mode/`)
      );
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to activate shopping mode');
      toast.error(errorMessage);
      throw error;
    }
  }, []);
  
  const convertToExpense = useCallback(async (listId) => {
    setLoading(true);
    try {
      const response = await retryOperation(() => 
        apiClient.post(`/lists/${listId}/convert-to-expense/`)
      );
      toast.success(response.data.message || 'Successfully converted to expense!');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to convert to expense');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpenseFromList = useCallback(async (listId, expenseData) => {
    setLoading(true);
    try {
      // Get list details with items and prices
      const listResponse = await retryOperation(() => 
        apiClient.get(`/lists/${listId}/`)
      );
      const list = listResponse.data;
      
      // Calculate total from completed items with prices
      const completedItems = list.items.filter(item => item.is_completed && item.price);
      const totalAmount = completedItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
      
      if (totalAmount === 0) {
        toast.error('No completed items with prices found');
        return null;
      }

      // Create expense
      const expense = {
        amount: totalAmount,
        description: `Shopping: ${list.name}`,
        category: 'Groceries',
        date: new Date().toISOString().split('T')[0],
        ...expenseData
      };

      const response = await retryOperation(() => 
        apiClient.post('/expenses/', expense)
      );
      
      // Update list with actual cost
      await retryOperation(() => 
        apiClient.patch(`/lists/${listId}/`, {
          actual_cost: totalAmount
        })
      );

      toast.success(`Expense created: $${totalAmount.toFixed(2)}`);
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to create expense from list');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItemPrice = useCallback(async (itemId, price) => {
    try {
      const priceValue = price && !isNaN(parseFloat(price)) ? parseFloat(price) : null;
      const response = await retryOperation(() => 
        apiClient.patch(`/lists/items/${itemId}/`, { price: priceValue })
      );
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update item price');
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  return {
    loading,
    createExpenseFromList,
    updateItemPrice,
    activateShoppingMode,
    convertToExpense
  };
};