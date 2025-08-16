// hooks/useExpenses.js
/**
 * Custom hook for expense management - following React best practices
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/axiosConfig';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExpenses, setSelectedExpenses] = useState([]);

  // Fetch expenses with error handling
  const fetchExpenses = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
      
      const response = await apiClient.get(`/expenses/?${params.toString()}`);
      setExpenses(response.data.results || response.data);
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch expenses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create expense with AI parsing
  const createExpense = useCallback(async (text) => {
    if (!text?.trim()) {
      toast.error('Please enter expense details');
      return false;
    }

    try {
      const response = await apiClient.post('/expenses/', { text: text.trim() });
      
      if (response.data.expenses) {
        setExpenses(prev => [...response.data.expenses, ...prev]);
        toast.success(response.data.message || 'Expense created successfully');
        return true;
      }
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create expense';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  // Update expense
  const updateExpense = useCallback(async (expenseId, data) => {
    try {
      const response = await apiClient.put(`/expenses/${expenseId}/`, data);
      
      setExpenses(prev => 
        prev.map(expense => 
          expense.expense_id === expenseId ? response.data : expense
        )
      );
      
      toast.success('Expense updated successfully');
      return true;
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update expense';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  // Delete expense
  const deleteExpense = useCallback(async (expenseId) => {
    try {
      await apiClient.delete(`/expenses/${expenseId}/`);
      
      setExpenses(prev => prev.filter(expense => expense.expense_id !== expenseId));
      setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
      
      toast.success('Expense deleted successfully');
      return true;
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete expense';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  // Bulk operations
  const bulkOperation = useCallback(async (operation, params = {}) => {
    if (selectedExpenses.length === 0) {
      toast.error('No expenses selected');
      return false;
    }

    try {
      const response = await apiClient.post('/expenses/advanced/bulk_operations/', {
        expense_ids: selectedExpenses,
        operation,
        ...params
      });

      // Refresh expenses after bulk operation
      await fetchExpenses();
      setSelectedExpenses([]);
      
      toast.success(response.data.message || 'Operation completed successfully');
      return true;
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Bulk operation failed';
      toast.error(errorMessage);
      return false;
    }
  }, [selectedExpenses, fetchExpenses]);

  // Export expenses
  const exportExpenses = useCallback(async (format = 'csv') => {
    if (selectedExpenses.length === 0) {
      toast.error('No expenses selected');
      return false;
    }

    try {
      const response = await apiClient.post('/expenses/advanced/export/', {
        expense_ids: selectedExpenses,
        format
      }, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success('Expenses exported successfully');
      return true;
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Export failed';
      toast.error(errorMessage);
      return false;
    }
  }, [selectedExpenses]);

  // Selection management
  const toggleExpenseSelection = useCallback((expenseId) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  }, []);

  const selectAllExpenses = useCallback((expenseList) => {
    setSelectedExpenses(expenseList.map(expense => expense.expense_id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedExpenses([]);
  }, []);

  // Computed values
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(expenses.map(expense => expense.category))];
    return uniqueCategories.filter(Boolean).sort();
  }, [expenses]);

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
  }, [expenses]);

  const expenseCount = expenses.length;
  const selectedCount = selectedExpenses.length;

  // Initialize on mount
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    // Data
    expenses,
    categories,
    selectedExpenses,
    
    // State
    loading,
    error,
    
    // Computed
    totalAmount,
    expenseCount,
    selectedCount,
    
    // Actions
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    bulkOperation,
    exportExpenses,
    
    // Selection
    toggleExpenseSelection,
    selectAllExpenses,
    clearSelection
  };
};
