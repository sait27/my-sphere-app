import { useState, useCallback } from 'react';

export const useOptimisticUpdates = (initialData = []) => {
  const [data, setData] = useState(initialData);
  const [pendingOperations, setPendingOperations] = useState(new Set());

  const optimisticAdd = useCallback(async (item, apiCall) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticItem = { ...item, id: tempId, _pending: true };
    
    setData(prev => [optimisticItem, ...prev]);
    setPendingOperations(prev => new Set([...prev, tempId]));

    try {
      const result = await apiCall(item);
      setData(prev => prev.map(i => i.id === tempId ? result : i));
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
      return result;
    } catch (error) {
      setData(prev => prev.filter(i => i.id !== tempId));
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
      throw error;
    }
  }, []);

  const optimisticUpdate = useCallback(async (id, updates, apiCall) => {
    const originalItem = data.find(item => item.id === id);
    if (!originalItem) return;

    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates, _pending: true } : item
    ));
    setPendingOperations(prev => new Set([...prev, id]));

    try {
      const result = await apiCall(id, updates);
      setData(prev => prev.map(item => item.id === id ? result : item));
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      return result;
    } catch (error) {
      setData(prev => prev.map(item => item.id === id ? originalItem : item));
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      throw error;
    }
  }, [data]);

  const optimisticDelete = useCallback(async (id, apiCall) => {
    const originalItem = data.find(item => item.id === id);
    if (!originalItem) return;

    setData(prev => prev.filter(item => item.id !== id));
    setPendingOperations(prev => new Set([...prev, id]));

    try {
      await apiCall(id);
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      setData(prev => [originalItem, ...prev]);
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      throw error;
    }
  }, [data]);

  const setDataWrapper = useCallback((newData) => {
    setData(newData);
  }, []);

  return {
    data,
    setData: setDataWrapper,
    pendingOperations,
    optimisticAdd,
    optimisticUpdate,
    optimisticDelete
  };
};