import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShoppingCart, Check, Plus, Minus, X, 
  DollarSign, Package, MapPin, Clock,
  Calculator, Receipt, Star, Loader2,
  CheckCircle, AlertTriangle, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

// Shopping categories for organization
const SHOPPING_CATEGORIES = {
  'Produce': ['fruits', 'vegetables', 'herbs'],
  'Dairy': ['milk', 'cheese', 'yogurt', 'butter'],
  'Meat': ['chicken', 'beef', 'pork', 'fish'],
  'Pantry': ['rice', 'pasta', 'oil', 'spices'],
  'Bakery': ['bread', 'cake', 'cookies'],
  'Frozen': ['ice cream', 'frozen vegetables'],
  'Personal Care': ['soap', 'shampoo', 'toothpaste'],
  'Household': ['detergent', 'paper towels', 'cleaning'],
  'Other': []
};

// Debounce hook for API calls
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// Auto-save indicator component
const SaveIndicator = ({ status }) => {
  if (status === 'saving') {
    return <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />;
  }
  if (status === 'saved') {
    return <CheckCircle className="w-3 h-3 text-green-400" />;
  }
  if (status === 'error') {
    return <AlertTriangle className="w-3 h-3 text-red-400" />;
  }
  return null;
};

const ShoppingModeView = ({ 
  list, 
  isOpen, 
  onClose, 
  onUpdateItem, 
  onDeleteItem, 
  onAddItems 
}) => {
  const [items, setItems] = useState(list.items || []);
  const [cart, setCart] = useState(new Set());
  const [totalCost, setTotalCost] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [saveStates, setSaveStates] = useState({}); // Track save status per item
  const [pendingUpdates, setPendingUpdates] = useState({}); // Batch updates
  const [budget, setBudget] = useState(parseFloat(list.budget) || 0);
  const [groupByCategory, setGroupByCategory] = useState(true);
  
  const batchTimeoutRef = useRef(null);

  useEffect(() => {
    const itemsWithTimestamps = (list.items || []).map(item => ({
      ...item,
      completed_at: item.completed_at || (item.is_completed ? new Date().toISOString() : null)
    }));
    setItems(itemsWithTimestamps);
    calculateTotals(itemsWithTimestamps);
  }, [list.items]);
  
  // Auto-categorize items
  const categorizeItem = useCallback((itemName) => {
    const name = itemName.toLowerCase();
    for (const [category, keywords] of Object.entries(SHOPPING_CATEGORIES)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return category;
      }
    }
    return 'Other';
  }, []);
  
  // Group items by category
  const groupedItems = useCallback((itemList) => {
    if (!groupByCategory) return { 'All Items': itemList };
    
    return itemList.reduce((groups, item) => {
      const category = item.category || categorizeItem(item.name);
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {});
  }, [groupByCategory, categorizeItem]);

  const calculateTotals = (itemList) => {
    const actual = itemList
      .filter(item => item.is_completed && item.price)
      .reduce((sum, item) => {
        const qty = parseFloat(item.quantity || 1);
        const price = parseFloat(item.price || 0);
        return sum + (qty * price);
      }, 0);
    
    const estimated = itemList
      .filter(item => !item.is_completed && item.estimated_price)
      .reduce((sum, item) => {
        const qty = parseFloat(item.quantity || 1);
        const price = parseFloat(item.estimated_price || 0);
        return sum + (qty * price);
      }, 0);
    
    setTotalCost(actual);
    setEstimatedTotal(actual + estimated);
  };
  
  // Budget warning logic
  const getBudgetStatus = () => {
    if (!budget) return null;
    const percentage = (estimatedTotal / budget) * 100;
    if (percentage > 100) return { type: 'over', message: `₹${(estimatedTotal - budget).toFixed(2)} over budget` };
    if (percentage > 80) return { type: 'warning', message: `${(100 - percentage).toFixed(0)}% budget remaining` };
    return { type: 'good', message: `₹${(budget - estimatedTotal).toFixed(2)} remaining` };
  };
  
  // Quantity validation
  const validateQuantity = (value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return '1';
    if (num > 999) return '999';
    return num.toString();
  };

  const handleToggleComplete = async (item) => {
    try {
      const newCompletedState = !item.is_completed;
      const completedAt = newCompletedState ? new Date().toISOString() : null;
      
      const updatedItem = await onUpdateItem(item.id, { 
        is_completed: newCompletedState,
        completed_at: completedAt
      });
      
      const updatedItems = items.map(i => 
        i.id === item.id ? { 
          ...i, 
          ...updatedItem, 
          is_completed: newCompletedState,
          completed_at: completedAt
        } : i
      );
      setItems(updatedItems);
      
      if (newCompletedState) {
        setCart(prev => new Set([...prev, item.id]));
        toast.success(`Added ${item.name} to cart!`);
      } else {
        setCart(prev => {
          const newCart = new Set(prev);
          newCart.delete(item.id);
          return newCart;
        });
        toast.success(`Removed ${item.name} from cart`);
      }
      
      calculateTotals(updatedItems);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item. Please try again.');
    }
  };
  
  // Bulk actions
  const handleBulkComplete = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      const updates = Array.from(selectedItems).map(itemId => 
        onUpdateItem(itemId, { 
          is_completed: true,
          completed_at: new Date().toISOString()
        })
      );
      
      await Promise.all(updates);
      
      const updatedItems = items.map(item => 
        selectedItems.has(item.id) 
          ? { ...item, is_completed: true, completed_at: new Date().toISOString() }
          : item
      );
      
      setItems(updatedItems);
      setSelectedItems(new Set());
      calculateTotals(updatedItems);
      toast.success(`Marked ${selectedItems.size} items as completed`);
    } catch (error) {
      toast.error('Failed to update items');
    }
  };
  
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleUpdatePrice = (item, price) => {
    const priceValue = price && !isNaN(parseFloat(price)) ? parseFloat(price) : null;
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, price: priceValue } : i
    ));
    queueUpdate(item.id, { price: priceValue });
  };
  
  const handleUpdateEstimatedPrice = (item, price) => {
    const priceValue = price && !isNaN(parseFloat(price)) ? parseFloat(price) : null;
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, estimated_price: priceValue } : i
    ));
    queueUpdate(item.id, { estimated_price: priceValue });
  };
  
  const handleUpdateUnit = (item, unit) => {
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, unit: unit || null } : i
    ));
    queueUpdate(item.id, { unit: unit || null });
  };

  // Batch update system
  const processBatchUpdates = useCallback(async () => {
    if (Object.keys(pendingUpdates).length === 0) return;
    
    try {
      const updates = Object.entries(pendingUpdates).map(([itemId, data]) => {
        setSaveStates(prev => ({ ...prev, [itemId]: 'saving' }));
        return onUpdateItem(itemId, data).then(result => ({ itemId, result }));
      });
      
      const results = await Promise.all(updates);
      
      results.forEach(({ itemId, result }) => {
        setSaveStates(prev => ({ ...prev, [itemId]: 'saved' }));
        setTimeout(() => {
          setSaveStates(prev => ({ ...prev, [itemId]: null }));
        }, 2000);
      });
      
      const updatedItems = items.map(item => {
        const result = results.find(r => r.itemId === item.id);
        return result ? { ...item, ...result.result } : item;
      });
      
      setItems(updatedItems);
      calculateTotals(updatedItems);
      setPendingUpdates({});
      
    } catch (error) {
      Object.keys(pendingUpdates).forEach(itemId => {
        setSaveStates(prev => ({ ...prev, [itemId]: 'error' }));
      });
      toast.error('Failed to save some changes');
    }
  }, [pendingUpdates, items, onUpdateItem]);
  
  const debouncedBatchUpdate = useDebounce(processBatchUpdates, 1000);
  
  const queueUpdate = (itemId, data) => {
    setPendingUpdates(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...data }
    }));
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    batchTimeoutRef.current = setTimeout(debouncedBatchUpdate, 500);
  };
  
  const handleUpdateQuantity = (item, quantity) => {
    const validatedQty = validateQuantity(quantity);
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, quantity: validatedQty } : i
    ));
    queueUpdate(item.id, { quantity: validatedQty });
  };

  const handleConvertToExpense = async () => {
    if (window.confirm(`Convert shopping list to expense (₹${totalCost.toFixed(2)})?`)) {
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
          toast.success(result.message);
          onClose();
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to convert to expense');
        }
      } catch (error) {
        toast.error('Failed to convert to expense');
      }
    }
  };

  const pendingItems = items.filter(item => !item.is_completed);
  const completedItems = items.filter(item => item.is_completed);
  const completionPercentage = items.length > 0 ? Math.round((completedItems.length / items.length) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-emerald-700 p-6 border-b border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Shopping Mode</h2>
                <p className="text-green-100">{list.name}</p>
                <div className="flex items-center gap-4 text-green-200 text-sm mt-1">
                  <span>{items.length} items</span>
                  <span>•</span>
                  <span>{completedItems.length} in cart</span>
                  <span>•</span>
                  <span>{completionPercentage}% complete</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {completedItems.length > 0 && totalCost > 0 && (
                <button
                  onClick={handleConvertToExpense}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Receipt className="w-5 h-5" />
                  Add to Expenses
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-green-200 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Shopping Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-300" />
                <span className="text-green-300 font-medium">Current Total</span>
              </div>
              <p className="text-2xl font-bold text-white">₹{totalCost.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-blue-300" />
                <span className="text-blue-300 font-medium">Estimated Total</span>
              </div>
              <p className="text-2xl font-bold text-white">₹{estimatedTotal.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-purple-300" />
                <span className="text-purple-300 font-medium">Items Left</span>
              </div>
              <p className="text-2xl font-bold text-white">{pendingItems.length}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-300" />
                <span className="text-yellow-300 font-medium">Budget</span>
              </div>
              {budget > 0 ? (
                <div>
                  <p className="text-lg font-bold text-white">₹{budget.toFixed(2)}</p>
                  {getBudgetStatus() && (
                    <p className={`text-xs ${
                      getBudgetStatus().type === 'over' ? 'text-red-300' :
                      getBudgetStatus().type === 'warning' ? 'text-yellow-300' : 'text-green-300'
                    }`}>
                      {getBudgetStatus().message}
                    </p>
                  )}
                </div>
              ) : (
                <input
                  type="number"
                  placeholder="Set budget"
                  className="w-full bg-transparent text-white text-lg font-bold border-b border-yellow-300 focus:outline-none"
                  onBlur={(e) => setBudget(parseFloat(e.target.value) || 0)}
                />
              )}
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <div className="mt-4 bg-blue-600/20 rounded-xl p-4 flex items-center justify-between">
              <span className="text-blue-200">{selectedItems.size} items selected</span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkComplete}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Mark as Complete
                </button>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
          
          {/* Category Toggle */}
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-green-200">
              <input
                type="checkbox"
                checked={groupByCategory}
                onChange={(e) => setGroupByCategory(e.target.checked)}
                className="rounded"
              />
              Group by Category
            </label>
          </div>
        </div>

        {/* Shopping List */}
        <div className="flex-1 overflow-y-auto max-h-96 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Shopping List */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Shopping List ({pendingItems.length})
              </h3>
              
              <div className="space-y-4">
                {Object.entries(groupedItems(pendingItems)).map(([category, categoryItems]) => (
                  <div key={category}>
                    {groupByCategory && (
                      <h4 className="text-lg font-semibold text-slate-300 mb-2 border-b border-slate-600 pb-1">
                        {category} ({categoryItems.length})
                      </h4>
                    )}
                    <div className="space-y-3">
                      {categoryItems.map(item => (
                        <div
                          key={item.id}
                          className={`bg-slate-800/50 border rounded-xl p-4 hover:border-slate-500 transition-all ${
                            selectedItems.has(item.id) ? 'border-blue-400 bg-blue-900/20' : 'border-slate-600'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={() => toggleItemSelection(item.id)}
                              className="mt-1 rounded"
                            />
                            <button
                              onClick={() => handleToggleComplete(item)}
                              className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-slate-400 hover:border-green-400 flex items-center justify-center mt-1"
                            >
                              {item.is_completed && <Check className="w-4 h-4 text-green-400" />}
                            </button>
                      
                      <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-white flex items-center gap-2">
                                {item.name}
                                <SaveIndicator status={saveStates[item.id]} />
                              </h4>
                              {item.priority === 'high' && (
                                <Star className="w-4 h-4 text-yellow-400" />
                              )}
                            </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                              <input
                                type="text"
                                value={item.quantity || '1'}
                                onChange={(e) => {
                                  const newValue = validateQuantity(e.target.value);
                                  handleUpdateQuantity(item, newValue);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') e.target.blur();
                                }}
                                className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-green-500"
                              />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Unit</label>
                              <input
                                type="text"
                                value={item.unit || ''}
                                onChange={(e) => handleUpdateUnit(item, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') e.target.blur();
                                }}
                                placeholder="pcs, kg, lbs"
                                className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-green-500"
                              />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Est. Price</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.estimated_price || ''}
                                onChange={(e) => handleUpdateEstimatedPrice(item, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') e.target.blur();
                                }}
                                placeholder="0.00"
                                className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-green-500"
                              />
                          </div>
                        </div>
                        
                        {item.category && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                              {item.category}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                        ))}
                    </div>
                  </div>
                ))}
                
                {pendingItems.length === 0 && (
                  <div className="text-center py-8">
                    <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-white mb-2">All items collected!</h4>
                    <p className="text-slate-400">You've got everything on your list.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shopping Cart */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Shopping Cart ({completedItems.length})
              </h3>
              
              <div className="space-y-3">
                {completedItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-green-900/20 border border-green-500/30 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleComplete(item)}
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center mt-1"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white">{item.name}</h4>
                          <div className="text-right">
                            <span className="text-green-400 font-medium">
                              {item.quantity || '1'} {item.unit || 'pcs'}
                            </span>
                            {item.completed_at && (
                              <div className="text-xs text-green-300">
                                {new Date(item.completed_at).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-400">Actual Price:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price || ''}
                            onChange={(e) => handleUpdatePrice(item, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                            }}
                            placeholder="0.00"
                            className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-green-500"
                          />
                          <SaveIndicator status={saveStates[item.id]} />
                          <span className="text-slate-400 text-sm">
                            {item.estimated_price && `(est. ₹${item.estimated_price})`}
                          </span>
                          {item.completed_at && (
                            <span className="text-xs text-green-400">
                              {new Date(item.completed_at).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {completedItems.length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-white mb-2">Cart is empty</h4>
                    <p className="text-slate-400">Start shopping to add items to your cart.</p>
                  </div>
                )}
              </div>
              
              {/* Cart Summary */}
              {completedItems.length > 0 && (
                <div className="mt-6 bg-slate-800/50 rounded-xl p-4 border border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-white">Cart Total:</span>
                    <span className="text-2xl font-bold text-green-400">₹{totalCost.toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={() => setShowReceipt(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-5 h-5" />
                    View Receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Shopping Receipt</h3>
                <p className="text-gray-600">{list.name}</p>
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="space-y-2 mb-6">
                {completedItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <div>
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {item.quantity || '1'} {item.unit || 'pcs'}
                      </span>
                    </div>
                    <span className="font-medium text-gray-800">
                      ₹{parseFloat(item.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="border-t-2 border-gray-300 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-green-600">₹{totalCost.toFixed(2)}</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowReceipt(false)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingModeView;