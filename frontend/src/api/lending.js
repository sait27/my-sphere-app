import axios from './axiosConfig';

const API_BASE = '/lending';

export const lendingAPI = {
  // Transactions
  getTransactions: (params = {}) => 
    axios.get(`${API_BASE}/transactions/`, { params }),
  
  createTransaction: (data) => 
    axios.post(`${API_BASE}/transactions/`, data),
  
  getTransaction: (id) => 
    axios.get(`${API_BASE}/transactions/${id}/`),
  
  updateTransaction: (id, data) => 
    axios.patch(`${API_BASE}/transactions/${id}/`, data),
  
  deleteTransaction: (id) => 
    axios.delete(`${API_BASE}/transactions/${id}/`),

  // Categories
  getCategories: () => 
    axios.get(`${API_BASE}/categories/`),
  
  createCategory: (data) => 
    axios.post(`${API_BASE}/categories/`, data),
  
  updateCategory: (id, data) => 
    axios.patch(`${API_BASE}/categories/${id}/`, data),
  
  deleteCategory: (id) => 
    axios.delete(`${API_BASE}/categories/${id}/`),

  // Dashboard
  getDashboard: () => 
    axios.get(`${API_BASE}/dashboard/`),

  // Transaction actions
  markCompleted: (id) => 
    axios.post(`${API_BASE}/transactions/${id}/mark_completed/`),
  
  addPayment: (id, data) => 
    axios.post(`${API_BASE}/transactions/${id}/add_payment/`, data),

  // Analytics
  getSummary: () => 
    axios.get(`${API_BASE}/transactions/summary/`),
  
  getAnalytics: (period = 'month') => 
    axios.get(`${API_BASE}/transactions/analytics/`, { params: { period } }),
  
  getAIInsights: (refresh = false) => 
    axios.get(`${API_BASE}/transactions/ai_insights/`, { params: { refresh } }),
  
  getOverdue: () => 
    axios.get(`${API_BASE}/transactions/overdue/`),
  
  getRiskAnalysis: () => 
    axios.get(`${API_BASE}/transactions/risk_analysis/`),

  // Bulk operations
  bulkOperations: (data) => 
    axios.post(`${API_BASE}/transactions/bulk_operations/`, data),
  
  exportTransactions: (data) => 
    axios.post(`${API_BASE}/transactions/export/`, data, {
      responseType: 'blob'
    }),

  // Enhanced Analytics
  getCashFlowForecast: (months = 6) => 
    axios.get(`${API_BASE}/transactions/cash_flow_forecast/`, { params: { months } }),
  
  getLendingPatterns: () => 
    axios.get(`${API_BASE}/transactions/lending_patterns/`),
  
  getNotifications: () => 
    axios.get(`${API_BASE}/transactions/notifications/`),
  
  getRiskAssessment: (id) => 
    axios.get(`${API_BASE}/transactions/${id}/risk_assessment/`),
  
  createPaymentPlan: (id, data) => 
    axios.post(`${API_BASE}/transactions/${id}/create_payment_plan/`, data),
  
  uploadDocument: (id, formData) => 
    axios.post(`${API_BASE}/transactions/${id}/upload_document/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Contact Management
  getContacts: () => 
    axios.get(`${API_BASE}/contacts/`),
  
  createContact: (data) => 
    axios.post(`${API_BASE}/contacts/`, data),
  
  getContact: (id) => 
    axios.get(`${API_BASE}/contacts/${id}/`),
  
  updateContact: (id, data) => 
    axios.patch(`${API_BASE}/contacts/${id}/`, data),
  
  deleteContact: (id) => 
    axios.delete(`${API_BASE}/contacts/${id}/`),
  
  updateReliabilityScore: (id) => 
    axios.post(`${API_BASE}/contacts/${id}/update_reliability_score/`),

  // Transaction Templates
  getTemplates: () => 
    axios.get(`${API_BASE}/templates/`),
  
  createTemplate: (data) => 
    axios.post(`${API_BASE}/templates/`, data),
  
  getTemplate: (id) => 
    axios.get(`${API_BASE}/templates/${id}/`),
  
  updateTemplate: (id, data) => 
    axios.patch(`${API_BASE}/templates/${id}/`, data),
  
  deleteTemplate: (id) => 
    axios.delete(`${API_BASE}/templates/${id}/`),
  
  createTransactionFromTemplate: (id, data) => 
    axios.post(`${API_BASE}/templates/${id}/create_transaction/`, data),

  // Payment Plans
  getPaymentPlans: () => 
    axios.get(`${API_BASE}/payment-plans/`),
  
  getPaymentPlan: (id) => 
    axios.get(`${API_BASE}/payment-plans/${id}/`),
  
  recordPayment: (id, data) => 
    axios.post(`${API_BASE}/payment-plans/${id}/record_payment/`, data),

  // Notification Rules
  getNotificationRules: () => 
    axios.get(`${API_BASE}/notification-rules/`),
  
  createNotificationRule: (data) => 
    axios.post(`${API_BASE}/notification-rules/`, data),
  
  getNotificationRule: (id) => 
    axios.get(`${API_BASE}/notification-rules/${id}/`),
  
  updateNotificationRule: (id, data) => 
    axios.patch(`${API_BASE}/notification-rules/${id}/`, data),
  
  deleteNotificationRule: (id) => 
    axios.delete(`${API_BASE}/notification-rules/${id}/`)
};

export default lendingAPI;