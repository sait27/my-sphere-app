// components/ListItemsModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Plus, ShoppingCart, CheckCircle, Circle, Edit3, 
  Trash2, DollarSign, Package, Zap, Loader2, Edit2, Check
} from 'lucide-react';
import { useLists } from '../../hooks/useLists';
import toast from 'react-hot-toast';
import ConfirmModal from '../modals/ConfirmModal';
import apiClient from "../../api/axiosConfig";

const ListItemsModal = ({ 
  selectedList, 
  isOpen, 
  onClose,
  onListUpdated,
  updateItem,
  deleteItem,
  addItemsWithAI 
}) => {
  const { fetchListDetails } = useLists();
  
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');
  const [shoppingMode, setShoppingMode] = useState(false);
  const [itemPrices, setItemPrices] = useState({});
  const [loadingItems, setLoadingItems] = useState(new Set());
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  // Add null safety check
  if (!selectedList && isOpen) {
    console.warn('ListItemsModal: No selectedList provided but modal is open');
  }
  
  // Always call hooks before any early returns
  useEffect(() => {
    if (selectedList?.id) {
      // Reset local state when list changes
      setLoadingItems(new Set());
      setItemPrices({});
      setEditingItem(null);
      setEditText('');
    }
  }, [selectedList?.id]);

  // ALL CALLBACKS MUST BE DEFINED BEFORE EARLY RETURNS
  const handleAddItems = useCallback(async (e) => {
    e.preventDefault();
    if (!newItemText.trim() || !selectedList?.id) return;

    const inputText = newItemText;
    setNewItemText('');
    setIsAddingItem(true);

    try {
      await addItemsWithAI(selectedList.id, inputText);
      // Refresh the list details to get updated state with new items
      if (selectedList?.id && onListUpdated) {
        const updatedList = await fetchListDetails(selectedList.id);
        if (updatedList) {
          onListUpdated(updatedList);
        }
      }
    } catch (error) {
      // If the hook fails, restore the input text.
      setNewItemText(inputText);
      // The hook now displays its own error toasts.
    } finally {
      setIsAddingItem(false);
    }
  }, [newItemText, selectedList?.id, addItemsWithAI, onListUpdated, fetchListDetails]);

  const handleToggleComplete = useCallback(async (item) => {
    if (item.isOptimistic) return; // Don't allow toggle on optimistic items
    
    const itemId = item.id;
    const newCompletedState = !item.is_completed;
    
    // Add to loading set
    setLoadingItems(prev => new Set([...prev, itemId]));
    
    try {
      await updateItem(itemId, { is_completed: newCompletedState });
      // Refresh the list details to get updated state
      if (selectedList?.id && onListUpdated) {
        const updatedList = await fetchListDetails(selectedList.id);
        if (updatedList) {
          onListUpdated(updatedList);
        }
      }
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      // Remove from loading set
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, [updateItem, selectedList, onListUpdated, fetchListDetails]);

  const handleDeleteItem = useCallback(async (itemId) => {
    try {
      await deleteItem(itemId);
      // Don't show success toast here - the hook handles it
      // Refresh the list details to get updated state
      if (selectedList?.id && onListUpdated) {
        const updatedList = await fetchListDetails(selectedList.id);
        if (updatedList) {
          onListUpdated(updatedList);
        }
      }
    } catch (error) {
      // Don't show error toast here either - the hook handles it
    }
  }, [deleteItem, selectedList, onListUpdated, fetchListDetails]);

  const handleEditItem = useCallback((item) => {
    setEditingItem(item.id);
    setEditText(item.name);
  }, []);

  const handleSaveEdit = useCallback(async (itemId) => {
    if (!editText.trim()) return;
    
    try {
      await updateItem(itemId, { name: editText.trim() });
      setEditingItem(null);
      setEditText('');
      // Don't show toast here - the hook handles it
      // Refresh the list details to get updated state
      if (selectedList?.id && onListUpdated) {
        const updatedList = await fetchListDetails(selectedList.id);
        if (updatedList) {
          onListUpdated(updatedList);
        }
      }
    } catch (error) {
      // Don't show error toast here either - the hook handles it
    }
  }, [editText, updateItem, selectedList, onListUpdated, fetchListDetails]);

  const calculateShoppingTotal = useCallback(() => {
    return Object.values(itemPrices).reduce((total, price) => 
      total + parseFloat(price || 0), 0
    );
  }, [itemPrices]);

  const handleFinishShopping = useCallback(async () => {
    const total = calculateShoppingTotal();
    if (total <= 0) {
      setShoppingMode(false);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Log Expense",
      message: `Your total is ₹${total.toFixed(2)}. Log this as a new expense?`,
      onConfirm: async () => {
        try {
          const expenseText = `Shopping for '${selectedList?.name || 'Unknown'}' list, total was ${total.toFixed(2)}`;
          await apiClient.post('/expenses/', { text: expenseText });
          toast.success("Expense logged from your shopping trip!");
          setShoppingMode(false);
          setItemPrices({});
        } catch (error) {
          toast.error("Failed to log expense.");
        }
      }
    });
  }, [calculateShoppingTotal, selectedList?.name]);

  const displayItems = selectedList?.items || [];
  const pendingItems = displayItems.filter(item => !item.is_completed) || [];
  const completedItems = displayItems.filter(item => item.is_completed) || [];
  
  
  // Early return if modal is not open
  if (!isOpen) {
    return null;
  }

  // Early return if no selected list
  if (!selectedList) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8 text-center">
          <div className="text-red-400 mb-4">No list selected</div>
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="list-items-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
              <Package className="text-cyan-400" size={20} />
            </div>
            <div>
              <h3 id="list-items-title" className="text-xl font-bold text-white">{selectedList?.name || 'List Items'}</h3>
              <p className="text-slate-400 text-sm">
                {displayItems.length} items • {completedItems.length} completed
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Shopping Mode Toggle */}
            <button
              onClick={() => setShoppingMode(!shoppingMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                shoppingMode 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingCart size={16} />
              {shoppingMode ? 'Shopping Mode' : 'Enable Shopping'}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Add Items Form */}
        <div className="p-6 border-b border-slate-700">
          <form onSubmit={handleAddItems} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={18} />
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add items with AI: 'milk 2 liters, bread, eggs dozen'"
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                aria-label="Add new items"
              />
            </div>
            <button
              type="submit"
              disabled={isAddingItem || !newItemText.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 whitespace-nowrap"
            >
              {isAddingItem ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isAddingItem ? 'Adding...' : 'Add Items'}
            </button>
          </form>
        </div>

        {/* Shopping Mode Summary */}
        {shoppingMode && (
          <div className="p-4 bg-green-500/10 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="text-green-400">
                <span className="font-semibold">Shopping Total: ₹{Object.values(itemPrices).reduce((sum, price) => sum + (parseFloat(price) || 0), 0).toFixed(2)}</span>
              </div>
              <button
                onClick={handleFinishShopping}
                className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Finish Shopping
              </button>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Circle className="text-slate-400" size={18} />
                Pending ({pendingItems.length})
              </h4>
              <div className="space-y-2">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors"
                  >
                    <button
                      onClick={() => handleToggleComplete(item)}
                      disabled={item.isOptimistic || loadingItems.has(item.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        item.is_completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      } ${(item.isOptimistic || loadingItems.has(item.id)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label={item.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {loadingItems.has(item.id) ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        item.is_completed && <Check className="w-3 h-3" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      {editingItem === item.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 bg-slate-600 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.id);
                              if (e.key === 'Escape') {
                                setEditingItem(null);
                                setEditText('');
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            <CheckCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                          <div className="flex-1">
                            <span className={`${item.is_completed ? 'line-through text-gray-500' : ''} ${item.isOptimistic ? 'opacity-70 italic' : ''}`}>
                              {item.name}
                              {item.isOptimistic && <span className="text-xs text-gray-400 ml-2">(adding...)</span>}
                            </span>
                            {item.quantity && (
                              <span className="text-slate-500 ml-2">({item.quantity})</span>
                            )}
                          </div>
                          
                          {shoppingMode && (
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                              <span className="text-slate-400">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={itemPrices[item.id] || ''}
                                onChange={(e) => setItemPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="w-20 bg-slate-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="0.00"
                                aria-label={`Price for ${item.name}`}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        disabled={loadingItems.has(item.id)}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-400" size={18} />
                Completed ({completedItems.length})
              </h4>
              <div className="space-y-2">
                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-700/30 rounded-lg opacity-75"
                  >
                    <button
                      onClick={() => handleToggleComplete(item)}
                      className="text-green-400 hover:text-slate-400 transition-colors flex-shrink-0"
                      aria-label={`Mark ${item.name} as incomplete`}
                    >
                      <CheckCircle size={20} />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-300 line-through break-words">{item.name}</span>
                      {item.quantity && (
                        <span className="text-slate-500 ml-2">({item.quantity})</span>
                      )}
                      {item.price && (
                        <span className="text-green-400 ml-2">₹{item.price}</span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-1 flex-shrink-0 mt-2 sm:mt-0"
                      disabled={loadingItems.has(item.id)}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {displayItems.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-slate-500 mb-4" />
              <h4 className="text-xl font-semibold text-slate-300 mb-2">No Items Yet</h4>
              <p className="text-slate-400">
                Add your first items using the AI-powered input above
              </p>
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false })}
          onConfirm={() => {
            if (confirmModal.onConfirm) confirmModal.onConfirm();
            setConfirmModal({ isOpen: false });
          }}
          title={confirmModal.title || "Confirm Action"}
          message={confirmModal.message || "Are you sure?"}
        />
      </div>
    </div>
  );
};

export default ListItemsModal;
