import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

export const useListTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await apiClient.get(`/lists/templates/?${params}`);
      setTemplates(response.data.results || response.data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createListFromTemplate = useCallback(async (templateId, listData) => {
    try {
      const response = await apiClient.post(`/lists/templates/${templateId}/create/`, listData);
      return response.data;
    } catch (err) {
      console.error('Failed to create list from template:', err);
      throw err;
    }
  }, []);

  const createTemplate = useCallback(async (templateData) => {
    try {
      const response = await apiClient.post('/lists/templates/', templateData);
      setTemplates(prev => [response.data, ...prev]);
      toast.success('Template created successfully!');
      return response.data;
    } catch (err) {
      console.error('Failed to create template:', err);
      toast.error('Failed to create template');
      throw err;
    }
  }, []);

  const updateTemplate = useCallback(async (templateId, updates) => {
    try {
      const response = await apiClient.patch(`/lists/templates/${templateId}/`, updates);
      setTemplates(prev => prev.map(t => t.id === templateId ? response.data : t));
      return response.data;
    } catch (err) {
      console.error('Failed to update template:', err);
      throw err;
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId) => {
    try {
      await apiClient.delete(`/lists/templates/${templateId}/`);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template deleted');
    } catch (err) {
      console.error('Failed to delete template:', err);
      toast.error('Failed to delete template');
      throw err;
    }
  }, []);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createListFromTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
};