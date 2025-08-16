// utils/constants.js
/**
 * Application constants and configuration
 */

export const API_ENDPOINTS = {
  EXPENSES: '/expenses/',
  EXPENSE_DETAIL: (id) => `/expenses/${id}/`,
  EXPENSE_ANALYTICS: '/expenses/advanced/analytics/',
  EXPENSE_TRENDS: '/expenses/advanced/trends/',
  EXPENSE_EXPORT: '/expenses/advanced/export/',
  EXPENSE_BULK: '/expenses/advanced/bulk_operations/',
  EXPENSE_SUMMARY: '/expenses/summary/',
  BUDGET_ANALYSIS: '/expenses/advanced/budget_analysis/',
};

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Gifts & Donations',
  'Business',
  'Other'
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'wallet', label: 'Digital Wallet' },
  { value: 'other', label: 'Other' }
];

export const EXPENSE_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
  { value: 'shared', label: 'Shared' },
  { value: 'reimbursable', label: 'Reimbursable' }
];

export const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' }
];

export const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Date (Newest)' },
  { value: 'date_asc', label: 'Date (Oldest)' },
  { value: 'amount_desc', label: 'Amount (High to Low)' },
  { value: 'amount_asc', label: 'Amount (Low to High)' },
  { value: 'category', label: 'Category' },
  { value: 'vendor', label: 'Vendor' }
];

export const ANALYTICS_PERIODS = [
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 90 Days' },
  { value: 'year', label: 'Last Year' }
];

export const CATEGORY_COLORS = {
  'Food & Dining': '#FF6B6B',
  'Transportation': '#4ECDC4',
  'Shopping': '#45B7D1',
  'Entertainment': '#96CEB4',
  'Bills & Utilities': '#FFEAA7',
  'Healthcare': '#DDA0DD',
  'Travel': '#98D8C8',
  'Education': '#F7DC6F',
  'Personal Care': '#BB8FCE',
  'Gifts & Donations': '#85C1E9',
  'Business': '#F8C471',
  'Other': '#AEB6BF'
};

export const CATEGORY_ICONS = {
  'Food & Dining': '🍽️',
  'Transportation': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Bills & Utilities': '💡',
  'Healthcare': '🏥',
  'Travel': '✈️',
  'Education': '📚',
  'Personal Care': '💄',
  'Gifts & Donations': '🎁',
  'Business': '💼',
  'Other': '📦'
};

export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
  LOCALE: 'en-IN'
};

export const VALIDATION_RULES = {
  MAX_EXPENSE_AMOUNT: 999999.99,
  MIN_EXPENSE_AMOUNT: 0.01,
  MAX_TEXT_LENGTH: 1000,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_VENDOR_LENGTH: 100
};

export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 3000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  PAGINATION_SIZE: 20
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
};

export const SUCCESS_MESSAGES = {
  EXPENSE_CREATED: 'Expense created successfully',
  EXPENSE_UPDATED: 'Expense updated successfully',
  EXPENSE_DELETED: 'Expense deleted successfully',
  BULK_OPERATION: 'Bulk operation completed successfully',
  EXPORT_SUCCESS: 'Data exported successfully',
  SETTINGS_SAVED: 'Settings saved successfully'
};
