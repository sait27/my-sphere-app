import { useState, useEffect, useCallback } from 'react';
import { lendingAPI } from '../api/lending';
import toast from 'react-hot-toast';

export const useLending = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [notificationRules, setNotificationRules] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all transactions
  const fetchTransactions = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      console.log('Fetching transactions...');
      const response = await lendingAPI.getTransactions(params);
      console.log('Transactions response:', response.data);
      setTransactions(response.data.results || response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to fetch transactions');
      // Don't show toast for initial load failures
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      console.log('Fetching categories...');
      const response = await lendingAPI.getCategories();
      console.log('Categories response:', response.data);
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    try {
      console.log('Fetching contacts...');
      const response = await lendingAPI.getContacts();
      console.log('Contacts response:', response.data);
      setContacts(response.data);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await lendingAPI.getTemplates();
      setTemplates(response.data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  }, []);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      console.log('Fetching dashboard...');
      const response = await lendingAPI.getDashboard();
      console.log('Dashboard response:', response.data);
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    }
  }, []);

  // Create transaction
  const createTransaction = useCallback(async (data) => {
    try {
      setLoading(true);
      console.log('Creating transaction with data:', data);
      const response = await lendingAPI.createTransaction(data);
      console.log('Transaction created successfully:', response.data);
      setTransactions(prev => [response.data, ...prev]);
      toast.success('Transaction created successfully!');
      return response.data;
    } catch (err) {
      console.error('Create transaction error:', err.response?.data);
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.message || 
                      JSON.stringify(err.response?.data) || 
                      'Failed to create transaction';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update transaction
  const updateTransaction = useCallback(async (id, data) => {
    try {
      const response = await lendingAPI.updateTransaction(id, data);
      setTransactions(prev => 
        prev.map(t => t.lending_id === id ? response.data : t)
      );
      toast.success('Transaction updated successfully!');
      return response.data;
    } catch (err) {
      toast.error('Failed to update transaction');
      throw err;
    }
  }, []);

  // Delete transaction
  const deleteTransaction = useCallback(async (id) => {
    try {
      await lendingAPI.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.lending_id !== id));
      toast.success('Transaction deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete transaction');
      throw err;
    }
  }, []);

  // Mark transaction as completed
  const markCompleted = useCallback(async (id) => {
    try {
      const response = await lendingAPI.markCompleted(id);
      setTransactions(prev => 
        prev.map(t => t.lending_id === id ? response.data : t)
      );
      toast.success('Transaction marked as completed!');
    } catch (err) {
      toast.error('Failed to mark transaction as completed');
    }
  }, []);

  // Add payment
  const addPayment = useCallback(async (id, paymentData) => {
    try {
      await lendingAPI.addPayment(id, paymentData);
      fetchTransactions(); // Refresh to get updated amounts
      toast.success('Payment added successfully!');
    } catch (err) {
      toast.error('Failed to add payment');
      throw err;
    }
  }, [fetchTransactions]);

  // Create category
  const createCategory = useCallback(async (data) => {
    try {
      const response = await lendingAPI.createCategory(data);
      setCategories(prev => [...prev, response.data]);
      toast.success('Category created successfully!');
      return response.data;
    } catch (err) {
      toast.error('Failed to create category');
      throw err;
    }
  }, []);

  // Create contact
  const createContact = useCallback(async (data) => {
    try {
      const response = await lendingAPI.createContact(data);
      setContacts(prev => [...prev, response.data]);
      toast.success('Contact created successfully!');
      return response.data;
    } catch (err) {
      toast.error('Failed to create contact');
      throw err;
    }
  }, []);

  // Bulk operations
  const bulkOperations = useCallback(async (data) => {
    try {
      setLoading(true);
      await lendingAPI.bulkOperations(data);
      fetchTransactions(); // Refresh transactions
      toast.success('Bulk operation completed successfully!');
    } catch (err) {
      toast.error('Bulk operation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions]);

  // Initialize data on mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeData = async () => {
      if (!isMounted) return;
      
      try {
        await Promise.all([
          fetchTransactions(),
          fetchCategories(),
          fetchContacts(),
          fetchTemplates(),
          fetchDashboard()
        ]);
      } catch (error) {
        console.error('Failed to initialize lending data:', error);
      }
    };

    initializeData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once

  return {
    // State
    transactions,
    categories,
    contacts,
    templates,
    paymentPlans,
    notificationRules,
    dashboardData,
    loading,
    error,

    // Actions
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    markCompleted,
    addPayment,
    createCategory,
    createContact,
    bulkOperations,
    fetchDashboard,

    // Setters for external updates
    setTransactions,
    setCategories,
    setContacts
  };
};

export default useLending;