import { useState, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import { toast } from 'react-hot-toast';

export const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tags, setTags] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [recurringTemplates, setRecurringTemplates] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todosResponse, goalsResponse, tagsResponse, templatesResponse, recurringResponse, customFieldsResponse] = await Promise.all([
        apiClient.get('/todos/tasks/'),
        apiClient.get('/todos/goals/'),
        apiClient.get('/todos/tags/'),
        apiClient.get('/todos/templates/'),
        apiClient.get('/todos/recurring-templates/'),
        apiClient.get('/todos/custom-fields/')
      ]);
      setTodos(todosResponse.data);
      setGoals(goalsResponse.data);
      setTags(tagsResponse.data);
      setTemplates(templatesResponse.data);
      setRecurringTemplates(recurringResponse.data);
      setCustomFields(customFieldsResponse.data);
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
      const response = await apiClient.post('/todos/tasks/', todoData);
      setTodos(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error creating todo:', err);
      throw new Error('Failed to create task');
    }
  }, []);

  const updateTodo = useCallback(async (id, updates) => {
    try {
      const response = await apiClient.patch(`/todos/tasks/${id}/`, updates);
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
      await apiClient.delete(`/todos/tasks/${id}/`);
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
      const response = await apiClient.patch(`/todos/tasks/${id}/`, {
        status: todo.status === 'completed' ? 'pending' : 'completed'
      });
      
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, ...response.data } : t
      ));
      
      toast.success(
        response.data.status === 'completed' ? 'Task completed!' : 'Task marked as pending'
      );
    } catch (err) {
      console.error('Error toggling todo completion:', err);
      throw new Error('Failed to update task status');
    }
  }, [todos]);

  const createGoal = useCallback(async (goalData) => {
    try {
      const response = await apiClient.post('/todos/goals/', goalData);
      setGoals(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error creating goal:', err);
      throw new Error('Failed to create goal');
    }
  }, []);

  const updateGoal = useCallback(async (id, updates) => {
    try {
      const response = await apiClient.patch(`/todos/goals/${id}/`, updates);
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
      await apiClient.delete(`/todos/goals/${id}/`);
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
    const completed = todos.filter(todo => todo.status === 'completed').length;
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
      high: todos.filter(todo => todo.priority === 'high' && todo.status !== 'completed').length,
      medium: todos.filter(todo => todo.priority === 'medium' && todo.status !== 'completed').length,
      low: todos.filter(todo => todo.priority === 'low' && todo.status !== 'completed').length,
      urgent: todos.filter(todo => todo.priority === 'urgent' && todo.status !== 'completed').length
    };
    return stats;
  }, [todos]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return todos.filter(todo => 
      todo.status !== 'completed' && 
      todo.due_date && 
      new Date(todo.due_date) < now
    );
  }, [todos]);

  const getUpcomingTasks = useCallback((days = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return todos.filter(todo => 
      todo.status !== 'completed' && 
      todo.due_date && 
      new Date(todo.due_date) >= now &&
      new Date(todo.due_date) <= futureDate
    );
  }, [todos]);

  // Tag Management
  const createTag = useCallback(async (tagData) => {
    try {
      const response = await apiClient.post('/todos/tags/', tagData);
      setTags(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error creating tag:', err);
      throw new Error('Failed to create tag');
    }
  }, []);

  const updateTag = useCallback(async (id, updates) => {
    try {
      const response = await apiClient.patch(`/todos/tags/${id}/`, updates);
      setTags(prev => prev.map(tag => 
        tag.id === id ? { ...tag, ...response.data } : tag
      ));
      return response.data;
    } catch (err) {
      console.error('Error updating tag:', err);
      throw new Error('Failed to update tag');
    }
  }, []);

  const deleteTag = useCallback(async (id) => {
    try {
      await apiClient.delete(`/todos/tags/${id}/`);
      setTags(prev => prev.filter(tag => tag.id !== id));
    } catch (err) {
      console.error('Error deleting tag:', err);
      throw new Error('Failed to delete tag');
    }
  }, []);

  const assignTagToTask = useCallback(async (tagId, taskId) => {
    try {
      const response = await apiClient.post(`/todos/tags/${tagId}/assign_to_task/`, {
        task_id: taskId
      });
      // Refresh the specific task to get updated tag assignments
      const taskResponse = await apiClient.get(`/todos/tasks/${taskId}/`);
      setTodos(prev => prev.map(todo => 
        todo.id === taskId ? taskResponse.data : todo
      ));
      return response.data;
    } catch (err) {
      console.error('Error assigning tag to task:', err);
      throw new Error('Failed to assign tag');
    }
  }, []);

  // Subtask Management
  const createSubtask = useCallback(async (parentTaskId, subtaskData) => {
    try {
      const response = await apiClient.post('/todos/subtasks/', {
        ...subtaskData,
        parent_task: parentTaskId
      });
      // Refresh the parent task to get updated subtasks
      const taskResponse = await apiClient.get(`/todos/tasks/${parentTaskId}/`);
      setTodos(prev => prev.map(todo => 
        todo.id === parentTaskId ? taskResponse.data : todo
      ));
      return response.data;
    } catch (err) {
      console.error('Error creating subtask:', err);
      throw new Error('Failed to create subtask');
    }
  }, []);

  const updateSubtask = useCallback(async (subtaskId, updates) => {
    try {
      const response = await apiClient.patch(`/todos/subtasks/${subtaskId}/`, updates);
      // Find and refresh the parent task
      const parentTask = todos.find(todo => 
        todo.subtasks?.some(sub => sub.id === subtaskId)
      );
      if (parentTask) {
        const taskResponse = await apiClient.get(`/todos/tasks/${parentTask.id}/`);
        setTodos(prev => prev.map(todo => 
          todo.id === parentTask.id ? taskResponse.data : todo
        ));
      }
      return response.data;
    } catch (err) {
      console.error('Error updating subtask:', err);
      throw new Error('Failed to update subtask');
    }
  }, [todos]);

  const toggleSubtaskComplete = useCallback(async (subtaskId) => {
    try {
      const response = await apiClient.post(`/todos/subtasks/${subtaskId}/toggle_complete/`);
      // Find and refresh the parent task
      const parentTask = todos.find(todo => 
        todo.subtasks?.some(sub => sub.id === subtaskId)
      );
      if (parentTask) {
        const taskResponse = await apiClient.get(`/todos/tasks/${parentTask.id}/`);
        setTodos(prev => prev.map(todo => 
          todo.id === parentTask.id ? taskResponse.data : todo
        ));
      }
      return response.data;
    } catch (err) {
      console.error('Error toggling subtask completion:', err);
      throw new Error('Failed to toggle subtask');
    }
  }, [todos]);

  // Time Tracking
  const startTimer = useCallback(async (taskId) => {
    try {
      const response = await apiClient.post('/todos/time-entries/start_timer/', {
        task_id: taskId
      });
      setActiveTimer(response.data);
      toast.success('Timer started!');
      return response.data;
    } catch (err) {
      console.error('Error starting timer:', err);
      throw new Error('Failed to start timer');
    }
  }, []);

  const stopTimer = useCallback(async (timeEntryId) => {
    try {
      const response = await apiClient.post(`/todos/time-entries/${timeEntryId}/stop_timer/`);
      setActiveTimer(null);
      // Refresh the related task to get updated time entries
      const taskResponse = await apiClient.get(`/todos/tasks/${response.data.task}/`);
      setTodos(prev => prev.map(todo => 
        todo.id === response.data.task ? taskResponse.data : todo
      ));
      toast.success(`Timer stopped! Logged ${response.data.duration_hours} hours`);
      return response.data;
    } catch (err) {
      console.error('Error stopping timer:', err);
      throw new Error('Failed to stop timer');
    }
  }, []);

  const addTimeEntry = useCallback(async (taskId, timeData) => {
    try {
      const response = await apiClient.post('/todos/time-entries/', {
        ...timeData,
        task: taskId,
        is_manual_entry: true
      });
      // Refresh the task to get updated time entries
      const taskResponse = await apiClient.get(`/todos/tasks/${taskId}/`);
      setTodos(prev => prev.map(todo => 
        todo.id === taskId ? taskResponse.data : todo
      ));
      return response.data;
    } catch (err) {
      console.error('Error adding time entry:', err);
      throw new Error('Failed to add time entry');
    }
  }, []);

  // Comments
  const addComment = useCallback(async (taskId, content, parentCommentId = null) => {
    try {
      const response = await apiClient.post('/todos/comments/', {
        task: taskId,
        content,
        parent_comment: parentCommentId
      });
      // Refresh the task to get updated comments
      const taskResponse = await apiClient.get(`/todos/tasks/${taskId}/`);
      setTodos(prev => prev.map(todo => 
        todo.id === taskId ? taskResponse.data : todo
      ));
      return response.data;
    } catch (err) {
      console.error('Error adding comment:', err);
      throw new Error('Failed to add comment');
    }
  }, []);

  // Reminders
  const createReminder = useCallback(async (taskId, reminderData) => {
    try {
      const response = await apiClient.post('/todos/reminders/', {
        ...reminderData,
        task: taskId
      });
      // Refresh the task to get updated reminders
      const taskResponse = await apiClient.get(`/todos/tasks/${taskId}/`);
      setTodos(prev => prev.map(todo => 
        todo.id === taskId ? taskResponse.data : todo
      ));
      return response.data;
    } catch (err) {
      console.error('Error creating reminder:', err);
      throw new Error('Failed to create reminder');
    }
  }, []);

  // Templates
  const createTemplate = useCallback(async (templateData) => {
    try {
      const response = await apiClient.post('/todos/templates/', templateData);
      setTemplates(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error creating template:', err);
      throw new Error('Failed to create template');
    }
  }, []);

  const createTaskFromTemplate = useCallback(async (templateId, customData = {}) => {
    try {
      const response = await apiClient.post(`/todos/templates/${templateId}/create_task/`, customData);
      setTodos(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error creating task from template:', err);
      throw new Error('Failed to create task from template');
    }
  }, []);

  // Recurring Tasks
  const createRecurringTemplate = useCallback(async (templateData) => {
    try {
      const response = await apiClient.post('/todos/recurring-templates/', templateData);
      setRecurringTemplates(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error creating recurring template:', err);
      throw new Error('Failed to create recurring template');
    }
  }, []);

  const generateRecurringTasks = useCallback(async (templateId, count = 1) => {
    try {
      const response = await apiClient.post(`/todos/recurring-templates/${templateId}/generate_tasks/`, {
        count
      });
      setTodos(prev => [...response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error generating recurring tasks:', err);
      throw new Error('Failed to generate recurring tasks');
    }
  }, []);

  // File Attachments
  const uploadAttachment = useCallback(async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('task', taskId);
      
      const response = await apiClient.post('/todos/attachments/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh the task to get updated attachments
      const taskResponse = await apiClient.get(`/todos/tasks/${taskId}/`);
      setTodos(prev => prev.map(todo => 
        todo.id === taskId ? taskResponse.data : todo
      ));
      return response.data;
    } catch (err) {
      console.error('Error uploading attachment:', err);
      throw new Error('Failed to upload attachment');
    }
  }, []);

  // Natural Language Processing
  const createTaskFromNaturalLanguage = useCallback(async (text) => {
    try {
      const response = await apiClient.post('/todos/tasks/create_from_natural_language/', {
        text
      });
      setTodos(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error creating task from natural language:', err);
      throw new Error('Failed to create task from description');
    }
  }, []);

  // Advanced Analytics
  const getDashboardStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/todos/tasks/dashboard_stats/');
      return response.data;
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      throw new Error('Failed to fetch dashboard stats');
    }
  }, []);

  const getProductivityInsights = useCallback(() => {
    const completedTasks = todos.filter(todo => todo.status === 'completed');
    const totalTimeSpent = todos.reduce((total, todo) => {
      return total + (todo.total_time_spent || 0);
    }, 0);
    
    const tasksByType = todos.reduce((acc, todo) => {
      acc[todo.task_type] = (acc[todo.task_type] || 0) + 1;
      return acc;
    }, {});
    
    const averageCompletionTime = completedTasks.length > 0 ? 
      completedTasks.reduce((total, todo) => {
        if (todo.created_at && todo.completed_at) {
          const created = new Date(todo.created_at);
          const completed = new Date(todo.completed_at);
          return total + (completed - created) / (1000 * 60 * 60 * 24); // days
        }
        return total;
      }, 0) / completedTasks.length : 0;
    
    return {
      totalTimeSpent,
      tasksByType,
      averageCompletionTime,
      productivityScore: Math.min(100, (completedTasks.length / todos.length) * 100)
    };
  }, [todos]);

  return {
    // Core data
    todos,
    goals,
    tags,
    templates,
    recurringTemplates,
    customFields,
    loading,
    error,
    activeTimer,
    
    // Core CRUD operations
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    
    // Goal management
    createGoal,
    updateGoal,
    deleteGoal,
    getTasksByGoal,
    
    // Tag management
    createTag,
    updateTag,
    deleteTag,
    assignTagToTask,
    
    // Subtask management
    createSubtask,
    updateSubtask,
    toggleSubtaskComplete,
    
    // Time tracking
    startTimer,
    stopTimer,
    addTimeEntry,
    
    // Comments
    addComment,
    
    // Reminders
    createReminder,
    
    // Templates
    createTemplate,
    createTaskFromTemplate,
    
    // Recurring tasks
    createRecurringTemplate,
    generateRecurringTasks,
    
    // File attachments
    uploadAttachment,
    
    // AI Features
    createTaskFromNaturalLanguage,
    
    // Analytics and insights
    getCompletionStats,
    getPriorityStats,
    getOverdueTasks,
    getUpcomingTasks,
    getDashboardStats,
    getProductivityInsights
  };
};
