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
      console.log('useLists: fetchLists called with page:', page);
      setLoading(true);
      setError(null);
      
      console.log('useLists: Fetching lists with filters:', { filters, sortBy, page });
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('ordering', sortBy);
      
      // Add filters only if they have values
      if (filters.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters.list_type && filters.list_type !== 'all') {
        params.append('list_type', filters.list_type);
      }
      if (filters.priority && filters.priority !== 'all') {
        params.append('priority', filters.priority);
      }
      if (filters.is_archived !== undefined && filters.is_archived !== false) {
        params.append('is_archived', filters.is_archived);
      }
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      
      // Add any other filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 'all' && value !== false && 
            !['search', 'list_type', 'priority', 'is_archived', 'category'].includes(key)) {
          params.append(key, value);
        }
      });

      console.log('useLists: API request params:', params.toString());
      console.log('useLists: Making API call to:', `/lists/?${params}`);
      
      const response = await apiClient.get(`/lists/?${params}`);
      console.log('useLists: API response received:', response);
      console.log('useLists: Lists fetched:', response.data);
      
      setLists(response.data.results || response.data);
      return response.data;
    } catch (err) {
      console.error('useLists: Fetch lists error:', err);
      console.error('useLists: Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
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
      const response = await apiClient.get(`/lists/${listId}/`);
      const listData = response.data;
      
      // Only update if this is still the most recent request for this list
      setSelectedList(prev => {
        // If we already have this list and it's the same ID, merge the data
        if (prev?.id === listId) {
          return { ...prev, ...listData };
        }
        return listData;
      });
      
      return listData;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch list details';
      console.error('Fetch list details error:', err);
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Add items using AI parsing
  const addItemsWithAI = useCallback(async (listId, text) => {
    try {
      console.log('Sending AI parsing request:', { listId, text });
      const response = await apiClient.post(`/lists/${listId}/add_items/`, { text });
      const { list: updatedList, status: statusMessage } = response.data;
      console.log('AI parsing response:', response.data);

      if (!updatedList) {
        toast.error('API did not return the updated list as expected.');
        throw new Error('API did not return the updated list as expected.');
      }

      // Update the main lists array with the new data.
      setLists(prev => 
        prev.map(list => (list.id === listId ? updatedList : list))
      );
      
      // Also update the selectedList if it's the one being modified
      if (selectedList?.id === listId) {
        setSelectedList(updatedList);
      }
      
      toast.success(statusMessage || 'Items added successfully!');
      return updatedList; // Return the full updated list

    } catch (err) {
      console.error('addItemsWithAI error:', err);
      const errorDetails = {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      };
      console.error('Error details:', errorDetails);
      
      let errorMsg = 'Failed to add items.';
      if (errorDetails.data?.error) {
        errorMsg = errorDetails.data.error;
      } else if (errorDetails.data?.detail) {
        errorMsg = errorDetails.data.detail;
      } else if (errorDetails.status === 500) {
        errorMsg = 'Server error: The AI service might be unavailable.';
      } else if (errorDetails.status === 404) {
        errorMsg = 'The requested list was not found.';
      }
      
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList]);

  // Create item manually
  const createItem = useCallback(async (listId, itemData) => {
    try {
      const response = await apiClient.post(`/lists/${listId}/create_item/`, itemData);
      const newItem = response.data;
      
      // Update selected list if it's the current one
      if (selectedList?.id === listId) {
        setSelectedList(prev => ({
          ...prev,
          items: [...(prev.items || []), newItem]
        }));
      }
      
      // Also update the lists array to reflect changes
      setLists(prev => prev.map(list => 
        list.id === listId 
          ? { ...list, items: [...(list.items || []), newItem] }
          : list
      ));
      
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

    try {
      const response = await apiClient.patch(`/lists/items/${itemId}/`, updateData);
      const updatedItem = response.data;
      
      // Update selectedList state
      setSelectedList(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? updatedItem : item
        )
      }));
      
      // Update lists array as well
      setLists(prev => prev.map(list => 
        list.id === selectedList.id 
          ? { ...list, items: list.items?.map(item => item.id === itemId ? updatedItem : item) || [] }
          : list
      ));
      
      // Only show toast for significant updates
      if (updateData.name || updateData.description) {
        toast.success('Item updated successfully!');
      }
      
      return updatedItem;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update item';
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList]);

  // Delete item
  const deleteItem = useCallback(async (itemId) => {
    try {
      await apiClient.delete(`/lists/items/${itemId}/`);
      
      // Update selected list items
      if (selectedList?.items) {
        setSelectedList(prev => ({
          ...prev,
          items: prev.items.filter(item => item.id !== itemId)
        }));
      }
      
      // Update lists array as well
      setLists(prev => prev.map(list => 
        list.id === selectedList?.id 
          ? { ...list, items: list.items?.filter(item => item.id !== itemId) || [] }
          : list
      ));
      
      // Don't show toast here - let the component handle it
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete item';
      toast.error(errorMsg);
      throw err;
    }
  }, [selectedList]);

  // Bulk operations on lists
  const bulkOperations = useCallback(async (operation, listIds, additionalData = {}) => {
    try {
      const response = await apiClient.post('/lists/bulk-operations/', {
        operation,
        list_ids: Array.from(listIds),
        ...additionalData
      });
      
      // Refresh lists after bulk operation
      await fetchLists();
      
      // Clear selections
      setSelectedItems(new Set());
      
      toast.success(`Bulk ${operation.replace('bulk_', '').replace('_', ' ')} completed!`);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Bulk operation failed';
      toast.error(errorMsg);
      throw err;
    }
  }, [fetchLists]);

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
