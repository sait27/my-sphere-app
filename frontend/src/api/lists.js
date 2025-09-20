import apiClient from './axiosConfig';

// Lists API functions
export const listsAPI = {
  // Fetch lists with filters and pagination
  fetchLists: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all' && value !== false) {
        queryParams.append(key, value);
      }
    });

    const response = await apiClient.get(`/lists/?${queryParams}`);
    return response.data;
  },

  // Create new list
  createList: async (listData) => {
    const response = await apiClient.post('/lists/', listData);
    return response.data;
  },

  // Update list
  updateList: async (listId, updateData) => {
    const response = await apiClient.patch(`/lists/${listId}/`, updateData);
    return response.data;
  },

  // Delete list
  deleteList: async (listId) => {
    const response = await apiClient.delete(`/lists/${listId}/`);
    return response.data;
  },

  // Duplicate list
  duplicateList: async (listId, newName) => {
    const response = await apiClient.post(`/lists/${listId}/duplicate/`, { name: newName });
    return response.data;
  },

  // Fetch single list with items
  fetchListDetails: async (listId) => {
    const response = await apiClient.get(`/lists/${listId}/`);
    return response.data;
  },

  // Add items using AI parsing
  addItemsWithAI: async (listId, text) => {
    const response = await apiClient.post(`/lists/${listId}/add_items/`, { text });
    return response.data;
  },

  // Create item manually
  createItem: async (listId, itemData) => {
    const response = await apiClient.post(`/lists/${listId}/create_item/`, itemData);
    return response.data;
  },

  // Update item
  updateItem: async (itemId, updateData) => {
    const response = await apiClient.patch(`/lists/items/${itemId}/`, updateData);
    return response.data;
  },

  // Delete item
  deleteItem: async (itemId) => {
    const response = await apiClient.delete(`/lists/items/${itemId}/`);
    return response.data;
  },

  // Bulk operations on lists
  bulkOperations: async (operation, listIds, additionalData = {}) => {
    const response = await apiClient.post('/lists/bulk-operations/', {
      operation,
      list_ids: Array.from(listIds),
      ...additionalData
    });
    return response.data;
  },

  // Bulk update items
  bulkUpdateItems: async (updates) => {
    const response = await apiClient.post('/lists/items/bulk-update/', { updates });
    return response.data;
  },

  // Export lists
  exportLists: async (listIds, format = 'csv') => {
    const response = await apiClient.post('/lists/export/', {
      list_ids: listIds,
      format
    }, {
      responseType: 'blob'
    });
    return response.data;
  }
};