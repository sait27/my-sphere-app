import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, TrendingDown, Calendar, 
  DollarSign, Users, AlertTriangle, Target, Activity, Zap 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { lendingAPI } from '../../api/lending';
import LendingAIInsights from './LendingAIInsights';

const LendingAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [cashFlowForecast, setCashFlowForecast] = useState(null);
  const [lendingPatterns, setLendingPatterns] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAIInsights] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data with error handling for each endpoint
      const results = await Promise.allSettled([
        lendingAPI.getAnalytics(selectedPeriod),
        lendingAPI.getCashFlowForecast(6),
        lendingAPI.getLendingPatterns(),
        lendingAPI.getRiskAnalysis(),
        lendingAPI.getAIInsights()
      ]);

      // Set data with fallbacks and logging
      if (results[0].status === 'fulfilled') {
        console.log('Analytics data:', results[0].value.data);
        setAnalytics(results[0].value.data);
      } else {
        console.error('Analytics failed:', results[0].reason);
        setAnalytics(null);
      }
      
      if (results[1].status === 'fulfilled') {
        console.log('Cash flow data:', results[1].value.data);
        setCashFlowForecast(results[1].value.data);
      } else {
        console.error('Cash flow failed:', results[1].reason);
        setCashFlowForecast([]);
      }
      
      if (results[2].status === 'fulfilled') {
        console.log('Patterns data:', results[2].value.data);
        setLendingPatterns(results[2].value.data);
      } else {
        console.error('Patterns failed:', results[2].reason);
        setLendingPatterns(null);
      }
      
      if (results[3].status === 'fulfilled') {
        console.log('Risk analysis data:', results[3].value.data);
        setRiskAnalysis(results[3].value.data);
      } else {
        console.error('Risk analysis failed:', results[3].reason);
        setRiskAnalysis(null);
      }
      
      if (results[4].status === 'fulfilled') {
        console.log('AI insights data:', results[4].value.data);
        setAIInsights(results[4].value.data);
      } else {
        console.error('AI insights failed:', results[4].reason);
        setAIInsights(null);
      }
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async (refresh = false) => {
    try {
      const response = await lendingAPI.getAIInsights(refresh);
      setAIInsights(response.data);
      console.log('AI insights refreshed:', response.data);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
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
      className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-${color}-500/30 transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 rounded-xl`}>
          <Icon className={`text-${color}-400`} size={24} />
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* Enhanced Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-3 text-white bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
          Lending Analytics
        </h2>
        <p className="text-slate-400 text-lg">AI-powered insights and comprehensive lending analysis</p>
        
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 backdrop-blur-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>



      {/* Enhanced Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 animate-scale-in"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(analytics.total_volume)}
                </p>
                <p className="text-sm text-slate-400">{analytics.transaction_count} txns</p>
              </div>
            </div>
            <p className="text-slate-300 font-medium">Total Volume</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 animate-scale-in"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {analytics.active_transactions || 0}
                </p>
                <p className="text-sm text-slate-400">Active</p>
              </div>
            </div>
            <p className="text-slate-300 font-medium">Active Transactions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 animate-scale-in"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {(analytics.collection_rate || 0).toFixed(1)}%
                </p>
                <p className="text-sm text-slate-400">Success</p>
              </div>
            </div>
            <p className="text-slate-300 font-medium">Collection Rate</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-red-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 animate-scale-in"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {(analytics.risk_score || 0).toFixed(1)}/10
                </p>
                <p className="text-sm text-slate-400">Risk</p>
              </div>
            </div>
            <p className="text-slate-300 font-medium">Risk Score</p>
          </motion.div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Cash Flow Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 animate-scale-in"
          style={{animationDelay: '0.3s'}}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <BarChart3 className="mr-2 text-cyan-400" size={24} />
              Cash Flow Forecast
            </h3>
          </div>
          
          {cashFlowForecast && cashFlowForecast.length > 0 ? (
            <div className="space-y-4">
              {/* Bar Chart */}
              <div className="h-40 flex items-end justify-between space-x-2 mb-4 p-4 bg-slate-700/20 rounded-lg">
                {cashFlowForecast.slice(0, 6).map((month, index) => {
                  const maxAmount = Math.max(...cashFlowForecast.map(m => m.expected_inflow || 0));
                  const height = maxAmount > 0 ? ((month.expected_inflow || 0) / maxAmount) * 100 : 5;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex justify-center mb-2">
                        <div 
                          className="w-6 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all duration-500 hover:from-cyan-500 hover:to-cyan-300"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${month.month}: ${formatCurrency(month.expected_inflow)}`}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-400 text-center">
                        {month.month?.split(' ')[0] || `M${index + 1}`}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {/* Data List */}
              <div className="space-y-2">
                {cashFlowForecast.slice(0, 3).map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-700/20 rounded">
                    <span className="text-slate-300 text-sm">{month.month}</span>
                    <div className="text-right">
                      <span className="text-green-400 font-medium text-sm">{formatCurrency(month.expected_inflow)}</span>
                      <span className="text-slate-400 text-xs ml-2">({month.transaction_count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-400">
              <p>No forecast data available</p>
            </div>
          )}
        </motion.div>

        {/* Enhanced Lending Patterns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 animate-scale-in"
          style={{animationDelay: '0.4s'}}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <PieChart className="mr-2 text-purple-400" size={24} />
              Lending Patterns
            </h3>
          </div>
          
          {lendingPatterns && Object.keys(lendingPatterns.category_breakdown || {}).length > 0 ? (
            <div className="space-y-4">
              {/* Donut Chart */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-700"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {Object.entries(lendingPatterns.category_breakdown).map(([category, data], index) => {
                      const total = Object.values(lendingPatterns.category_breakdown).reduce((sum, cat) => sum + (cat.amount || 0), 0);
                      const percentage = total > 0 ? ((data.amount || 0) / total) * 100 : 0;
                      const colors = ['stroke-cyan-400', 'stroke-purple-400', 'stroke-green-400', 'stroke-orange-400', 'stroke-red-400'];
                      return (
                        <path
                          key={category}
                          className={colors[index % colors.length]}
                          strokeWidth="3"
                          fill="transparent"
                          strokeDasharray={`${percentage}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">{Object.keys(lendingPatterns.category_breakdown).length}</p>
                      <p className="text-slate-400 text-xs">Categories</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Category List */}
              <div className="space-y-2">
                {Object.entries(lendingPatterns.category_breakdown).map(([category, data], index) => {
                  const colors = ['bg-cyan-400', 'bg-purple-400', 'bg-green-400', 'bg-orange-400', 'bg-red-400'];
                  return (
                    <div key={category} className="flex items-center justify-between p-2 bg-slate-700/20 rounded">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-2`}></div>
                        <span className="text-slate-300 text-sm">{category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-medium text-sm">{formatCurrency(data.amount)}</span>
                        <span className="text-slate-400 text-xs ml-2">({data.count})</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Average Transaction */}
              <div className="pt-4 border-t border-slate-600/30">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Average Transaction</span>
                  <span className="text-white font-bold">
                    {formatCurrency(lendingPatterns.average_transaction_size)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-400">
              <p>No pattern data available</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Enhanced Risk Analysis */}
      {riskAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 animate-scale-in"
          style={{animationDelay: '0.5s'}}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <AlertTriangle className="mr-2 text-red-400" size={24} />
              Risk Analysis
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* High Risk Transactions */}
            <div className="space-y-3">
              <h4 className="text-red-400 font-medium">High Risk</h4>
              <div className="space-y-2">
                {riskAnalysis.high_risk_transactions?.slice(0, 3).map((transaction, index) => (
                  <div key={index} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-white font-medium">{transaction.person_name}</p>
                    <p className="text-red-300 text-sm">{formatCurrency(transaction.amount)}</p>
                    <p className="text-red-400 text-xs">{transaction.risk_reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Medium Risk Transactions */}
            <div className="space-y-3">
              <h4 className="text-yellow-400 font-medium">Medium Risk</h4>
              <div className="space-y-2">
                {riskAnalysis.medium_risk_transactions?.slice(0, 3).map((transaction, index) => (
                  <div key={index} className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-white font-medium">{transaction.person_name}</p>
                    <p className="text-yellow-300 text-sm">{formatCurrency(transaction.amount)}</p>
                    <p className="text-yellow-400 text-xs">{transaction.risk_reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Recommendations */}
            <div className="space-y-3">
              <h4 className="text-cyan-400 font-medium">Recommendations</h4>
              <div className="space-y-2">
                {riskAnalysis.recommendations?.slice(0, 3).map((rec, index) => (
                  <div key={index} className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-cyan-300 text-sm">{rec.title}</p>
                    <p className="text-slate-400 text-xs">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overall Risk Score */}
          <div className="mt-6 pt-6 border-t border-slate-600/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300">Portfolio Risk Score</span>
              <span className={`font-bold ${
                riskAnalysis.overall_risk_score > 7 ? 'text-red-400' :
                riskAnalysis.overall_risk_score > 4 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {riskAnalysis.overall_risk_score}/10
              </span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  riskAnalysis.overall_risk_score > 7 ? 'bg-red-500' :
                  riskAnalysis.overall_risk_score > 4 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${(riskAnalysis.overall_risk_score / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </motion.div>
      )}



      {/* Enhanced Performance Metrics */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 animate-scale-in"
          style={{animationDelay: '0.6s'}}
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Target className="mr-2 text-green-400" size={24} />
            Performance Metrics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
              <p className="text-2xl font-bold text-green-400">{analytics.on_time_payments || 0}%</p>
              <p className="text-slate-400 text-sm">On-time Payments</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
              <p className="text-2xl font-bold text-blue-400">{analytics.average_days_to_collect || 0}</p>
              <p className="text-slate-400 text-sm">Avg Days to Collect</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
              <p className="text-2xl font-bold text-purple-400">{analytics.repeat_borrowers || 0}%</p>
              <p className="text-slate-400 text-sm">Repeat Borrowers</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
              <p className="text-2xl font-bold text-orange-400">{formatCurrency(analytics.interest_earned || 0)}</p>
              <p className="text-slate-400 text-sm">Interest Earned</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Insights Section */}
      <LendingAIInsights />
    </div>
  );
};

export default LendingAnalytics;