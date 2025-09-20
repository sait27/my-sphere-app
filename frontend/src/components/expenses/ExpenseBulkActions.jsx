import React, { useState } from 'react';
import { Check, Trash2, Tag, Copy, Archive, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseAPI } from '../../api/expenses';

const ExpenseBulkActions = ({ selectedExpenses, onActionComplete, categories }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleBulkAction = async (action, params = {}) => {
    if (selectedExpenses.length === 0) {
      toast.error('No expenses selected');
      return;
    }

    setIsProcessing(true);
    try {
      await expenseAPI.bulkOperation(action, selectedExpenses, params);

      toast.success(`${action} completed for ${selectedExpenses.length} expenses`);
      onActionComplete();
    } catch (error) {
      toast.error(`Failed to ${action} expenses`);
      // Bulk action error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCategorize = () => {
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }
    handleBulkAction('categorize', { category: selectedCategory });
    setShowCategoryModal(false);
    setSelectedCategory('');
  };

  const handleDuplicate = () => {
    handleBulkAction('duplicate');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedExpenses.length} expenses?`)) {
      handleBulkAction('delete');
    }
  };

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      console.log('🔍 Exporting expenses:', selectedExpenses);
      
      const response = await expenseAPI.exportExpenses(selectedExpenses, 'csv');

      console.log('🔍 Export response:', response);
      console.log('🔍 Response data type:', typeof response.data);
      console.log('🔍 Response data size:', response.data.size);

      // Check if we actually got a blob
      if (!response.data || response.data.size === 0) {
        throw new Error('No data received from server');
      }

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success('Expenses exported successfully');
    } catch (error) {
      console.error('🔴 Export error:', error);
      console.error('🔴 Error response:', error.response);
      toast.error(`Failed to export expenses: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedExpenses.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="text-cyan-400" size={20} />
            <span className="text-white font-medium">
              {selectedExpenses.length} expense{selectedExpenses.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              disabled={isProcessing}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Tag size={16} />
              <span>Categorize</span>
            </button>
            
            <button
              onClick={handleDuplicate}
              disabled={isProcessing}
              className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Copy size={16} />
              <span>Duplicate</span>
            </button>
            
            <button
              onClick={handleExport}
              disabled={isProcessing}
              className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Select Category</h3>
            
            <div className="space-y-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Choose a category...</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setSelectedCategory('');
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCategorize}
                  disabled={!selectedCategory || isProcessing}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Apply Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpenseBulkActions;
