// components/BulkOperationsBar.jsx

import React from 'react';
import { 
  CheckCircle, X, Trash2, Archive, Copy, 
  Tag, Star, Move, Download, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

const BulkOperationsBar = ({ 
  selectedItems, 
  onClearSelection, 
  onBulkOperation,
  totalItems = 0 
}) => {
  const selectedCount = selectedItems.size;
  
  if (selectedCount === 0) return null;

  const handleOperation = async (operation) => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      await onBulkOperation(operation, selectedItems);
      onClearSelection();
      toast.success(`Successfully ${operation.replace('bulk_', '').replace('_', ' ')}d ${selectedItems.size} items`);
    } catch (error) {
      console.error('Bulk operation error:', error);
      const errorMsg = error.response?.data?.error || `Failed to ${operation.replace('bulk_', '').replace('_', ' ')}`;
      toast.error(errorMsg);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-2 text-white">
            <CheckCircle className="text-cyan-400" size={20} />
            <span className="font-semibold">
              {selectedCount} of {totalItems} selected
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-600" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOperation('bulk_complete')}
              className="flex items-center gap-2 px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors"
              title="Mark as complete"
            >
              <CheckCircle size={16} />
              <span className="hidden sm:inline">Complete</span>
            </button>

            <button
              onClick={() => handleOperation('bulk_incomplete')}
              className="flex items-center gap-2 px-3 py-2 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 rounded-lg transition-colors"
              title="Mark as incomplete"
            >
              <X size={16} />
              <span className="hidden sm:inline">Incomplete</span>
            </button>

            <button
              onClick={() => handleOperation('bulk_favorite')}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 rounded-lg transition-colors"
              title="Add to favorites"
            >
              <Star size={16} />
              <span className="hidden sm:inline">Favorite</span>
            </button>

            <button
              onClick={() => handleOperation('bulk_duplicate')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors"
              title="Duplicate items"
            >
              <Copy size={16} />
              <span className="hidden sm:inline">Duplicate</span>
            </button>

            <button
              onClick={() => handleOperation('bulk_archive')}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-lg transition-colors"
              title="Archive items"
            >
              <Archive size={16} />
              <span className="hidden sm:inline">Archive</span>
            </button>

            <button
              onClick={() => handleOperation('bulk_delete')}
              className="flex items-center gap-2 px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
              title="Delete items"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-600" />

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkOperationsBar;
