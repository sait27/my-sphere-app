import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/axiosConfig';

const GoogleCalendarModal = ({ isOpen, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState('');
  const [syncSettings, setSyncSettings] = useState({
    syncExpenses: true,
    syncTasks: true,
    syncLists: false,
    autoSync: true
  });

  useEffect(() => {
    if (isOpen) {
      checkConnectionStatus();
    }
  }, [isOpen]);

  const checkConnectionStatus = async () => {
    try {
      const response = await apiClient.get('/api/v1/integrations/google-calendar/status/');
      setIsConnected(response.data.connected);
      setConnectionStatus(response.data.status);
      if (response.data.calendars) {
        setCalendars(response.data.calendars);
      }
      if (response.data.settings) {
        setSyncSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error checking calendar status:', error);
      setConnectionStatus('error');
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/integrations/google-calendar/connect/');
      
      if (response.data.auth_url) {
        // Open Google OAuth in new window
        const authWindow = window.open(
          response.data.auth_url,
          'google-calendar-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for auth completion
        const checkAuth = setInterval(async () => {
          try {
            if (authWindow.closed) {
              clearInterval(checkAuth);
              await checkConnectionStatus();
              if (isConnected) {
                toast.success('Google Calendar connected successfully!');
              }
            }
          } catch (error) {
            clearInterval(checkAuth);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Failed to connect to Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/v1/integrations/google-calendar/disconnect/');
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setCalendars([]);
      toast.success('Google Calendar disconnected successfully!');
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setLoading(true);
    try {
      await apiClient.post('/api/v1/integrations/google-calendar/sync/');
      toast.success('Calendar sync completed!');
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Failed to sync calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await apiClient.post('/api/v1/integrations/google-calendar/settings/', {
        ...syncSettings,
        selected_calendar: selectedCalendar
      });
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSyncSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700/50 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Google Calendar</h2>
                  <p className="text-slate-400 text-sm">Sync your data with Google Calendar</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Connection Status */}
            <div className="mb-6">
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                isConnected 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : connectionStatus === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-slate-700/30 border-slate-600/30 text-slate-400'
              }`}>
                {isConnected ? (
                  <CheckCircle className="w-5 h-5" />
                ) : connectionStatus === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Calendar className="w-5 h-5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {isConnected 
                      ? 'Connected to Google Calendar' 
                      : connectionStatus === 'error'
                        ? 'Connection Error'
                        : 'Not Connected'
                    }
                  </p>
                  <p className="text-sm opacity-75">
                    {isConnected 
                      ? 'Your calendar is synced and ready to use'
                      : connectionStatus === 'error'
                        ? 'Unable to connect to Google Calendar'
                        : 'Connect to sync your tasks and expenses'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Actions */}
            <div className="mb-6">
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <ExternalLink size={20} />
                      Connect Google Calendar
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleSyncNow}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <RefreshCw size={20} />
                        Sync Now
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="w-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>

            {/* Settings */}
            {isConnected && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Sync Settings</h3>
                
                {/* Calendar Selection */}
                {calendars.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Target Calendar
                    </label>
                    <select
                      value={selectedCalendar}
                      onChange={(e) => setSelectedCalendar(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="">Select a calendar</option>
                      {calendars.map(calendar => (
                        <option key={calendar.id} value={calendar.id}>
                          {calendar.summary}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sync Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={syncSettings.syncExpenses}
                      onChange={(e) => handleSettingChange('syncExpenses', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Sync expense due dates</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={syncSettings.syncTasks}
                      onChange={(e) => handleSettingChange('syncTasks', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Sync task due dates</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={syncSettings.syncLists}
                      onChange={(e) => handleSettingChange('syncLists', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Sync list deadlines</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={syncSettings.autoSync}
                      onChange={(e) => handleSettingChange('autoSync', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Auto-sync changes</span>
                  </label>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  Save Settings
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GoogleCalendarModal;
