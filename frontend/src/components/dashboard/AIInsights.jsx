import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Lightbulb,
  Calendar,
  DollarSign,
  PieChart,
  BarChart3,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/axiosConfig';

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/api/v1/ai-insights/');
      setInsights(response.data);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError('Failed to load AI insights');
      toast.error('Failed to load AI insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'spending': return <DollarSign className="w-5 h-5" />;
      case 'budget': return <Target className="w-5 h-5" />;
      case 'trend': return <TrendingUp className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'suggestion': return <Lightbulb className="w-5 h-5" />;
      case 'prediction': return <BarChart3 className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type, sentiment) => {
    if (sentiment === 'positive') return 'from-green-500 to-emerald-500';
    if (sentiment === 'negative') return 'from-red-500 to-rose-500';
    if (sentiment === 'warning') return 'from-yellow-500 to-orange-500';
    
    switch (type) {
      case 'spending': return 'from-blue-500 to-cyan-500';
      case 'budget': return 'from-purple-500 to-indigo-500';
      case 'trend': return 'from-teal-500 to-green-500';
      default: return 'from-slate-500 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">AI Insights</h3>
              <p className="text-slate-400 text-sm">Powered by advanced analytics</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">AI Insights</h3>
              <p className="text-slate-400 text-sm">Powered by advanced analytics</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Insights</h3>
            <p className="text-slate-400 text-sm">Powered by advanced analytics</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {insights && insights.insights && insights.insights.length > 0 ? (
        <div className="space-y-4">
          {insights.insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-700/30 to-slate-800/30 p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 bg-gradient-to-r ${getInsightColor(insight.type, insight.sentiment)} rounded-lg flex-shrink-0`}>
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                  <p className="text-slate-300 text-sm mb-2">{insight.description}</p>
                  {insight.action && (
                    <div className="flex items-center gap-2 text-xs">
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">{insight.action}</span>
                    </div>
                  )}
                </div>
                {insight.impact && (
                  <div className="text-right">
                    <div className={`text-sm font-bold ${
                      insight.impact > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {insight.impact > 0 ? '+' : ''}${Math.abs(insight.impact).toFixed(0)}
                    </div>
                    <div className="text-xs text-slate-400">potential impact</div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {insights.summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-400">Summary</span>
              </div>
              <p className="text-slate-300 text-sm">{insights.summary}</p>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No insights available yet</p>
          <p className="text-slate-500 text-sm">Keep using the app to generate personalized insights</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
