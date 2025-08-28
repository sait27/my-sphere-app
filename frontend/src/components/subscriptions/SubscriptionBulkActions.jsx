import React, { useState, useEffect } from 'react';
import { Trash2, Pause, Play, X, Edit3, Download, Tag } from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import toast from 'react-hot-toast';

const SubscriptionBulkActions = ({ selectedSubscriptions, onActionComplete, categories = [] }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/subscriptions/categories/');
      setAvailableCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  if (selectedSubscriptions.length === 0) return null;

  const handleBulkPause = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedSubscriptions.map(id => 
          apiClient.post(`/subscriptions/subscriptions/${id}/pause/`)
        )
      );
      toast.success(`Paused ${selectedSubscriptions.length} subscriptions`);
      onActionComplete();
    } catch (error) {
      toast.error('Failed to pause subscriptions');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkResume = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedSubscriptions.map(id => 
          apiClient.post(`/subscriptions/subscriptions/${id}/resume/`)
        )
      );
      toast.success(`Resumed ${selectedSubscriptions.length} subscriptions`);
      onActionComplete();
    } catch (error) {
      toast.error('Failed to resume subscriptions');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCancel = async () => {
    if (!window.confirm(`Are you sure you want to cancel ${selectedSubscriptions.length} subscriptions?`)) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedSubscriptions.map(id => 
          apiClient.post(`/subscriptions/subscriptions/${id}/cancel/`)
        )
      );
      toast.success(`Cancelled ${selectedSubscriptions.length} subscriptions`);
      onActionComplete();
    } catch (error) {
      toast.error('Failed to cancel subscriptions');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedSubscriptions.length} subscriptions? This cannot be undone.`)) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedSubscriptions.map(id => 
          apiClient.delete(`/subscriptions/subscriptions/${id}/`)
        )
      );
      toast.success(`Deleted ${selectedSubscriptions.length} subscriptions`);
      onActionComplete();
    } catch (error) {
      toast.error('Failed to delete subscriptions');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCategoryUpdate = async () => {
    if (!newCategory.trim()) return;
    
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedSubscriptions.map(id => 
          apiClient.patch(`/subscriptions/subscriptions/${id}/`, { category: newCategory })
        )
      );
      toast.success(`Updated category for ${selectedSubscriptions.length} subscriptions`);
      setShowCategoryModal(false);
      setNewCategory('');
      onActionComplete();
    } catch (error) {
      toast.error('Failed to update categories');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    setIsProcessing(true);
    try {
      const response = await apiClient.get('/subscriptions/subscriptions/', {
        params: { ids: selectedSubscriptions.join(',') }
      });
      
      // Create CSV content
      const csvContent = [
        ['Name', 'Provider', 'Amount', 'Billing Cycle', 'Status', 'Next Billing Date'].join(','),
        ...response.data
          .filter(sub => selectedSubscriptions.includes(sub.subscription_id))
          .map(sub => [
            sub.name,
            sub.provider,
            sub.amount,
            sub.billing_cycle,
            sub.status,
            sub.next_billing_date
          ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Subscriptions exported successfully');
    } catch (error) {
      toast.error('Failed to export subscriptions');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 mb-6 animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
              <Edit3 className="text-cyan-400" size={16} />
            </div>
            <span className="text-white font-medium">
              {selectedSubscriptions.length} subscription{selectedSubscriptions.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkPause}
              disabled={isProcessing}
              className="px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <Pause size={14} />
              Pause
            </button>
            
            <button
              onClick={handleBulkResume}
              disabled={isProcessing}
              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <Play size={14} />
              Resume
            </button>
            
            <button
              onClick={() => setShowCategoryModal(true)}
              disabled={isProcessing}
              className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <Tag size={14} />
              Category
            </button>
            
            <button
              onClick={handleBulkExport}
              disabled={isProcessing}
              className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <Download size={14} />
              Export
            </button>
            
            <button
              onClick={handleBulkCancel}
              disabled={isProcessing}
              className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <X size={14} />
              Cancel
            </button>
            
            <button
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Category Update Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md border border-slate-700/50 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Update Category</h3>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Category for {selectedSubscriptions.length} subscription{selectedSubscriptions.length !== 1 ? 's' : ''}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                >
                  <option value="">Select Category</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleBulkCategoryUpdate}
                  disabled={isProcessing || !newCategory.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isProcessing ? 'Updating...' : 'Update Category'}
                </button>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white font-semibold rounded-xl transition-all duration-200 border border-slate-600/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubscriptionBulkActions;