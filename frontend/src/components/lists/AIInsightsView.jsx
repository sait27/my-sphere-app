import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, TrendingUp, Target, Lightbulb, Zap } from 'lucide-react';
import { useAIFeatures } from '../../hooks/useAIFeatures';
import LoadingSpinner from '../common/LoadingSpinner';

const AIInsightsView = () => {
  const [insights, setInsights] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const { loading, getAIInsights, getAIAnalytics } = useAIFeatures();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [insightsData, analyticsData] = await Promise.all([
          getAIInsights(),
          getAIAnalytics()
        ]);
        setInsights(insightsData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to fetch AI data:', error);
      }
    };

    fetchData();
  }, [getAIInsights, getAIAnalytics]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading AI insights..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
          <Sparkles className="text-purple-400" size={24} />
        </div>
        <div>
          <h3 className="text-3xl font-bold text-white">AI Insights</h3>
          <p className="text-slate-400">Intelligent analysis of your productivity patterns</p>
        </div>
      </div>

      {/* Insights Cards */}
      {insights?.insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  insight.type === 'success' ? 'bg-green-500/20' :
                  insight.type === 'warning' ? 'bg-yellow-500/20' :
                  insight.type === 'tip' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                }`}>
                  {insight.type === 'success' && <Target className="text-green-400" size={20} />}
                  {insight.type === 'warning' && <TrendingUp className="text-yellow-400" size={20} />}
                  {insight.type === 'tip' && <Lightbulb className="text-blue-400" size={20} />}
                  {insight.type === 'info' && <Brain className="text-purple-400" size={20} />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-2">{insight.title}</h4>
                  <p className="text-slate-400 text-sm">{insight.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Predictions */}
      {insights?.predictions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-yellow-400" size={24} />
            <h4 className="text-xl font-bold text-white">AI Predictions</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-2">Next Week Completion</p>
              <p className="text-2xl font-bold text-white">{insights.predictions.next_week_completion}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Productivity Boost</p>
              <p className="text-2xl font-bold text-green-400">{insights.predictions.productivity_boost}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-400 text-sm mb-2">Recommendation</p>
              <p className="text-white">{insights.predictions.recommendation}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Motivational Message */}
      {insights?.motivational_message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl p-6 rounded-2xl border border-purple-500/30 text-center"
        >
          <p className="text-lg text-white font-medium">{insights.motivational_message}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIInsightsView;