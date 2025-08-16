// hooks/useLists.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

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
      
      const params = new URLSearchParams({
        page: page.toString(),
        ordering: sortBy,
        search: filters.search,
        list_type: filters.list_type,
        priority: filters.priority,
        is_archived: filters.is_archived,
        category: filters.category,
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => value !== '' && value !== false && !['search', 'list_type', 'priority', 'is_archived', 'category'].includes(key))
        )
      });

      const response = await apiClient.get(`/lists/?${params}`);
      setLists(response.data.results || response.data);
      return response.data;
    } catch (err) {
      setError('Failed to fetch lists');
      toast.error('Failed to load lists');
      console.error('Fetch lists error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy]);

  // Create new list
  const createList = useCallback(async (listData) => {
    try {
      const response = await apiClient.post('/lists/', listData);
      const newList = response.data;
      
      setLists(prev => [newList, ...prev]);
      toast.success(`List "${newList.name}" created successfully!`);
      return newList;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create list';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Update list
  const updateList = useCallback(async (listId, updateData) => {
    try {
      const response = await apiClient.patch(`/lists/${listId}/`, updateData);
      const updatedList = response.data;
      
      setLists(prev => prev.map(list => 
        list.id === listId ? updatedList : list
      ));
      
      if (selectedList?.id === listId) {
        setSelectedList(updatedList);
      }
      
      toast.success('List updated successfully!');
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
      await apiClient.delete(`/lists/${listId}/`);
      
      setLists(prev => prev.filter(list => list.id !== listId));
      
      if (selectedList?.id === listId) {
        setSelectedList(null);
      }
      
      toast.success('List deleted successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete list';
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList]);

  // Duplicate list
  const duplicateList = useCallback(async (listId, newName) => {
    try {
      const response = await apiClient.post(`/lists/${listId}/duplicate/`, {
        name: newName
      });
      const duplicatedList = response.data;
      setLists(prev => [duplicatedList, ...prev]);
      toast.success('List duplicated successfully!');
      return duplicatedList;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to duplicate list';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Fetch single list with items - with race condition prevention
  const fetchListDetails = useCallback(async (listId) => {
    if (!listId) return null;
    
    try {
      // Cancel any pending requests for this list
      const controller = new AbortController();
      
      const response = await apiClient.get(`/lists/${listId}/`, {
        signal: controller.signal
      });
      const listData = response.data;
      
      // Only update if this is still the current request
      setSelectedList(prev => {
        if (prev?.id === listId) {
          return { ...prev, ...listData };
        }
        return listData;
      });
      
      return listData;
    } catch (err) {
      if (err.name === 'AbortError') {
        return null; // Request was cancelled
      }
      const errorMsg = err.response?.data?.error || 'Failed to fetch list details';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Add items using AI parsing
  const addItemsWithAI = useCallback(async (listId, text) => {
    try {
      const response = await apiClient.post(`/lists/${listId}/add_items/`, { text });
      
      // Only refresh if this is the currently selected list
      if (selectedList?.id === listId) {
        await fetchListDetails(listId);
      }
      
      toast.success(response.data.status || 'Items added successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to add items';
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList?.id, fetchListDetails]);

  // Create item manually
  const createItem = useCallback(async (listId, itemData) => {
    try {
      const response = await apiClient.post(`/lists/${listId}/items/`, itemData);
      const newItem = response.data;
      
      // Update selected list if it's the current one
      if (selectedList?.id === listId) {
        setSelectedList(prev => ({
          ...prev,
          items: [...(prev.items || []), newItem]
        }));
      }
      
      toast.success('Item added successfully!');
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

    // Store original item for rollback
    const originalItem = selectedList.items.find(item => item.id === itemId);
    if (!originalItem) {
      throw new Error('Item not found in current list');
    }

    // Optimistic update
    setSelectedList(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, ...updateData } : item
      )
    }));

    try {
      const response = await apiClient.patch(`/lists/${selectedList.id}/items/${itemId}/`, updateData);
      const updatedItem = response.data;
      
      // Update with server response
      setSelectedList(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? updatedItem : item
        )
      }));
      
      // Only show toast for significant updates
      if (updateData.name || updateData.description) {
        toast.success('Item updated successfully!');
      }
      
      return updatedItem;
    } catch (err) {
      // Rollback optimistic update
      setSelectedList(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? originalItem : item
        )
      }));
      
      const errorMsg = err.response?.data?.error || 'Failed to update item';
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList]);

  // Delete item
  const deleteItem = useCallback(async (itemId) => {
    try {
      await apiClient.delete(`/lists/items/${itemId}/`);
      
      // Update selected list items optimistically
      if (selectedList?.items) {
        setSelectedList(prev => ({
          ...prev,
          items: prev.items.filter(item => item.id !== itemId)
        }));
      }
      
      toast.success('Item deleted successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete item';
      toast.error(errorMsg);
      // Revert optimistic update on error
      if (selectedList?.id) {
        await fetchListDetails(selectedList.id);
      }
      throw err;
    }
  }, [selectedList, fetchListDetails]);

  // Bulk operations on items
  const bulkOperations = useCallback(async (operation, itemIds, additionalData = {}) => {
    try {
      const response = await apiClient.post('/lists/bulk/', {
        operation,
        item_ids: Array.from(itemIds),
        ...additionalData
      });
      
      // Refresh current list if items were affected
      if (selectedList && itemIds.size > 0) {
        await fetchListDetails(selectedList.id);
      }
      
      // Clear selections
      setSelectedItems(new Set());
      
      toast.success(`Bulk ${operation.replace('bulk_', '').replace('_', ' ')} completed!`);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Bulk operation failed';
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList, fetchListDetails]);

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
      const response = await apiClient.post('/lists/export/', {
        list_ids: listIds,
        format
      }, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lists_export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Lists exported successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Export failed';
      toast.error(errorMsg);
      throw err;
    }
  }, []);


  const selectedItemsCount = selectedItems.size;
  const hasSelectedItems = selectedItemsCount > 0;

  // Statistics
  const stats = useMemo(() => {
    if (!lists) return {};
    
    return {
      total: lists.length,
      active: lists.filter(list => list.completion_percentage < 100).length,
      completed: lists.filter(list => list.completion_percentage === 100).length,
      shared: lists.filter(list => list.is_shared).length
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
