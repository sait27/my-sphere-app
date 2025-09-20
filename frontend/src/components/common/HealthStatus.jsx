import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { performHealthCheck, getHealthStatus, getSystemHealth } from '../../utils/healthCheck';

const HealthStatus = ({ isOpen, onClose }) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      // Try system health first, fallback to individual checks
      const systemHealth = await getSystemHealth();
      if (systemHealth.services && Object.keys(systemHealth.services).length > 0) {
        setHealthData(systemHealth.services);
      } else {
        const results = await performHealthCheck();
        setHealthData(results);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      // Fallback to individual checks
      try {
        const results = await performHealthCheck();
        setHealthData(results);
      } catch (fallbackError) {
        console.error('Fallback health check failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const status = healthData ? getHealthStatus(healthData) : null;

  const getStatusIcon = (serviceStatus) => {
    switch (serviceStatus) {
      case 'healthy':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'unhealthy':
        return <XCircle className="text-red-400" size={16} />;
      default:
        return <AlertTriangle className="text-yellow-400" size={16} />;
    }
  };

  const getOverallStatusColor = (overall) => {
    switch (overall) {
      case 'healthy':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'degraded':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'unhealthy':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <Activity className="text-cyan-400" size={24} />
            <h2 className="text-xl font-bold text-white">System Health</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-cyan-400" size={24} />
              <span className="ml-2 text-slate-300">Checking system health...</span>
            </div>
          ) : status ? (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className={`p-4 rounded-lg border ${getOverallStatusColor(status.overall)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Overall Status</span>
                  <span className="capitalize font-bold">{status.overall}</span>
                </div>
                <div className="text-sm mt-1">
                  {status.healthy}/{status.total} services healthy ({status.percentage}%)
                </div>
              </div>

              {/* Individual Services */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Service Status</h3>
                {Object.entries(healthData).map(([service, data]) => (
                  <div key={service} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(data.status)}
                      <span className="text-white capitalize">{service}</span>
                    </div>
                    <div className="text-right">
                      {data.status === 'healthy' ? (
                        <span className="text-green-400 text-sm">{data.responseTime}ms</span>
                      ) : (
                        <span className="text-red-400 text-sm">{data.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={runHealthCheck}
                disabled={loading}
                className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                <span>Refresh Status</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              Failed to load health status
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthStatus;