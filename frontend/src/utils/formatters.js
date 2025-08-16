// utils/formatters.js
/**
 * Utility functions for formatting data
 */

import { CURRENCY } from './constants';

/**
 * Format currency amount
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    showSymbol = true,
    showDecimals = true,
    locale = CURRENCY.LOCALE
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `${CURRENCY.SYMBOL}0` : '0';
  }

  const numAmount = parseFloat(amount);
  
  if (showDecimals) {
    const formatted = numAmount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return showSymbol ? `${CURRENCY.SYMBOL}${formatted}` : formatted;
  } else {
    const formatted = Math.round(numAmount).toLocaleString(locale);
    return showSymbol ? `${CURRENCY.SYMBOL}${formatted}` : formatted;
  }
};

/**
 * Format date
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    relative: null // Will be handled separately
  };
  
  if (format === 'relative') {
    return formatRelativeDate(dateObj);
  }
  
  return dateObj.toLocaleDateString('en-IN', options[format] || options.short);
};

/**
 * Format relative date (e.g., "2 days ago", "Today")
 */
export const formatRelativeDate = (date) => {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const diffTime = now - dateObj;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < -1 && diffDays > -7) return `In ${Math.abs(diffDays)} days`;
  
  return formatDate(dateObj, 'short');
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Format large numbers with abbreviations
 */
export const formatLargeNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 10000000) { // 1 crore
    return `${(num / 10000000).toFixed(1)}Cr`;
  } else if (absNum >= 100000) { // 1 lakh
    return `${(num / 100000).toFixed(1)}L`;
  } else if (absNum >= 1000) { // 1 thousand
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return num.toString();
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format expense category for display
 */
export const formatCategory = (category) => {
  if (!category) return 'Other';
  return category.split('_').map(capitalize).join(' ');
};

/**
 * Format payment method for display
 */
export const formatPaymentMethod = (method) => {
  const methods = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    wallet: 'Digital Wallet',
    other: 'Other'
  };
  
  return methods[method] || capitalize(method);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format duration in milliseconds to readable format
 */
export const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};
