import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, RefreshCw, Sparkles, TrendingUp, Target, Lightbulb, DollarSign } from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import toast from 'react-hot-toast';

const ExpenseAIInsights = () => {
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInsights = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const url = forceRefresh ? '/expenses/ai-insights/?refresh=true' : '/expenses/ai-insights/';
      const response = await apiClient.get(url);
      setInsightsData(response.data);
      if(forceRefresh) toast.success('Insights have been refreshed!');
    } catch (err) {
      toast.error('Failed to load AI insights.');
      console.error('Error fetching AI insights:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights(false);
  }, []);

  const getInsightIcon = (type) => {
    switch (type) {
      case 'spending': return <DollarSign className="w-5 h-5" />;
      case 'budget': return <Target className="w-5 h-5" />;
      case 'trend': return <TrendingUp className="w-5 h-5" />;
      case 'suggestion': return <Lightbulb className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'from-green-500/30 to-emerald-500/30 border-green-500/50 text-green-300';
    if (sentiment === 'negative') return 'from-red-500/30 to-rose-500/30 border-red-500/50 text-red-300';
    if (sentiment === 'warning') return 'from-yellow-500/30 to-orange-500/30 border-yellow-500/50 text-yellow-300';
    return 'from-slate-700/50 to-slate-800/50 border-slate-600/50 text-slate-300';
  };

  if (loading) {
    return <div className="text-center p-4">Loading insights...</div>;
  }

  if (!insightsData || !insightsData.insights || insightsData.insights.length === 0) {
    return (
      <div className="text-center p-4 text-slate-400">
        No insights available yet. Keep tracking your expenses!
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 rounded-2xl border border-slate-700/50 mt-6">
      {/* MODIFICATION: The refresh button is now here */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
            <h3 className="text-xl font-bold text-white">AI Insights</h3>
            <p className="text-slate-400 text-sm">{insightsData.summary}</p>
            </div>
        </div>
        <button
            onClick={() => fetchInsights(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-purple-600/50 rounded-lg hover:bg-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="space-y-4">
        {insightsData.insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group relative overflow-hidden rounded-xl bg-gradient-to-r p-4 border ${getSentimentColor(insight.sentiment)}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg`}>
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
            </div>
            {/* MODIFICATION: The refresh button that was here has been removed */}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseAIInsights;