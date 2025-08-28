import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Calendar, DollarSign, TrendingUp, Check, X, Filter } from 'lucide-react';
import { useAlerts } from '../../hooks/useAlerts';
import apiClient from '../../api/axiosConfig';
import toast from 'react-hot-toast';

const AlertsPanel = () => {
  const { markAsRead, dismissAlert } = useAlerts();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await apiClient.get('/subscriptions/alerts/');
      setAlerts(response.data);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await markAsRead(alertId);
      await fetchAlerts();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDismiss = async (alertId) => {
    try {
      await dismissAlert(alertId);
      await fetchAlerts();
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'payment_due':
        return <DollarSign className="w-5 h-5 text-red-400" />;
      case 'renewal_reminder':
        return <Calendar className="w-5 h-5 text-yellow-400" />;
      case 'price_increase':
        return <TrendingUp className="w-5 h-5 text-orange-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-blue-400" />;
    }
  };

  const getAlertColor = (alertType) => {
    switch (alertType) {
      case 'payment_due':
        return 'from-red-500/10 to-red-600/10 border-red-500/20';
      case 'renewal_reminder':
        return 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20';
      case 'price_increase':
        return 'from-orange-500/10 to-red-500/10 border-orange-500/20';
      default:
        return 'from-blue-500/10 to-indigo-500/10 border-blue-500/20';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.is_read;
    if (filter === 'read') return alert.is_read;
    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading alerts...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
            <Bell className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Alerts</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {filter === 'unread' ? 'No unread alerts' : 'No alerts found'}
          </h3>
          <p className="text-slate-400">
            {filter === 'unread' 
              ? "You're all caught up! No new notifications." 
              : "No alerts match your current filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-6 rounded-2xl border bg-gradient-to-r ${getAlertColor(alert.alert_type)} hover:shadow-xl transition-all duration-300 group ${
                !alert.is_read ? 'ring-1 ring-blue-500/30' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-slate-700/50">
                  {getAlertIcon(alert.alert_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-white">
                      {alert.title}
                      {!alert.is_read && (
                        <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!alert.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-all duration-200"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300 mb-4 leading-relaxed">
                    {alert.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-slate-600/50 text-slate-300 text-xs rounded-full font-medium">
                      {alert.alert_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-slate-500 text-sm">
                      {formatDate(alert.alert_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;