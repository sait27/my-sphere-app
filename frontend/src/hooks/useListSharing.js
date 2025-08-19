// hooks/useListSharing.js

import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

export const useListSharing = () => {
  const [sharedLists, setSharedLists] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch lists shared by the current user
  const fetchMySharedLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching lists shared by me');
      const response = await apiClient.get('/lists/sharing/my_shared_lists/');
      console.log('My shared lists response:', response.data);
      
      setSharedLists(response.data);
      return response.data;
    } catch (err) {
      console.error('Fetch shared lists error:', err);
      setError('Failed to fetch shared lists');
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to load shared lists';
      toast.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch lists shared with the current user
  const fetchSharedWithMe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching lists shared with me');
      const response = await apiClient.get('/lists/sharing/shared_with_me/');
      console.log('Shared with me response:', response.data);
      
      setSharedWithMe(response.data);
      return response.data;
    } catch (err) {
      console.error('Fetch shared with me error:', err);
      setError('Failed to fetch lists shared with you');
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to load lists shared with you';
      toast.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Share a list with another user
  const shareList = useCallback(async (listId, email, permission = 'view') => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Sharing list:', { listId, email, permission });
      const response = await apiClient.post(`/lists/sharing/${listId}/share/`, {
        user_email: email,
        permission
      });
      
      console.log('Share list response:', response.data);
      toast.success(`List shared with ${email} successfully!`);
      
      // Refresh the shared lists
      await fetchMySharedLists();
      
      return response.data;
    } catch (err) {
      console.error('Share list error:', err);
      setError('Failed to share list');
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to share list';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMySharedLists]);

  // Remove sharing for a list
  const removeSharing = useCallback(async (sharingId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Removing sharing:', sharingId);
      const list = sharedLists.find(share => share.id === sharingId)?.list?.id;
      if (!list) {
        throw new Error('Cannot find list ID for the share');
      }
      await apiClient.delete(`/lists/sharing/${list}/share/${sharingId}/`);
      
      toast.success('Sharing removed successfully!');
      
      // Refresh the shared lists
      await fetchMySharedLists();
      
      return true;
    } catch (err) {
      console.error('Remove sharing error:', err);
      setError('Failed to remove sharing');
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to remove sharing';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMySharedLists]);

  // Update sharing permissions
  const updateSharing = useCallback(async (sharingId, permission) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Updating sharing:', { sharingId, permission });
      const list = sharedLists.find(share => share.id === sharingId)?.list?.id;
      if (!list) {
        throw new Error('Cannot find list ID for the share');
      }
      const response = await apiClient.patch(`/lists/sharing/${list}/share/${sharingId}/`, {
        permission
      });
      
      console.log('Update sharing response:', response.data);
      toast.success('Sharing permissions updated successfully!');
      
      // Refresh the shared lists
      await fetchMySharedLists();
      
      return response.data;
    } catch (err) {
      console.error('Update sharing error:', err);
      setError('Failed to update sharing permissions');
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to update sharing permissions';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMySharedLists]);

  return {
    sharedLists,
    sharedWithMe,
    loading,
    error,
    fetchMySharedLists,
    fetchSharedWithMe,
    shareList,
    removeSharing,
    updateSharing
  };
};