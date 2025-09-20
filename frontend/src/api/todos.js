import apiClient from './axiosConfig';

export const todosAPI = {
  // Goals
  goals: {
    list: () => apiClient.get('/todos/goals/'),
    create: (data) => apiClient.post('/todos/goals/', data),
    get: (id) => apiClient.get(`/todos/goals/${id}/`),
    update: (id, data) => apiClient.patch(`/todos/goals/${id}/`, data),
    delete: (id) => apiClient.delete(`/todos/goals/${id}/`),
    generateAIInsights: (id) => apiClient.post(`/todos/goals/${id}/generate_ai_insights/`)
  },

  // Tasks
  tasks: {
    list: (params = {}) => apiClient.get('/todos/tasks/', { params }),
    create: (data) => apiClient.post('/todos/tasks/', data),
    get: (id) => apiClient.get(`/todos/tasks/${id}/`),
    update: (id, data) => apiClient.patch(`/todos/tasks/${id}/`, data),
    delete: (id) => apiClient.delete(`/todos/tasks/${id}/`),
    createFromNaturalLanguage: (text) => apiClient.post('/todos/tasks/create_from_natural_language/', { text }),
    updateAIData: (id) => apiClient.post(`/todos/tasks/${id}/update_ai_data/`),
    dashboardStats: () => apiClient.get('/todos/tasks/dashboard_stats/'),
    advancedDashboard: () => apiClient.get('/todos/tasks/advanced_dashboard/'),
    addNote: (id, content) => apiClient.post(`/todos/tasks/${id}/add_note/`, { content }),
    uploadAttachment: (id, file) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post(`/todos/tasks/${id}/upload_attachment/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    deleteAttachment: (id, attachmentId) => apiClient.delete(`/todos/tasks/${id}/delete_attachment/`, { 
      data: { attachment_id: attachmentId } 
    }),
    smartSuggestions: () => apiClient.get('/todos/tasks/smart_suggestions/')
  },

  // Templates
  templates: {
    list: () => apiClient.get('/todos/templates/'),
    create: (data) => apiClient.post('/todos/templates/', data),
    get: (id) => apiClient.get(`/todos/templates/${id}/`),
    update: (id, data) => apiClient.patch(`/todos/templates/${id}/`, data),
    delete: (id) => apiClient.delete(`/todos/templates/${id}/`),
    createTask: (id, data) => apiClient.post(`/todos/templates/${id}/create_task/`, data)
  },

  // AI Insights
  insights: {
    list: () => apiClient.get('/todos/insights/'),
    get: (id) => apiClient.get(`/todos/insights/${id}/`),
    dismiss: (id) => apiClient.post(`/todos/insights/${id}/dismiss/`),
    generate: () => apiClient.post('/todos/insights/generate_insights/')
  },

  // Notes
  notes: {
    list: (taskId) => apiClient.get('/todos/notes/', { params: { task: taskId } }),
    create: (data) => apiClient.post('/todos/notes/', data),
    get: (id) => apiClient.get(`/todos/notes/${id}/`),
    update: (id, data) => apiClient.patch(`/todos/notes/${id}/`, data),
    delete: (id) => apiClient.delete(`/todos/notes/${id}/`)
  },

  // Attachments
  attachments: {
    list: (taskId) => apiClient.get('/todos/attachments/', { params: { task: taskId } }),
    create: (data) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      return apiClient.post('/todos/attachments/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    get: (id) => apiClient.get(`/todos/attachments/${id}/`),
    delete: (id) => apiClient.delete(`/todos/attachments/${id}/`)
  },

  // Tags
  tags: {
    list: () => apiClient.get('/todos/tags/'),
    create: (data) => apiClient.post('/todos/tags/', data),
    get: (id) => apiClient.get(`/todos/tags/${id}/`),
    update: (id, data) => apiClient.patch(`/todos/tags/${id}/`, data),
    delete: (id) => apiClient.delete(`/todos/tags/${id}/`),
    assignToTask: (id, taskId) => apiClient.post(`/todos/tags/${id}/assign_to_task/`, { task_id: taskId })
  },

  // Subtasks
  subtasks: {
    list: (taskId) => apiClient.get('/todos/subtasks/', { params: { task: taskId } }),
    create: (data) => apiClient.post('/todos/subtasks/', data),
    get: (id) => apiClient.get(`/todos/subtasks/${id}/`),
    update: (id, data) => apiClient.patch(`/todos/subtasks/${id}/`, data),
    delete: (id) => apiClient.delete(`/todos/subtasks/${id}/`),
    toggleComplete: (id) => apiClient.post(`/todos/subtasks/${id}/toggle_complete/`)
  },

  // Time Entries
  timeEntries: {
    list: (taskId) => apiClient.get('/todos/time-entries/', { params: { task: taskId } }),
    create: (data) => apiClient.post('/todos/time-entries/', data),
    get: (id) => apiClient.get(`/todos/time-entries/${id}/`),
    update: (id, data) => apiClient.patch(`/todos/time-entries/${id}/`, data),
    delete: (id) => apiClient.delete(`/todos/time-entries/${id}/`),
    startTimer: (taskId) => apiClient.post('/todos/time-entries/start_timer/', { task_id: taskId }),
    stopTimer: (id) => apiClient.post(`/todos/time-entries/${id}/stop_timer/`)
  },

  // Reminders
  reminders: {
    list: (taskId) => apiClient.get('/todos/reminders/', { params: { task: taskId } }),
    create: (data) => apiClient.post('/todos/reminders/', data),
    get: (id) => apiClient.get(`/todos/reminders/${id}/`),
    update: (id, data) => apiClient.patch(`/todos/reminders/${id}/`, data),
    delete: (id) => apiClient.delete(`/todos/reminders/${id}/`)
  },

  // Recurring Templates
  recurringTemplates: {
    list: () => apiClient.get('/todos/recurring-templates/'),
    create: (data) => apiClient.post('/todos/recurring-templates/', data),
    get: (id) => apiClient.get(`/todos/recurring-templates/${id}/`),
    update: (id, data) => apiClient.patch(`/todos/recurring-templates/${id}/`, data),
    delete: (id) => apiClient.delete(`/todos/recurring-templates/${id}/`),
    generateTasks: (id, count = 1) => apiClient.post(`/todos/recurring-templates/${id}/generate_tasks/`, { count })
  },

  // Comments
  comments: {
    list: (taskId) => apiClient.get('/todos/comments/', { params: { task: taskId } }),
    create: (data) => apiClient.post('/todos/comments/', data),
    get: (id) => apiClient.get(`/todos/comments/${id}/`),
    update: (id, data) => apiClient.patch(`/todos/comments/${id}/`, data),
    delete: (id) => apiClient.delete(`/todos/comments/${id}/`)
  },

  // Activity Logs
  activityLogs: {
    list: (taskId) => apiClient.get('/todos/activity-logs/', { params: { task: taskId } }),
    get: (id) => apiClient.get(`/todos/activity-logs/${id}/`)
  },

  // Custom Fields
  customFields: {
    list: () => apiClient.get('/todos/custom-fields/'),
    create: (data) => apiClient.post('/todos/custom-fields/', data),
    get: (id) => apiClient.get(`/todos/custom-fields/${id}/`),
    update: (id, data) => apiClient.patch(`/todos/custom-fields/${id}/`, data),
    delete: (id) => apiClient.delete(`/todos/custom-fields/${id}/`)
  },

  // Google Calendar Integration
  calendar: {
    connect: () => apiClient.post('/integrations/google-calendar/connect/'),
    disconnect: () => apiClient.post('/integrations/google-calendar/disconnect/'),
    syncTask: (taskId) => apiClient.post(`/integrations/google-calendar/sync-task/${taskId}/`),
    syncAllTasks: () => apiClient.post('/integrations/google-calendar/sync-all-tasks/'),
    getEvents: (params = {}) => apiClient.get('/integrations/google-calendar/events/', { params }),
    createEvent: (data) => apiClient.post('/integrations/google-calendar/events/', data),
    updateEvent: (eventId, data) => apiClient.patch(`/integrations/google-calendar/events/${eventId}/`, data),
    deleteEvent: (eventId) => apiClient.delete(`/integrations/google-calendar/events/${eventId}/`)
  }
};