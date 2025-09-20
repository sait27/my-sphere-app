import apiClient from './axiosConfig';

// Expense API endpoints
export const expenseAPI = {
  // Core CRUD operations
  getExpenses: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.append(key, value);
      }
    });
    return apiClient.get(`/expenses/?${params.toString()}`);
  },

  createExpense: (text) => {
    return apiClient.post('/expenses/', { text });
  },

  updateExpense: (expenseId, data) => {
    return apiClient.put(`/expenses/${expenseId}/`, data);
  },

  deleteExpense: (expenseId) => {
    return apiClient.delete(`/expenses/${expenseId}/`);
  },

  // Analytics endpoints
  getAnalytics: (period = 'month') => {
    return apiClient.get(`/expenses/analytics/?period=${period}`);
  },

  getSummary: () => {
    return apiClient.get('/expenses/summary/');
  },

  getTrends: () => {
    return apiClient.get('/expenses/advanced/trends/?months=6');
  },

  getAdvancedAnalytics: (period = 'month') => {
    return apiClient.get(`/expenses/advanced/analytics/?period=${period}`);
  },

  // AI endpoints
  getAIInsights: (forceRefresh = false) => {
    return apiClient.get(`/expenses/ai-insights/?force_refresh=${forceRefresh}`);
  },

  // Bulk operations
  bulkOperation: (operation, expenseIds, params = {}) => {
    return apiClient.post('/expenses/advanced/bulk/', {
      operation,
      expense_ids: expenseIds,
      ...params
    });
  },

  // Export
  exportExpenses: (expenseIds, format = 'csv') => {
    return apiClient.post('/expenses/advanced/export/', {
      expense_ids: expenseIds,
      format
    }, {
      responseType: 'blob'
    });
  },

  // Categories and tags
  getCategories: () => {
    return apiClient.get('/expenses/categories/');
  },

  getTags: () => {
    return apiClient.get('/expenses/tags/');
  }
};