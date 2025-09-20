import { useState, useCallback } from 'react';
import { todosAPI } from '../api/todos';
import { toast } from 'react-hot-toast';

export const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tags, setTags] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTodos = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const [todosRes, goalsRes, tagsRes, templatesRes, insightsRes] = await Promise.all([
        todosAPI.tasks.list(params),
        todosAPI.goals.list(),
        todosAPI.tags.list(),
        todosAPI.templates.list(),
        todosAPI.insights.list()
      ]);
      setTodos(todosRes.data);
      setGoals(goalsRes.data);
      setTags(tagsRes.data);
      setTemplates(templatesRes.data);
      setInsights(insightsRes.data);
    } catch (err) {
      setError('Failed to fetch todos');
      toast.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTodo = useCallback(async (data) => {
    try {
      const response = await todosAPI.tasks.create(data);
      setTodos(prev => [response.data, ...prev]);
      toast.success('Task created successfully');
      return response.data;
    } catch (err) {
      toast.error('Failed to create task');
      throw err;
    }
  }, []);

  const updateTodo = useCallback(async (id, data) => {
    try {
      const response = await todosAPI.tasks.update(id, data);
      setTodos(prev => prev.map(todo => todo.id === id ? response.data : todo));
      toast.success('Task updated');
      return response.data;
    } catch (err) {
      toast.error('Failed to update task');
      throw err;
    }
  }, []);

  const deleteTodo = useCallback(async (id) => {
    try {
      await todosAPI.tasks.delete(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
      throw err;
    }
  }, []);

  const createGoal = useCallback(async (data) => {
    try {
      const response = await todosAPI.goals.create(data);
      setGoals(prev => [response.data, ...prev]);
      toast.success('Goal created');
      return response.data;
    } catch (err) {
      toast.error('Failed to create goal');
      throw err;
    }
  }, []);

  const getDashboardStats = useCallback(async () => {
    try {
      return await todosAPI.tasks.dashboardStats();
    } catch (err) {
      toast.error('Failed to fetch stats');
      throw err;
    }
  }, []);

  const getAdvancedDashboard = useCallback(async () => {
    try {
      return await todosAPI.tasks.advancedDashboard();
    } catch (err) {
      toast.error('Failed to fetch analytics');
      throw err;
    }
  }, []);

  const createFromNaturalLanguage = useCallback(async (text) => {
    try {
      const response = await todosAPI.tasks.createFromNaturalLanguage(text);
      setTodos(prev => [response.data, ...prev]);
      toast.success('Smart task created');
      return response.data;
    } catch (err) {
      toast.error('Failed to create smart task');
      throw err;
    }
  }, []);

  return {
    todos,
    goals,
    tags,
    templates,
    insights,
    loading,
    error,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    createGoal,
    getDashboardStats,
    getAdvancedDashboard,
    createFromNaturalLanguage
  };
};