import apiClient from '../api/axiosConfig';

const HEALTH_CHECK_ENDPOINTS = {
  expenses: '/expenses/',
  subscriptions: '/subscriptions/',
  todos: '/todos/',
  lists: '/lists/',
  lending: '/lending/transactions/',
  users: '/users/profile/'
};

export const getSystemHealth = async () => {
  try {
    const response = await fetch('http://localhost:8000/health/');
    return await response.json();
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Backend unreachable',
      services: {}
    };
  }
};

export const performHealthCheck = async () => {
  const results = {};
  
  for (const [feature, endpoint] of Object.entries(HEALTH_CHECK_ENDPOINTS)) {
    try {
      const startTime = Date.now();
      await apiClient.get(endpoint);
      const responseTime = Date.now() - startTime;
      
      results[feature] = {
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      results[feature] = {
        status: 'unhealthy',
        error: error.response?.status || 'Network Error',
        message: error.response?.data?.detail || error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  return results;
};

export const getHealthStatus = (results) => {
  const total = Object.keys(results).length;
  const healthy = Object.values(results).filter(r => r.status === 'healthy').length;
  
  return {
    overall: healthy === total ? 'healthy' : healthy > total / 2 ? 'degraded' : 'unhealthy',
    healthy,
    total,
    percentage: Math.round((healthy / total) * 100)
  };
};