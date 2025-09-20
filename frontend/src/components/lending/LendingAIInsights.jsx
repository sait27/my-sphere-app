import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingDown, AlertCircle, CheckCircle, Lightbulb, RefreshCw, Sparkles, Target, Zap, TrendingUp, Clock, Shield } from 'lucide-react';
import { lendingAPI } from '../../api/lending';
import toast from 'react-hot-toast';

// Cache configuration
const CACHE_DURATION = 4.5 * 60 * 60 * 1000; // 4.5 hours
const INSIGHTS_CACHE_KEY = 'lending_ai_insights';
const OPTIMIZATION_CACHE_KEY = 'lending_optimization';

// Check if current time is in night pause period (12 AM to 9 AM)
const isNightPause = () => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 0 && hour < 9; // 12 AM (0) to 9 AM
};

// Cache utility functions
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return null;
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

const LendingAIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = useCallback(async (forceRefresh = false) => {
    // Check night pause period
    if (isNightPause() && !forceRefresh) {
      toast.info('AI insights paused during night hours (12 AM - 9 AM)');
      return;
    }

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cachedData = getCachedData(INSIGHTS_CACHE_KEY);
      if (cachedData) {
        setInsights(cachedData);
        setLastUpdated(new Date());
        return;
      }
    }

    setLoading(true);
    try {
      const response = await lendingAPI.getAIInsights(forceRefresh);
      const insightsData = response.data;
      setInsights(insightsData);
      setCachedData(INSIGHTS_CACHE_KEY, insightsData);
      setLastUpdated(new Date());
      toast.success('AI insights updated successfully');
    } catch (error) {
      toast.error('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  }, []);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'from-red-500/10 to-red-600/10 border-red-500/20';
      case 'medium':
        return 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20';
      case 'low':
        return 'from-green-500/10 to-emerald-500/10 border-green-500/20';
      default:
        return 'from-blue-500/10 to-indigo-500/10 border-blue-500/20';
    }
  };

  const formatLastUpdated = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const refreshAll = () => {
    if (isNightPause()) {
      toast.info('AI services paused during night hours (12 AM - 9 AM). Please try again after 9 AM.');
      return;
    }
    fetchInsights(true);
  };

  if (loading && !insights) {
    return (
      <motion.div 
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <motion.div 
              className="p-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl inline-block mb-6 relative"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="w-12 h-12 text-cyan-400" />
              <motion.div
                className="absolute inset-0 bg-cyan-400/20 rounded-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <motion.p 
              className="text-white font-semibold mb-2 text-lg"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Generating AI insights...
            </motion.p>
            <p className="text-slate-400 text-sm">Analyzing your lending patterns</p>
            <div className="flex justify-center mt-4 space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Enhanced AI Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <motion.div 
            className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl relative overflow-hidden"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Brain className="w-8 h-8 text-cyan-400 relative z-10" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-400/10"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
              AI Lending Insights
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </motion.div>
            </h2>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span>Powered by advanced analytics</span>
              {lastUpdated && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Updated {formatLastUpdated(lastUpdated)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-700/50 rounded-xl p-1 backdrop-blur-sm">
            <motion.button
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'insights'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-4 h-4" />
              Insights
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('patterns')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'patterns'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Target className="w-4 h-4" />
              Patterns
            </motion.button>
          </div>
          
          <motion.button
            onClick={refreshAll}
            disabled={loading}
            className="p-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl transition-all duration-200 disabled:opacity-50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'insights' && insights && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Risk Score Overview */}
            {insights.risk_score !== undefined && (
              <motion.div 
                className="p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </motion.div>
                  <h4 className="font-bold text-xl text-white">Risk Assessment</h4>
                  <motion.div 
                    className={`px-3 py-1 rounded-full ${
                      insights.risk_score > 70 ? 'bg-red-500/20 text-red-300' :
                      insights.risk_score > 40 ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-xs font-medium">{insights.risk_score}/100</span>
                  </motion.div>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-3 mb-3 relative z-10">
                  <div 
                    className={`h-3 rounded-full ${
                      insights.risk_score > 70 ? 'bg-red-500' :
                      insights.risk_score > 40 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${insights.risk_score}%` }}
                  ></div>
                </div>
                <p className="text-slate-300 leading-relaxed relative z-10">
                  {insights.risk_score > 70 ? 'High risk portfolio - immediate attention required' :
                   insights.risk_score > 40 ? 'Moderate risk - monitor closely' :
                   'Low risk portfolio - well managed'}
                </p>
              </motion.div>
            )}

            {/* Key Metrics */}
            {insights.key_metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-2xl font-bold text-white">₹{insights.key_metrics.total_exposure?.toFixed(0) || 0}</span>
                  </div>
                  <p className="text-slate-400 text-sm">Total Exposure</p>
                </motion.div>

                <motion.div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    <span className="text-2xl font-bold text-white">{insights.key_metrics.success_rate?.toFixed(1) || 0}%</span>
                  </div>
                  <p className="text-slate-400 text-sm">Success Rate</p>
                </motion.div>

                <motion.div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-2xl font-bold text-white">{insights.key_metrics.avg_duration || 0}</span>
                  </div>
                  <p className="text-slate-400 text-sm">Avg Duration (days)</p>
                </motion.div>

                <motion.div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    <span className="text-2xl font-bold text-white">{insights.key_metrics.active_contacts || 0}</span>
                  </div>
                  <p className="text-slate-400 text-sm">Active Contacts</p>
                </motion.div>
              </div>
            )}

            {/* AI Insights */}
            {insights.insights && insights.insights.length > 0 ? (
              <div className="grid gap-4">
                {insights.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    className="p-6 rounded-2xl border bg-gradient-to-r from-slate-700/30 to-slate-800/30 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all duration-300"></div>
                    <div className="flex items-start gap-4 relative z-10">
                      <motion.div 
                        className="p-3 rounded-xl bg-slate-700/50 backdrop-blur-sm"
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Lightbulb className="w-5 h-5 text-cyan-400" />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-slate-300 leading-relaxed">{insight}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="p-6 bg-gradient-to-br from-slate-700/30 to-slate-600/20 rounded-2xl inline-block mb-4 relative"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Brain className="w-12 h-12 text-slate-400" />
                  <motion.div
                    className="absolute inset-0 bg-slate-400/10 rounded-2xl"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                <p className="text-slate-400 mb-2 text-lg">No insights available yet</p>
                <p className="text-slate-500 text-sm">Add more transactions to get personalized recommendations</p>
              </motion.div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <motion.div 
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Target className="w-6 h-6 text-cyan-400" />
                  </motion.div>
                  <h4 className="font-bold text-xl text-white">Smart Recommendations</h4>
                  <motion.div 
                    className="px-2 py-1 bg-cyan-500/20 rounded-full"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-xs text-cyan-300 font-medium">{insights.recommendations.length} suggestions</span>
                  </motion.div>
                </div>
                <div className="grid gap-4">
                  {insights.recommendations.map((rec, index) => (
                    <motion.div 
                      key={index} 
                      className="p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 group relative overflow-hidden"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ y: -3, scale: 1.02 }}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-400/5 rounded-full blur-xl group-hover:bg-cyan-400/10 transition-all duration-300"></div>
                      <div className="flex items-center gap-3 mb-3 relative z-10">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                        >
                          <Zap className="w-5 h-5 text-cyan-400" />
                        </motion.div>
                        <span className="text-slate-300 leading-relaxed group-hover:text-cyan-200 transition-colors">{rec}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'patterns' && insights && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Patterns */}
            {insights.patterns && insights.patterns.length > 0 ? (
              <div className="grid gap-4">
                {insights.patterns.map((pattern, index) => (
                  <motion.div 
                    key={index} 
                    className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 group hover:shadow-xl transition-all duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ y: -3 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      >
                        <Target className="w-5 h-5 text-purple-400" />
                      </motion.div>
                      <span className="text-white font-medium group-hover:text-purple-200 transition-colors">{pattern}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl inline-block mb-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Target className="w-12 h-12 text-purple-400" />
                </motion.div>
                <p className="text-white font-semibold mb-2">No patterns detected yet</p>
                <p className="text-slate-400">More transaction data needed for pattern analysis</p>
              </motion.div>
            )}

            {/* Predictions */}
            {insights.predictions && insights.predictions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                  <h4 className="font-bold text-xl text-white">Predictions</h4>
                </div>
                <div className="grid gap-4">
                  {insights.predictions.map((prediction, index) => (
                    <motion.div 
                      key={index} 
                      className="p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl border border-yellow-500/20 group hover:shadow-xl transition-all duration-300"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ y: -3 }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                          ⚡
                        </motion.div>
                        <span className="text-white font-medium group-hover:text-yellow-200 transition-colors">{prediction}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LendingAIInsights;