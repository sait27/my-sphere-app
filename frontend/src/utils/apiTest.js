// utils/apiTest.js - Simple API test utility

import apiClient from '../api/axiosConfig';

export const testItemUpdate = async (itemId, updateData) => {
  try {
    console.log('Testing item update...');
    console.log('Item ID:', itemId);
    console.log('Update data:', updateData);
    console.log('Full URL:', `${apiClient.defaults.baseURL}/lists/items/${itemId}/`);
    
    const response = await apiClient.patch(`/lists/items/${itemId}/`, updateData);
    console.log('Success response:', response);
    return response.data;
  } catch (error) {
    console.error('API Test Error:', error);
    console.error('Error response:', error.response);
    console.error('Error config:', error.config);
    throw error;
  }
};

export const testListFetch = async (listId) => {
  try {
    console.log('Testing list fetch...');
    console.log('List ID:', listId);
    console.log('Full URL:', `${apiClient.defaults.baseURL}/lists/${listId}/`);
    
    const response = await apiClient.get(`/lists/${listId}/`);
    console.log('List fetch success:', response);
    return response.data;
  } catch (error) {
    console.error('List fetch error:', error);
    throw error;
  }
};