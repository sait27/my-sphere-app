// components/ListInsights.jsx

import React, { useEffect } from 'react';
import { useListInsights } from '../../hooks/useListInsights';
import { 
  TrendingUp, TrendingDown, Zap, Clock, 
  Target, Award, AlertCircle, CheckCircle,
  Calendar, Users, Star, BarChart3
} from 'lucide-react';

const ListInsights = ({ list }) => {
  const { insights: insightsData, loading, error, fetchInsights } = useListInsights();
  
  useEffect(() => {
    if (list?.id) {
      fetchInsights(list.id);
    }
  }, [list?.id, fetchInsights]);
  
  if (!list || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
        <AlertCircle className="mx-auto text-red-400 mb-2" size={24} />
        <p className="text-red-400">Failed to load insights</p>
      </div>
    );
  }
  
  if (!insightsData) return null;
  
  const insights = insightsData.insights || [];
  const productivity = insightsData.productivity || {};
  const trends = insightsData.trends || {};

  const getInsightIcon = (type) => {
    switch (type) {
      case 'productivity': return TrendingUp;
      case 'completion': return CheckCircle;
      case 'time': return Clock;
      case 'goal': return Target;
      case 'warning': return AlertCircle;
      default: return Award;
    }
  };

  const getInsightColor = (type, sentiment) => {
    if (sentiment === 'positive') return 'from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30';
    if (sentiment === 'negative') return 'from-red-500/20 to-pink-500/20 text-red-400 border-red-500/30';
    if (sentiment === 'warning') return 'from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30';
    return 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30';
  };

  const formatTrend = (value) => {
    if (value > 0) return { icon: TrendingUp, color: 'text-green-400', text: `+${value}%` };
    if (value < 0) return { icon: TrendingDown, color: 'text-red-400', text: `${value}%` };
    return { icon: TrendingUp, color: 'text-slate-400', text: '0%' };
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-cyan-400" size={16} />
            <span className="text-sm text-slate-400">Productivity</span>
          </div>
          <div className="text-xl font-bold text-white">
            {productivity.score?.toFixed(0) || 0}
          </div>
          <div className="text-xs text-slate-500">
            {productivity.trend && (
              <span className={formatTrend(productivity.trend).color}>
                {formatTrend(productivity.trend).text}
              </span>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-orange-400" size={16} />
            <span className="text-sm text-slate-400">Avg. Time</span>
          </div>
          <div className="text-xl font-bold text-white">
            {productivity.avg_completion_time || 'N/A'}
          </div>
          <div className="text-xs text-slate-500">per item</div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-green-400" size={16} />
            <span className="text-sm text-slate-400">Streak</span>
          </div>
          <div className="text-xl font-bold text-white">
            {trends.completion_streak || 0}
          </div>
          <div className="text-xs text-slate-500">days</div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="text-purple-400" size={16} />
            <span className="text-sm text-slate-400">Velocity</span>
          </div>
          <div className="text-xl font-bold text-white">
            {trends.weekly_velocity?.toFixed(1) || 0}
          </div>
          <div className="text-xs text-slate-500">items/week</div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
              <Zap className="text-cyan-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Insights</h3>
              <p className="text-sm text-slate-400">Personalized recommendations for this list</p>
            </div>
          </div>

          <div className="space-y-3">
            {insights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border bg-gradient-to-br ${getInsightColor(insight.type, insight.sentiment)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-black/20 rounded-lg">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm opacity-90">{insight.description}</p>
                      {insight.action && (
                        <button className="mt-2 text-xs px-3 py-1 bg-black/20 rounded-full hover:bg-black/30 transition-colors">
                          {insight.action}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Trends */}
      {trends.weekly_data && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Performance Trends</h3>
              <p className="text-sm text-slate-400">Your productivity patterns</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Best Days */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Most Productive Days</h4>
              <div className="space-y-2">
                {trends.best_days?.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-300 capitalize">{day.name}</span>
                    <span className="text-green-400 font-medium">{day.completion_rate}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Hours */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Peak Hours</h4>
              <div className="space-y-2">
                {trends.peak_hours?.map((hour, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-300">{hour.time}</span>
                    <span className="text-cyan-400 font-medium">{hour.activity_count} items</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
            <Award className="text-purple-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Smart Recommendations</h3>
            <p className="text-sm text-slate-400">Ways to improve your list management</p>
          </div>
        </div>

        <div className="grid gap-3">
          {productivity.score < 50 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-yellow-400" size={16} />
                <span className="font-medium text-yellow-400">Boost Productivity</span>
              </div>
              <p className="text-sm text-slate-300">
                Try breaking down large items into smaller, actionable tasks to improve completion rates.
              </p>
            </div>
          )}

          {list.total_items > 20 && list.completion_percentage < 30 && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-blue-400" size={16} />
                <span className="font-medium text-blue-400">Focus Strategy</span>
              </div>
              <p className="text-sm text-slate-300">
                This list has many items. Consider prioritizing the top 5 most important ones first.
              </p>
            </div>
          )}

          {trends.completion_streak === 0 && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-400" size={16} />
                <span className="font-medium text-green-400">Build Momentum</span>
              </div>
              <p className="text-sm text-slate-300">
                Start with quick wins! Complete a few easy items to build momentum and motivation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListInsights;
