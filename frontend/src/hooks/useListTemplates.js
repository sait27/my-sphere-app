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
      const response = await apiClient.get('/lists/templates/');
      setTemplates(response.data.results || response.data);
    } catch (err) {
      setError('Failed to fetch templates');
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (templateData) => {
    try {
      const response = await apiClient.post('/lists/templates/', templateData);
      setTemplates(prev => [response.data, ...prev]);
      toast.success('Template created successfully!');
      return response.data;
    } catch (error) {
      toast.error('Failed to create template');
      throw error;
    }
  };

  const createListFromTemplate = async (templateId, listName) => {
    try {
      const response = await apiClient.post(`/lists/templates/${templateId}/create/`, {
        name: listName,
      });
      toast.success(`List "${listName}" created from template!`);
      return response.data;
    } catch (error) {
      toast.error('Failed to create list from template');
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
    createListFromTemplate,
  };
};
