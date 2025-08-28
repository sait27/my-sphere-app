import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import SubscriptionAIInsights from '../components/subscriptions/SubscriptionAIInsights';
import { TrendingUp, DollarSign, Calendar, PieChart } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

const SubscriptionAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await apiClient.get('/subscriptions/subscriptions/analytics/');
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="animate-slide-up">
      {/* Enhanced Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-3 text-white bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
          Subscription Analytics
        </h2>
        <p className="text-slate-400 text-lg">AI-powered insights and detailed cost analysis</p>
      </div>

        {/* AI Insights Section */}
        <SubscriptionAIInsights />

        {/* Enhanced Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  ${analytics?.avg_subscription_cost?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-slate-400">Average</p>
              </div>
            </div>
            <p className="text-slate-300 font-medium">Avg Subscription Cost</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 animate-scale-in" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {analytics?.cost_trends?.length > 1 ? (
                    analytics.cost_trends[analytics.cost_trends.length - 1].cost > 
                    analytics.cost_trends[analytics.cost_trends.length - 2].cost ? '📈' : '📉'
                  ) : '➡️'}
                </p>
                <p className="text-sm text-slate-400">Trend</p>
              </div>
            </div>
            <p className="text-slate-300 font-medium">Cost Trend</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 animate-scale-in" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                <PieChart className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {Object.keys(analytics?.payment_methods || {}).length}
                </p>
                <p className="text-sm text-slate-400">Methods</p>
              </div>
            </div>
            <p className="text-slate-300 font-medium">Payment Methods</p>
          </div>
        </div>

        {/* Enhanced Cost Trends */}
        {analytics?.cost_trends && analytics.cost_trends.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 mb-8 animate-scale-in" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                <TrendingUp className="text-blue-400" size={24} />
              </div>
              <h3 className="font-bold text-xl text-white">Cost Trends (Last 6 Months)</h3>
            </div>
            <div className="space-y-3">
              {analytics.cost_trends.map((trend, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
                  <span className="font-medium text-white">{trend.month}</span>
                  <span className="text-xl font-bold text-white">${trend.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Payment Methods Breakdown */}
        {analytics?.payment_methods && Object.keys(analytics.payment_methods).length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 animate-scale-in" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                <PieChart className="text-purple-400" size={24} />
              </div>
              <h3 className="font-bold text-xl text-white">Payment Methods</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analytics.payment_methods).map(([method, data]) => (
                <div key={method} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-white">{method}</h4>
                    <span className="px-2 py-1 bg-slate-600/50 text-slate-300 text-xs rounded-lg">
                      {data.count} subs
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    ${data.cost.toFixed(2)}/mo
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
  );
};

export default SubscriptionAnalyticsPage;