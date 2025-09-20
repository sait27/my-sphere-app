import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, 
  CheckCircle, Clock, BarChart3, PieChart, Calendar, Target,
  ArrowUpRight, ArrowDownRight, Activity, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { lendingAPI } from '../../api/lending';

const LendingDashboard = ({ dashboardData }) => {
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAIInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchAIInsights();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await lendingAPI.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchAIInsights = async () => {
    try {
      setLoading(true);
      const response = await lendingAPI.getAIInsights();
      setAIInsights(response.data);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-${color}-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-${color}-500/10`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 rounded-xl`}>
          <Icon className={`text-${color}-400`} size={24} />
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="ml-1">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );

  const summary = dashboardData?.summary || {};
  const recentTransactions = dashboardData?.recent_transactions || [];
  const notifications = dashboardData?.notifications || [];

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Lent"
          value={formatCurrency(summary.total_lent)}
          icon={TrendingUp}
          color="green"
          trend={analytics?.lending_trend}
          subtitle={`${summary.active_lends || 0} active transactions`}
          delay={0}
        />
        
        <StatCard
          title="Total Borrowed"
          value={formatCurrency(summary.total_borrowed)}
          icon={TrendingDown}
          color="orange"
          trend={analytics?.borrowing_trend}
          subtitle={`${summary.active_borrows || 0} active transactions`}
          delay={0.1}
        />
        
        <StatCard
          title="Outstanding Amount"
          value={formatCurrency(summary.outstanding_amount)}
          icon={DollarSign}
          color="blue"
          subtitle="Amount yet to be collected"
          delay={0.2}
        />
        
        <StatCard
          title="Overdue Transactions"
          value={summary.overdue_count || 0}
          icon={AlertTriangle}
          color="red"
          subtitle={summary.overdue_count > 0 ? "Requires attention" : "All up to date"}
          delay={0.3}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Contacts"
          value={dashboardData?.quick_stats?.total_contacts || 0}
          icon={Users}
          color="purple"
          subtitle="People in your network"
          delay={0.4}
        />
        
        <StatCard
          title="Completed Transactions"
          value={summary.completed_count || 0}
          icon={CheckCircle}
          color="green"
          subtitle="Successfully closed"
          delay={0.5}
        />
        
        <StatCard
          title="Average Transaction"
          value={formatCurrency(summary.average_amount)}
          icon={Target}
          color="cyan"
          subtitle="Per transaction"
          delay={0.6}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <BarChart3 className="mr-2 text-cyan-400" size={24} />
              Cash Flow Forecast
            </h3>
          </div>
          
          {dashboardData?.cash_flow_forecast && Array.isArray(dashboardData.cash_flow_forecast) ? (
            <div className="space-y-4">
              {dashboardData.cash_flow_forecast.slice(0, 3).map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{month.month}</p>
                    <p className="text-slate-400 text-sm">Expected inflow</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">{formatCurrency(month.expected_inflow)}</p>
                    <p className="text-slate-400 text-sm">{month.transaction_count} transactions</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-400">
              <p>No forecast data available</p>
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Activity className="mr-2 text-purple-400" size={24} />
              Recent Activity
            </h3>
          </div>
          
          <div className="space-y-3">
            {Array.isArray(recentTransactions) && recentTransactions.slice(0, 4).map((transaction, index) => (
              <div key={transaction.lending_id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    transaction.transaction_type === 'lend' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {transaction.transaction_type === 'lend' ? 
                      <TrendingUp size={16} /> : 
                      <TrendingDown size={16} />
                    }
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.person_name}</p>
                    <p className="text-slate-400 text-sm">
                      {transaction.transaction_type === 'lend' ? 'Lent' : 'Borrowed'} • {transaction.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{formatCurrency(transaction.amount)}</p>
                  <p className="text-slate-400 text-sm">
                    {new Date(transaction.transaction_date).toLocaleDateString('en-IN', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {(!Array.isArray(recentTransactions) || recentTransactions.length === 0) && (
              <div className="flex items-center justify-center h-32 text-slate-400">
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Zap className="mr-2 text-yellow-400" size={24} />
              AI Insights
            </h3>
            <button
              onClick={fetchAIInsights}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg text-sm transition-all duration-200"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.recommendations?.slice(0, 4).map((insight, index) => (
              <div key={index} className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-yellow-500">
                <h4 className="text-white font-medium mb-2">{insight.title}</h4>
                <p className="text-slate-300 text-sm">{insight.description}</p>
                {insight.priority && (
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                    insight.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                    insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {insight.priority.toUpperCase()} PRIORITY
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {aiInsights.risk_score && (
            <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Overall Risk Score</span>
                <span className={`font-bold ${
                  aiInsights.risk_score > 7 ? 'text-red-400' :
                  aiInsights.risk_score > 4 ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {aiInsights.risk_score}/10
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    aiInsights.risk_score > 7 ? 'bg-red-500' :
                    aiInsights.risk_score > 4 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${(aiInsights.risk_score / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <AlertTriangle className="mr-2 text-red-400" size={24} />
              Important Notifications
            </h3>
          </div>
          
          <div className="space-y-3">
            {notifications.slice(0, 3).map((notification, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                notification.type === 'overdue' ? 'bg-red-500/10 border-red-500' :
                notification.type === 'due_soon' ? 'bg-yellow-500/10 border-yellow-500' :
                'bg-blue-500/10 border-blue-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-medium">{notification.title}</h4>
                    <p className="text-slate-300 text-sm mt-1">{notification.message}</p>
                  </div>
                  <span className="text-slate-400 text-xs">
                    {notification.created_at && new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LendingDashboard;