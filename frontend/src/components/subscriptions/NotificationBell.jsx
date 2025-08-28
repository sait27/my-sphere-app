import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertTriangle, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { useAlerts } from '../../hooks/useAlerts';
import apiClient from '../../api/axiosConfig';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const { markAsRead, dismissAlert } = useAlerts();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadAlerts();
    const interval = setInterval(fetchUnreadAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadAlerts = async () => {
    try {
      const response = await apiClient.get('/subscriptions/alerts/unread/');
      setAlerts(response.data);
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await markAsRead(alertId);
      await fetchUnreadAlerts();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDismiss = async (alertId) => {
    try {
      await dismissAlert(alertId);
      await fetchUnreadAlerts();
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await Promise.all(alerts.map(alert => markAsRead(alert.id)));
      await fetchUnreadAlerts();
      toast.success('All alerts marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'payment_due':
        return <DollarSign className="w-4 h-4 text-red-400" />;
      case 'renewal_reminder':
        return <Calendar className="w-4 h-4 text-yellow-400" />;
      case 'price_increase':
        return <TrendingUp className="w-4 h-4 text-orange-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-400" />;
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 group"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Marking...' : 'Mark all read'}
                </button>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="text-slate-400 text-sm mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No new notifications</p>
                <p className="text-slate-500 text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="p-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 mb-2 rounded-xl border bg-gradient-to-r ${getAlertColor(alert.alert_type)} hover:shadow-lg transition-all duration-200 group`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-700/50">
                        {getAlertIcon(alert.alert_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm mb-1 truncate">
                          {alert.title}
                        </h4>
                        <p className="text-slate-300 text-xs mb-2 line-clamp-2">
                          {alert.message}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {formatDate(alert.alert_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="p-1 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded transition-all duration-200"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-all duration-200"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;