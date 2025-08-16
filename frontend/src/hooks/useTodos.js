import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import { toast } from 'react-hot-toast';

export const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todosResponse, goalsResponse] = await Promise.all([
        apiClient.get('/api/v1/todos/tasks/'),
        apiClient.get('/api/v1/todos/goals/')
      ]);
      setTodos(todosResponse.data);
      setGoals(goalsResponse.data);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError('Failed to load tasks');
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTodo = useCallback(async (todoData) => {
    try {
      const response = await apiClient.post('/api/v1/todos/tasks/', todoData);
      setTodos(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error creating todo:', err);
      throw new Error('Failed to create task');
    }
  }, []);

  const updateTodo = useCallback(async (id, updates) => {
    try {
      const response = await apiClient.patch(`/api/v1/todos/tasks/${id}/`, updates);
      setTodos(prev => prev.map(todo => 
        todo.id === id ? { ...todo, ...response.data } : todo
      ));
      return response.data;
    } catch (err) {
      console.error('Error updating todo:', err);
      throw new Error('Failed to update task');
    }
  }, []);

  const deleteTodo = useCallback(async (id) => {
    try {
      await apiClient.delete(`/api/v1/todos/tasks/${id}/`);
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
      throw new Error('Failed to delete task');
    }
  }, []);

  const toggleComplete = useCallback(async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const response = await apiClient.patch(`/api/v1/todos/tasks/${id}/`, {
        is_completed: !todo.is_completed,
        completed_at: !todo.is_completed ? new Date().toISOString() : null
      });
      
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, ...response.data } : t
      ));
      
      toast.success(
        !todo.is_completed ? 'Task completed!' : 'Task marked as incomplete'
      );
    } catch (err) {
      console.error('Error toggling todo completion:', err);
      throw new Error('Failed to update task status');
    }
  }, [todos]);

  const createGoal = useCallback(async (goalData) => {
    try {
      const response = await apiClient.post('/api/v1/todos/goals/', goalData);
      setGoals(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error creating goal:', err);
      throw new Error('Failed to create goal');
    }
  }, []);

  const updateGoal = useCallback(async (id, updates) => {
    try {
      const response = await apiClient.patch(`/api/v1/todos/goals/${id}/`, updates);
      setGoals(prev => prev.map(goal => 
        goal.id === id ? { ...goal, ...response.data } : goal
      ));
      return response.data;
    } catch (err) {
      console.error('Error updating goal:', err);
      throw new Error('Failed to update goal');
    }
  }, []);

  const deleteGoal = useCallback(async (id) => {
    try {
      await apiClient.delete(`/api/v1/todos/goals/${id}/`);
      setGoals(prev => prev.filter(goal => goal.id !== id));
    } catch (err) {
      console.error('Error deleting goal:', err);
      throw new Error('Failed to delete goal');
    }
  }, []);

  const getTasksByGoal = useCallback((goalId) => {
    return todos.filter(todo => todo.goal === goalId);
  }, [todos]);

  const getCompletionStats = useCallback(() => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.is_completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      completionRate
    };
  }, [todos]);

  const getPriorityStats = useCallback(() => {
    const stats = {
      high: todos.filter(todo => todo.priority === 'high' && !todo.is_completed).length,
      medium: todos.filter(todo => todo.priority === 'medium' && !todo.is_completed).length,
      low: todos.filter(todo => todo.priority === 'low' && !todo.is_completed).length
    };
    return stats;
  }, [todos]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return todos.filter(todo => 
      !todo.is_completed && 
      todo.due_date && 
      new Date(todo.due_date) < now
    );
  }, [todos]);

  const getUpcomingTasks = useCallback((days = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return todos.filter(todo => 
      !todo.is_completed && 
      todo.due_date && 
      new Date(todo.due_date) >= now &&
      new Date(todo.due_date) <= futureDate
    );
  }, [todos]);

  return {
    todos,
    goals,
    loading,
    error,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    createGoal,
    updateGoal,
    deleteGoal,
    getTasksByGoal,
    getCompletionStats,
    getPriorityStats,
    getOverdueTasks,
    getUpcomingTasks
  };
};
