// hooks/useListTemplates.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

export const useListTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
  });

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching templates...');
      const response = await apiClient.get('/lists/templates/');
      console.log('Templates fetched:', response.data);
      setTemplates(response.data.results || response.data);
    } catch (err) {
      console.error('Fetch templates error:', err);
      setError('Failed to fetch templates');
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to load templates';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (templateData) => {
    try {
      console.log('Creating template:', templateData);
      const response = await apiClient.post('/lists/templates/', templateData);
      console.log('Template created:', response.data);
      setTemplates(prev => [response.data, ...prev]);
      toast.success('Template created successfully!');
      return response.data;
    } catch (error) {
      console.error('Create template error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to create template';
      toast.error(errorMsg);
      throw error;
    }
  };

  const createListFromTemplate = async (templateId, listName) => {
    try {
      console.log('Creating list from template:', { templateId, listName });
      const response = await apiClient.post(`/lists/templates/${templateId}/create/`, {
        name: listName,
      });
      console.log('List created from template:', response.data);
      toast.success(`List "${listName}" created from template!`);
      return response.data;
    } catch (error) {
      console.error('Template creation error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to create list from template';
      toast.error(errorMsg);
      throw error;
    }
  };

  const updateTemplate = async (templateId, updateData) => {
    try {
      console.log('Updating template:', { templateId, updateData });
      const response = await apiClient.patch(`/lists/templates/${templateId}/`, updateData);
      console.log('Template updated:', response.data);
      setTemplates(prev => prev.map(template => 
        template.id === templateId ? response.data : template
      ));
      toast.success('Template updated successfully!');
      return response.data;
    } catch (error) {
      console.error('Update template error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to update template';
      toast.error(errorMsg);
      throw error;
    }
  };

  const deleteTemplate = async (templateId) => {
    try {
      console.log('Deleting template:', templateId);
      await apiClient.delete(`/lists/templates/${templateId}/`);
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      toast.success('Template deleted successfully!');
    } catch (error) {
      console.error('Delete template error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to delete template';
      toast.error(errorMsg);
      throw error;
    }
  };

  const createTemplateFromList = async (listId, templateData) => {
    try {
      console.log('Creating template from list:', { listId, templateData });
      const response = await apiClient.post('/lists/templates/create_from_list/', {
        list_id: listId,
        ...templateData
      });
      console.log('Template created from list:', response.data);
      setTemplates(prev => [response.data, ...prev]);
      toast.success('Template created from list successfully!');
      return response.data;
    } catch (error) {
      console.error('Create template from list error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to create template from list';
      toast.error(errorMsg);
      throw error;
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = 
        template.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (template.description || '').toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = filters.category === 'all' || template.category === filters.category;
      return matchesSearch && matchesCategory;
    });
  }, [templates, filters]);

  return {
    templates,
    loading,
    error,
    filters,
    setFilters,
    filteredTemplates,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createListFromTemplate,
    createTemplateFromList,
  };
};
