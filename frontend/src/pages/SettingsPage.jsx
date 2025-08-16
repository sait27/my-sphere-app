import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { Settings, DollarSign, Calendar, User, Bell, Shield, Palette, Download, Upload, Trash2, Save } from 'lucide-react';
import GoogleCalendarModal from '../components/modals/GoogleCalendarModal';

function SettingsPage() {
  const [budget, setBudget] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // <-- 2. ADD SAVING STATE
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    expenseReminders: false,
    weeklyReports: true
  });
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    currency: 'INR'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  useEffect(() => {
    const fetchCurrentBudget = async () => {
      try {
        const [budgetRes, statusRes] = await Promise.all([
            apiClient.get('/budgets/current/').catch(e => e.response),
            apiClient.get('/integrations/google/status/')
        ]);
        if (budgetRes.status === 200) setBudget(budgetRes.data.amount);
        if (statusRes.status === 200) setIsCalendarConnected(statusRes.data.is_connected);

      } catch (error) {
        if (error.response && error.response.status === 404) {
          // No budget set for this month yet
        } else {
          // Failed to fetch budget
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrentBudget();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!budget || parseFloat(budget) <= 0) {
      toast.error('Please enter a valid budget amount.'); // <-- USE TOAST
      return;
    }
    
    setIsSaving(true); // <-- 3. SET SAVING TO TRUE
    try {
      await apiClient.post('/budgets/current/', {
        amount: budget
      });
      toast.success('Budget saved successfully!'); // <-- USE TOAST
    } catch (error) {
      // Failed to save budget
      toast.error('Failed to save budget. Please try again.'); // <-- USE TOAST
    } finally {
      setIsSaving(false); // <-- 4. SET SAVING TO FALSE
    }
  };

  if (isLoading) {
    return <h2 className="text-3xl font-bold text-white">Loading Settings...</h2>;
  }

  const handleConnectGoogle = async () => {
    try {
        // 1. Ask our secure backend for the Google URL
        const response = await apiClient.get('/integrations/google/connect/');
        const authUrl = response.data.authorization_url;

        // 2. Redirect the user's browser to that URL
        window.location.href = authUrl;
    } catch (error) {
        // Failed to connect Google Calendar
        toast.error("Could not start the connection process.");
    }
};
  const handleDisconnectGoogle = async () => {
    if (window.confirm("Are you sure you want to disconnect your Google Calendar?")) {
        try {
            await apiClient.delete('/integrations/google/status/');
            toast.success("Google Calendar disconnected.");
            setIsCalendarConnected(false);
        } catch (error) {
            toast.error("Failed to disconnect.");
        }
    }
  };

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success('Notification preferences updated!');
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Import export utilities
      const { exportAllData } = await import('../utils/exportUtils');
      
      // Fetch all user data
      const [expensesRes, listsRes] = await Promise.all([
        apiClient.get('/api/v1/expenses/'),
        apiClient.get('/api/v1/lists/')
      ]);
      
      const userData = {
        expenses: expensesRes.data,
        lists: listsRes.data,
        todos: [] // Will be populated when todos API is ready
      };
      
      await exportAllData(userData);
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="animate-slide-up">
      {/* Enhanced Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-3 text-white bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
          Settings & Preferences
        </h2>
        <p className="text-slate-400 text-lg">Customize your My Sphere experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Budget Settings */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 animate-scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">
              <DollarSign className="text-green-400" size={24} />
            </div>
            <h3 className="font-bold text-xl text-white">Monthly Budget</h3>
          </div>
          <p className="text-slate-400 mb-6 text-sm">
            Set your total spending limit for the current month. This powers your Budget Orb on the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <input
                type="number"
                id="budget"
                step="100"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g., 50000"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-slate-700 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">₹</span>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className={`group w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2 ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Budget
                </>
              )}
            </button>
          </form>
        </div>

        {/* Calendar Integration */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 animate-scale-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
              <Calendar className="text-blue-400" size={24} />
            </div>
            <h3 className="font-bold text-xl text-white">Calendar Integration</h3>
          </div>
          
          {isCalendarConnected ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-green-400 text-sm font-bold">Google Calendar Connected</p>
              </div>
              <p className="text-slate-400 mb-6 text-sm">
                My Sphere can now access your calendar to provide smarter scheduling suggestions.
              </p>
              <button 
                onClick={handleDisconnectGoogle}
                className="group bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/25 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <p className="text-slate-400 mb-6 text-sm">
                Connect your Google Calendar to allow AI-powered scheduling suggestions for your tasks.
              </p>
              <button 
                onClick={handleConnectGoogle}
                className="group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
              >
                <Calendar size={18} />
                Connect Google Calendar
              </button>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 animate-scale-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
              <Bell className="text-purple-400" size={24} />
            </div>
            <h3 className="font-bold text-xl text-white">Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
              <div>
                <p className="text-white font-semibold">Budget Alerts</p>
                <p className="text-slate-400 text-sm">Get notified when approaching budget limits</p>
              </div>
              <button
                onClick={() => handleNotificationChange('budgetAlerts')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.budgetAlerts ? 'bg-purple-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.budgetAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
              <div>
                <p className="text-white font-semibold">Expense Reminders</p>
                <p className="text-slate-400 text-sm">Daily reminders to log expenses</p>
              </div>
              <button
                onClick={() => handleNotificationChange('expenseReminders')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.expenseReminders ? 'bg-purple-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.expenseReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
              <div>
                <p className="text-white font-semibold">Weekly Reports</p>
                <p className="text-slate-400 text-sm">Weekly spending summary emails</p>
              </div>
              <button
                onClick={() => handleNotificationChange('weeklyReports')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.weeklyReports ? 'bg-purple-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 hover:border-amber-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 animate-scale-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg">
              <Shield className="text-amber-400" size={24} />
            </div>
            <h3 className="font-bold text-xl text-white">Data Management</h3>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className={`group w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/25 flex items-center justify-center gap-2 ${
                isExporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export All Data
                </>
              )}
            </button>

            <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
              <p className="text-slate-300 text-sm mb-2">
                <strong>Privacy:</strong> Your data is encrypted and stored securely. We never share your personal financial information.
              </p>
              <p className="text-slate-400 text-xs">
                Last backup: Today at 3:42 PM
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Calendar Modal */}
      <GoogleCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
    </div>
  );
}

export default SettingsPage;