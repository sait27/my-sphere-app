// utils/validators.js
/**
 * Client-side validation utilities
 */

import { VALIDATION_RULES } from './constants';

/**
 * Validate expense amount
 */
export const validateAmount = (amount) => {
  const errors = [];
  
  if (!amount || amount === '') {
    errors.push('Amount is required');
    return errors;
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    errors.push('Amount must be a valid number');
    return errors;
  }
  
  if (numAmount < VALIDATION_RULES.MIN_EXPENSE_AMOUNT) {
    errors.push(`Amount must be at least ₹${VALIDATION_RULES.MIN_EXPENSE_AMOUNT}`);
  }
  
  if (numAmount > VALIDATION_RULES.MAX_EXPENSE_AMOUNT) {
    errors.push(`Amount cannot exceed ₹${VALIDATION_RULES.MAX_EXPENSE_AMOUNT}`);
  }
  
  return errors;
};

/**
 * Validate expense text input
 */
export const validateExpenseText = (text) => {
  const errors = [];
  
  if (!text || text.trim() === '') {
    errors.push('Expense description is required');
    return errors;
  }
  
  if (text.length > VALIDATION_RULES.MAX_TEXT_LENGTH) {
    errors.push(`Description cannot exceed ${VALIDATION_RULES.MAX_TEXT_LENGTH} characters`);
  }
  
  return errors;
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const errors = [];
  
  if (!email || email.trim() === '') {
    errors.push('Email is required');
    return errors;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return errors;
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return errors;
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
};

/**
 * Validate date format
 */
export const validateDate = (date) => {
  const errors = [];
  
  if (!date) {
    errors.push('Date is required');
    return errors;
  }
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    errors.push('Please enter a valid date');
    return errors;
  }
  
  const today = new Date();
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(today.getFullYear() + 1);
  
  if (dateObj > maxFutureDate) {
    errors.push('Date cannot be more than 1 year in the future');
  }
  
  return errors;
};

/**
 * Validate file upload
 */
export const validateFile = (file, allowedTypes = [], maxSize = 5242880) => {
  const errors = [];
  
  if (!file) {
    errors.push('File is required');
    return errors;
  }
  
  if (allowedTypes.length > 0) {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
    errors.push(`File size cannot exceed ${maxSizeMB}MB`);
  }
  
  return errors;
};

/**
 * Validate form data
 */
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];
    
    fieldRules.forEach(rule => {
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = errors[field] || [];
        errors[field].push(`${field} is required`);
      }
      
      if (rule.minLength && value && value.length < rule.minLength) {
        errors[field] = errors[field] || [];
        errors[field].push(`${field} must be at least ${rule.minLength} characters`);
      }
      
      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors[field] = errors[field] || [];
        errors[field].push(`${field} cannot exceed ${rule.maxLength} characters`);
      }
      
      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors[field] = errors[field] || [];
        errors[field].push(rule.message || `${field} format is invalid`);
      }
      
      if (rule.custom && value) {
        const customErrors = rule.custom(value);
        if (customErrors.length > 0) {
          errors[field] = errors[field] || [];
          errors[field].push(...customErrors);
        }
      }
    });
  });
  
  return errors;
};
