import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Edit2, Trash2, Search, Filter, DollarSign, ShoppingCart } from 'lucide-react';
import {useShoppingMode} from '../../hooks/useShoppingMode';
import apiClient from '../../api/axiosConfig';
const ListItemsModal = ({ 
  list, 
  isOpen, 
  onClose,
  onAddItems,
  onUpdateItem,
  onDeleteItem
}) => {
  const { createExpenseFromList, updateItemPrice, loading: shoppingLoading } = useShoppingMode();
  const [newItemText, setNewItemText] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceText, setPriceText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setNewItemText('');
      setEditingItem(null);
      setEditText('');
      setSearchQuery('');
      setFilterStatus('all');
    }
  }, [isOpen]);

  if (!isOpen || !list) return null;

  const handleAddItems = async (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    setIsAddingItem(true);
    try {
      await onAddItems(list.id, newItemText);
      setNewItemText('');
    } catch (error) {
      console.error('Error adding items:', error);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      console.log('=== ITEM UPDATE DEBUG ===');
      console.log('Item:', item);
      console.log('Current completed status:', item.is_completed);
      console.log('New completed status:', !item.is_completed);
      console.log('List ID:', list.id);
      
      const updatedData = { is_completed: !item.is_completed };
      console.log('Update data:', updatedData);
      
      // Test direct API call first
      try {
        console.log('Testing direct API call...');
        const directResponse = await apiClient.patch(`/lists/items/${item.id}/`, updatedData);
        console.log('Direct API call successful:', directResponse.data);
      } catch (directError) {
        console.error('Direct API call failed:', directError);
        console.error('Direct API error response:', directError.response?.data);
        console.error('Direct API error status:', directError.response?.status);
      }
      
      // Now try through the hook
      await onUpdateItem(item.id, updatedData);
      console.log('Item updated successfully through hook');
    } catch (error) {
      console.error('=== ERROR UPDATING ITEM ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error config:', error.config);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unknown error occurred';
      
      alert(`Failed to update item: ${errorMessage}`);
    }
  };

  const handleUpdatePrice = async (itemId, price) => {
    try {
      console.log('=== PRICE UPDATE DEBUG ===');
      console.log('Item ID:', itemId);
      console.log('Price input:', price);
      
      const priceValue = price && !isNaN(parseFloat(price)) ? parseFloat(price) : null;
      console.log('Processed price value:', priceValue);
      
      const updateData = { price: priceValue };
      console.log('Update data:', updateData);
      
      await onUpdateItem(itemId, updateData);
      setEditingPrice(null);
      setPriceText('');
      console.log('Price updated successfully');
    } catch (error) {
      console.error('=== ERROR UPDATING PRICE ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unknown error occurred';
      
      alert(`Failed to update price: ${errorMessage}`);
    }
  };

  const handleShoppingMode = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/lists/${list.id}/shopping-mode/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error activating shopping mode:', error);
    }
  };

  const handleAddToExpenses = async () => {
    const completedWithPrices = list.items?.filter(item => item.is_completed && item.price) || [];
    const total = completedWithPrices.reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    if (window.confirm(`Add shopping items to expenses (₹${total.toFixed(2)})?`)) {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/lists/${list.id}/convert-to-expense/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          alert(result.message || 'Successfully added to expenses!');
          onClose();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to add to expenses');
        }
      } catch (error) {
        console.error('Error adding to expenses:', error);
        alert('Failed to add to expenses');
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    
    try {
      console.log('=== NAME UPDATE DEBUG ===');
      console.log('Item ID:', editingItem);
      console.log('New name:', editText.trim());
      
      const updateData = { name: editText.trim() };
      await onUpdateItem(editingItem, updateData);
      setEditingItem(null);
      setEditText('');
      console.log('Name updated successfully');
    } catch (error) {
      console.error('=== ERROR UPDATING NAME ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Unknown error occurred';
      
      alert(`Failed to update item name: ${errorMessage}`);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        console.log('=== DELETE ITEM DEBUG ===');
        console.log('Item ID:', itemId);
        
        await onDeleteItem(itemId);
        console.log('Item deleted successfully');
      } catch (error) {
        console.error('=== ERROR DELETING ITEM ===');
        console.error('Error:', error);
        console.error('Error response:', error.response);
        
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.detail || 
                            error.message || 
                            'Unknown error occurred';
        
        alert(`Failed to delete item: ${errorMessage}`);
      }
    }
  };

  const filteredItems = (list.items || []).filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'pending' && !item.is_completed) ||
      (filterStatus === 'completed' && item.is_completed);
    return matchesSearch && matchesFilter;
  });

  const pendingItems = filteredItems.filter(item => !item.is_completed);
  const completedItems = filteredItems.filter(item => item.is_completed);
  const totalItems = list.items?.length || 0;
  const completedCount = list.items?.filter(item => item.is_completed).length || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div>
              <h2 className="text-2xl font-bold text-white">{list.name}</h2>
              <p className="text-slate-400 mt-1">
                {totalItems} items • {completedCount} completed • {Math.round((completedCount / totalItems) * 100) || 0}% done
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShoppingMode}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <ShoppingCart size={16} />
                Shopping Mode
              </button>
              {list.items?.filter(item => item.is_completed && item.price).length > 0 && (
                <button
                  onClick={handleAddToExpenses}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add to Expenses
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Add Items Form */}
          <div className="p-6 border-b border-slate-700 bg-slate-800/50">
            <form onSubmit={handleAddItems} className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Add items: milk, bread, eggs... (AI will parse multiple items)"
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  disabled={isAddingItem || !newItemText.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all"
                >
                  {isAddingItem ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus size={20} />
                  )}
                  {isAddingItem ? 'Adding...' : 'Add Items'}
                </button>
              </div>
              <p className="text-sm text-slate-400">
                💡 Tip: You can add multiple items at once. Our AI will automatically separate them for you!
              </p>
            </form>
          </div>

          {/* Search and Filter */}
          <div className="p-6 border-b border-slate-700 bg-slate-800/30">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Items</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[50vh]">
            {/* Pending Items */}
            {(filterStatus === 'all' || filterStatus === 'pending') && pendingItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                  Pending ({pendingItems.length})
                </h3>
                <div className="space-y-3">
                  {pendingItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700/70 transition-all group"
                    >
                      <button
                        onClick={() => handleToggleComplete(item)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          item.is_completed 
                            ? 'border-green-400 bg-green-400' 
                            : 'border-slate-400 hover:border-blue-400 bg-transparent'
                        }`}
                      >
                        {item.is_completed && <Check className="w-4 h-4 text-white" />}
                      </button>
                      
                      <div className="flex-1">
                        {editingItem === item.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="flex-1 bg-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') {
                                  setEditingItem(null);
                                  setEditText('');
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEdit}
                              className="text-green-400 hover:text-green-300 p-2"
                            >
                              <Check size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-white font-medium">{item.name}</span>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                              {item.quantity && <span>Qty: {item.quantity}</span>}
                              {item.unit && <span>({item.unit})</span>}
                              {editingPrice === item.id ? (
                                <div className="flex items-center gap-1">
                                  <DollarSign size={14} className="text-green-400" />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={priceText}
                                    onChange={(e) => setPriceText(e.target.value)}
                                    className="w-20 bg-slate-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdatePrice(item.id, priceText);
                                      if (e.key === 'Escape') {
                                        setEditingPrice(null);
                                        setPriceText('');
                                      }
                                    }}
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingPrice(item.id);
                                    setPriceText(item.price || '');
                                  }}
                                  className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm"
                                >
                                  <DollarSign size={14} />
                                  {item.price ? `₹${item.price}` : 'Add Price'}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingItem(item.id);
                            setEditText(item.name);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Items */}
            {(filterStatus === 'all' || filterStatus === 'completed') && completedItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  Completed ({completedItems.length})
                </h3>
                <div className="space-y-3">
                  {completedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl opacity-75 hover:opacity-90 transition-all group"
                    >
                      <button
                        onClick={() => handleToggleComplete(item)}
                        className="w-6 h-6 rounded-full border-2 border-green-400 bg-green-400 flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-slate-300 line-through font-medium">{item.name}</span>
                        {item.price && (
                          <span className="text-green-400 font-medium">₹{item.price}</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                {searchQuery || filterStatus !== 'all' ? (
                  <>
                    <Search size={48} className="mx-auto text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">No items found</h3>
                    <p className="text-slate-400">Try adjusting your search or filter</p>
                  </>
                ) : (
                  <>
                    <Plus size={48} className="mx-auto text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">No Items Yet</h3>
                    <p className="text-slate-400">Add your first items using the form above</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                {filteredItems.length !== totalItems && (
                  <span>Showing {filteredItems.length} of {totalItems} items</span>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ListItemsModal;