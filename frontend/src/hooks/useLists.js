import { useState, useEffect, useCallback, useMemo } from 'react';
import { listsAPI } from '../api';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/errorHandler';

export const useLists = () => {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    list_type: '',
    priority: '',
    is_archived: false,
    category: ''
  });
  const [sortBy, setSortBy] = useState('-updated_at');
  const [selectedItems, setSelectedItems] = useState(new Set());

  // Fetch lists with filters and pagination
  const fetchLists = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page.toString(),
        ordering: sortBy,
        ...filters
      };
      
      const data = await listsAPI.fetchLists(params);
      setLists(data.results || data);
      return data;
    } catch (err) {
      setError('Failed to fetch lists');
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to load lists';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy]);

  // Create new list
  const createList = useCallback(async (listData) => {
    try {
      const cleanedData = {
        name: listData.name?.trim(),
        description: listData.description?.trim() || '',
        list_type: listData.list_type || 'checklist',
        priority: listData.priority || 'medium',
        category: listData.category || 'general'
      };
      
      const newList = await listsAPI.createList(cleanedData);
      setLists(prev => [newList, ...prev]);
      return newList;
    } catch (err) {
      let errorMsg = 'Failed to create list';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else {
          const errors = Object.entries(err.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMsg = `Validation error: ${errors}`;
        }
      }
      
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Update list
  const updateList = useCallback(async (listId, updateData) => {
    try {
      const updatedList = await listsAPI.updateList(listId, updateData);
      
      setLists(prev => prev.map(list => 
        list.id === listId ? { ...list, ...updatedList } : list
      ));
      
      if (selectedList?.id === listId) {
        setSelectedList(prev => ({ ...prev, ...updatedList }));
      }
      
      return updatedList;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update list';
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList]);

  // Delete list (archive)
  const deleteList = useCallback(async (listId) => {
    try {
      await listsAPI.deleteList(listId);
      
      setLists(prev => prev.filter(list => list.id !== listId));
      
      if (selectedList?.id === listId) {
        setSelectedList(null);
      }
      
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete list';
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList]);

  // Duplicate list
  const duplicateList = useCallback(async (listId, newName) => {
    try {
      const duplicatedList = await listsAPI.duplicateList(listId, newName);
      setLists(prev => [duplicatedList, ...prev]);
      return duplicatedList;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to duplicate list';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Fetch single list with items
  const fetchListDetails = useCallback(async (listId) => {
    if (!listId) return null;
    
    try {
      const listData = await listsAPI.fetchListDetails(listId);
      
      setSelectedList(prev => {
        if (prev?.id === listId) {
          return { ...prev, ...listData };
        }
        return listData;
      });
      
      setLists(prev => prev.map(list => 
        list.id === listId ? { ...list, ...listData } : list
      ));
      
      return listData;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch list details';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Add items using AI parsing
  const addItemsWithAI = useCallback(async (listId, text) => {
    try {
      const { list: updatedList, status: statusMessage } = await listsAPI.addItemsWithAI(listId, text);

      if (!updatedList) {
        toast.error('API did not return the updated list as expected.');
        throw new Error('API did not return the updated list as expected.');
      }

      setLists(prev => 
        prev.map(list => (list.id === listId ? { ...list, ...updatedList } : list))
      );
      
      if (selectedList?.id === listId) {
        setSelectedList(prev => ({ ...prev, ...updatedList }));
      }
      
      toast.success(statusMessage || 'Items added successfully!');
      return updatedList;

    } catch (err) {
      let errorMsg = 'Failed to add items.';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.response?.status === 500) {
        errorMsg = 'Server error: The AI service might be unavailable.';
      } else if (err.response?.status === 404) {
        errorMsg = 'The requested list was not found.';
      }
      
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList]);

  // Create item manually
  const createItem = useCallback(async (listId, itemData) => {
    try {
      const newItem = await listsAPI.createItem(listId, itemData);
      
      if (selectedList?.id === listId) {
        setSelectedList(prev => ({
          ...prev,
          items: [...(prev.items || []), newItem]
        }));
      }
      
      setLists(prev => prev.map(list => 
        list.id === listId 
          ? { ...list, items: [...(list.items || []), newItem] }
          : list
      ));
      
      return newItem;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to add item';
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList]);

  // Update item with proper error handling and rollback
  const updateItem = useCallback(async (itemId, updateData) => {
    if (!selectedList?.items) {
      throw new Error('No list selected or items not loaded');
    }

    const originalItem = selectedList.items.find(item => item.id === itemId);
    if (!originalItem) {
      throw new Error('Item not found in current list');
    }

    try {
      const updatedItem = await listsAPI.updateItem(itemId, updateData);
      
      setSelectedList(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { ...item, ...updatedItem } : item
        )
      }));
      
      setLists(prev => prev.map(list => 
        list.id === selectedList.id 
          ? { 
              ...list, 
              items: list.items?.map(item => 
                item.id === itemId ? { ...item, ...updatedItem } : item
              ) || [] 
            }
          : list
      ));
      
      return updatedItem;
    } catch (err) {
      // Rollback on error
      setSelectedList(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? originalItem : item
        )
      }));
      
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to update item';
      throw err;
    }
  }, [selectedList]);

  // Delete item
  const deleteItem = useCallback(async (itemId) => {
    if (!selectedList?.items) {
      throw new Error('No list selected or items not loaded');
    }

    const originalItems = selectedList.items;
    
    try {
      // Optimistically update UI first
      setSelectedList(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
      
      setLists(prev => prev.map(list => 
        list.id === selectedList?.id 
          ? { ...list, items: list.items?.filter(item => item.id !== itemId) || [] }
          : list
      ));
      
      await listsAPI.deleteItem(itemId);
      return true;
    } catch (err) {
      // Rollback on error
      setSelectedList(prev => ({
        ...prev,
        items: originalItems
      }));
      
      setLists(prev => prev.map(list => 
        list.id === selectedList?.id 
          ? { ...list, items: originalItems }
          : list
      ));
      
      const errorMsg = err.response?.data?.error || 'Failed to delete item';
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList]);

  // Bulk operations on lists
  const bulkOperations = useCallback(async (operation, listIds, additionalData = {}) => {
    try {
      const data = await listsAPI.bulkOperations(operation, listIds, additionalData);
      await fetchLists();
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Bulk operation failed';
      toast.error(errorMsg);
      throw err;
    }
  }, [fetchLists]);
  
  // Bulk update items
  const bulkUpdateItems = useCallback(async (updates) => {
    try {
      const data = await listsAPI.bulkUpdateItems(updates);
      
      if (selectedList?.items) {
        const updatedItems = selectedList.items.map(item => {
          const update = updates.find(u => u.item_id === item.id);
          return update ? { ...item, ...update.data } : item;
        });
        
        setSelectedList(prev => ({
          ...prev,
          items: updatedItems
        }));
        
        setLists(prev => prev.map(list => 
          list.id === selectedList.id 
            ? { ...list, items: updatedItems }
            : list
        ));
      }
      
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Bulk update failed';
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList]);

  // Toggle item selection
  const toggleItemSelection = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Select all items
  const selectAllItems = useCallback(() => {
    if (selectedList?.items) {
      setSelectedItems(new Set(selectedList.items.map(item => item.id)));
    }
  }, [selectedList]);

  // Clear selections
  const clearSelections = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Export lists
  const exportLists = useCallback(async (listIds, format = 'csv') => {
    try {
      const blob = await listsAPI.exportLists(listIds, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lists_export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Export failed';
      toast.error(errorMsg);
      throw err;
    }
  }, []);


  const selectedItemsCount = selectedItems.size;
  const hasSelectedItems = selectedItemsCount > 0;
  
  // Clear selected items when lists change
  useEffect(() => {
    setSelectedItems(new Set());
  }, [lists]);

  // Statistics
  const stats = useMemo(() => {
    if (!lists || lists.length === 0) return {
      total: 0,
      active: 0,
      completed: 0,
      shared: 0,
      favorites: 0
    };
    
    return {
      total: lists.length,
      active: lists.filter(list => (list.completion_percentage || 0) < 100).length,
      completed: lists.filter(list => (list.completion_percentage || 0) === 100).length,
      shared: lists.filter(list => list.is_shared).length,
      favorites: lists.filter(list => list.is_favorite).length
    };
  }, [lists]);


  return {
    // State
    lists,
    selectedList,
    loading,
    error,
    filters,
    sortBy,
    selectedItems,
    selectedItemsCount,
    hasSelectedItems,
    stats,
    
    // Actions
    fetchLists,
    createList,
    updateList,
    deleteList,
    duplicateList,
    fetchListDetails,
    addItemsWithAI,
    createItem,
    updateItem,
    deleteItem,
    bulkOperations,
    bulkUpdateItems,
    exportLists,
    
    // Selection management
    toggleItemSelection,
    selectAllItems,
    clearSelections,
    
    // Filters and sorting
    setFilters,
    setSortBy,
    setSelectedList,
    setError
  };
};
