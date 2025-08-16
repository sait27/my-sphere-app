import toast from 'react-hot-toast';

/**
 * Comprehensive error handling utility for the MY SPHERE application
 */
class ErrorHandler {
  static logError(error, context = '') {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context}]`, error);
    }
    
    // In production, you would send to error tracking service
    // Example: Sentry.captureException(error, { tags: { context } });
  }

  static handleApiError(error, context = 'API Error') {
    let message = 'An unexpected error occurred';
    
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          message = data.error || data.message || 'Invalid request';
          break;
        case 401:
          message = 'Authentication required. Please log in again.';
          // Redirect to login or refresh token
          break;
        case 403:
          message = 'You don\'t have permission to perform this action';
          break;
        case 404:
          message = 'The requested resource was not found';
          break;
        case 409:
          message = data.error || 'Conflict with existing data';
          break;
        case 422:
          message = data.error || 'Validation error';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          message = data.error || data.message || `Server error (${status})`;
      }
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your connection.';
    } else {
      // Other error
      message = error.message || 'An unexpected error occurred';
    }

    this.logError(error, context);
    toast.error(message);
    
    return { message, status: error.response?.status };
  }

  static handleAsyncError(asyncFn, context = 'Operation') {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        this.handleApiError(error, context);
        throw error; // Re-throw for component-level handling if needed
      }
    };
  }

  static handleFormError(error, setFieldError = null) {
    if (error.response?.data?.errors) {
      // Handle validation errors
      const errors = error.response.data.errors;
      Object.keys(errors).forEach(field => {
        if (setFieldError) {
          setFieldError(field, errors[field][0]);
        }
      });
    } else {
      this.handleApiError(error, 'Form Submission');
    }
  }

  static showSuccess(message) {
    toast.success(message);
  }

  static showInfo(message) {
    toast(message, { icon: 'ℹ️' });
  }

  static showWarning(message) {
    toast(message, { icon: '⚠️' });
  }

  // Specific error handlers for different contexts
  static handleExpenseError(error, operation = 'expense operation') {
    const context = `Expense - ${operation}`;
    return this.handleApiError(error, context);
  }

  static handleListError(error, operation = 'list operation') {
    const context = `List - ${operation}`;
    return this.handleApiError(error, context);
  }

  static handleTodoError(error, operation = 'todo operation') {
    const context = `Todo - ${operation}`;
    return this.handleApiError(error, context);
  }

  static handleBudgetError(error, operation = 'budget operation') {
    const context = `Budget - ${operation}`;
    return this.handleApiError(error, context);
  }

  static handleAuthError(error) {
    const context = 'Authentication';
    if (error.response?.status === 401) {
      toast.error('Session expired. Please log in again.');
      // Redirect to login
      window.location.href = '/login';
    } else {
      this.handleApiError(error, context);
    }
  }

  static handleFileError(error, operation = 'file operation') {
    const context = `File - ${operation}`;
    let message = 'File operation failed';
    
    if (error.name === 'QuotaExceededError') {
      message = 'Storage quota exceeded. Please free up space.';
    } else if (error.name === 'NotAllowedError') {
      message = 'File access not allowed. Please check permissions.';
    } else if (error.name === 'SecurityError') {
      message = 'Security error. File may be corrupted or unsafe.';
    }
    
    this.logError(error, context);
    toast.error(message);
  }

  static handleExportError(error, format = 'data') {
    const context = `Export - ${format}`;
    let message = `Failed to export ${format}`;
    
    if (error.message?.includes('jsPDF')) {
      message = 'PDF generation failed. Please try again.';
    } else if (error.message?.includes('CSV')) {
      message = 'CSV generation failed. Please try again.';
    }
    
    this.logError(error, context);
    toast.error(message);
  }
}

// Error boundary hook for React components
export const useErrorHandler = () => {
  const handleError = (error, context) => {
    ErrorHandler.handleApiError(error, context);
  };

  const handleAsyncOperation = (asyncFn, context) => {
    return ErrorHandler.handleAsyncError(asyncFn, context);
  };

  return {
    handleError,
    handleAsyncOperation,
    showSuccess: ErrorHandler.showSuccess,
    showInfo: ErrorHandler.showInfo,
    showWarning: ErrorHandler.showWarning
  };
};

export default ErrorHandler;
