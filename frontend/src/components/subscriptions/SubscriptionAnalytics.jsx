import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, PieChart, BarChart3, Calendar, CreditCard, Target, Zap } from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import SubscriptionAIInsights from './SubscriptionAIInsights';
import apiClient from '../../api/axiosConfig';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const SubscriptionAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchDashboardData();
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

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/subscriptions/subscriptions/dashboard/');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard data');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Analytics Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Subscription Analytics</h3>
        <p className="text-slate-400">Deep insights into your subscription spending patterns</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">
                ₹{analytics?.avg_subscription_cost?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-slate-400">Average</p>
            </div>
          </div>
          <p className="text-slate-300 font-medium">Avg Cost per Service</p>
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

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 animate-scale-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
              <Target className="w-6 h-6 text-orange-400" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">
                ₹{dashboardData?.yearly_cost?.toFixed(0) || '0'}
              </p>
              <p className="text-sm text-slate-400">Yearly</p>
            </div>
          </div>
          <p className="text-slate-300 font-medium">Annual Spending</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost Trends Chart */}
        {analytics?.cost_trends && analytics.cost_trends.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 animate-scale-in" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                <BarChart3 className="text-blue-400" size={24} />
              </div>
              <h3 className="font-bold text-xl text-white">Cost Trends</h3>
            </div>
            
            <div className="h-64">
              <Line
                data={{
                  labels: analytics.cost_trends.map(trend => trend.month),
                  datasets: [
                    {
                      label: 'Monthly Cost (₹)',
                      data: analytics.cost_trends.map(trend => trend.cost),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: 'rgb(59, 130, 246)',
                      pointBorderColor: 'rgb(255, 255, 255)',
                      pointBorderWidth: 2,
                      pointRadius: 6,
                      pointHoverRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      titleColor: 'rgb(255, 255, 255)',
                      bodyColor: 'rgb(203, 213, 225)',
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                      borderWidth: 1,
                      cornerRadius: 8,
                      callbacks: {
                        label: (context) => `₹${context.parsed.y.toFixed(2)}`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        color: 'rgba(71, 85, 105, 0.3)',
                      },
                      ticks: {
                        color: 'rgb(148, 163, 184)',
                      },
                    },
                    y: {
                      grid: {
                        color: 'rgba(71, 85, 105, 0.3)',
                      },
                      ticks: {
                        color: 'rgb(148, 163, 184)',
                        callback: (value) => `₹${value}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Payment Methods Breakdown */}
        {analytics?.payment_methods && Object.keys(analytics.payment_methods).length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 animate-scale-in" style={{animationDelay: '0.5s'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                <CreditCard className="text-purple-400" size={24} />
              </div>
              <h3 className="font-bold text-xl text-white">Payment Methods</h3>
            </div>
            
            <div className="h-64">
              <Doughnut
                data={{
                  labels: Object.keys(analytics.payment_methods),
                  datasets: [
                    {
                      data: Object.values(analytics.payment_methods).map(method => method.cost),
                      backgroundColor: [
                        'rgba(147, 51, 234, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 101, 101, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                      ],
                      borderColor: [
                        'rgb(147, 51, 234)',
                        'rgb(59, 130, 246)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 101, 101)',
                        'rgb(251, 191, 36)',
                      ],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: 'rgb(203, 213, 225)',
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      titleColor: 'rgb(255, 255, 255)',
                      bodyColor: 'rgb(203, 213, 225)',
                      borderColor: 'rgba(147, 51, 234, 0.3)',
                      borderWidth: 1,
                      cornerRadius: 8,
                      callbacks: {
                        label: (context) => {
                          const method = context.label;
                          const cost = context.parsed;
                          const count = analytics.payment_methods[method].count;
                          return [`₹${cost.toFixed(2)}/mo`, `${count} subscriptions`];
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Spending Overview */}
      {dashboardData?.categories && Object.keys(dashboardData.categories).length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 animate-scale-in" style={{animationDelay: '0.6s'}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg">
              <PieChart className="text-indigo-400" size={24} />
            </div>
            <h3 className="font-bold text-xl text-white">Category Breakdown</h3>
          </div>
          
          <div className="h-80">
            <Bar
              data={{
                labels: Object.keys(dashboardData.categories),
                datasets: [
                  {
                    label: 'Monthly Cost (₹)',
                    data: Object.values(dashboardData.categories).map(cat => cat.cost),
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(16, 185, 129, 0.8)',
                      'rgba(147, 51, 234, 0.8)',
                      'rgba(245, 101, 101, 0.8)',
                      'rgba(251, 191, 36, 0.8)',
                      'rgba(236, 72, 153, 0.8)',
                    ],
                    borderColor: [
                      'rgb(59, 130, 246)',
                      'rgb(16, 185, 129)',
                      'rgb(147, 51, 234)',
                      'rgb(245, 101, 101)',
                      'rgb(251, 191, 36)',
                      'rgb(236, 72, 153)',
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: 'rgb(255, 255, 255)',
                    bodyColor: 'rgb(203, 213, 225)',
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                      label: (context) => {
                        const category = context.label;
                        const cost = context.parsed.y;
                        const count = dashboardData.categories[category].count;
                        const totalCost = Object.values(dashboardData.categories).reduce((sum, cat) => sum + cat.cost, 0);
                        const percentage = ((cost / totalCost) * 100).toFixed(1);
                        return [
                          `₹${cost.toFixed(2)}/mo`,
                          `${count} subscriptions`,
                          `${percentage}% of total`
                        ];
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    grid: {
                      color: 'rgba(71, 85, 105, 0.3)',
                    },
                    ticks: {
                      color: 'rgb(148, 163, 184)',
                    },
                  },
                  y: {
                    grid: {
                      color: 'rgba(71, 85, 105, 0.3)',
                    },
                    ticks: {
                      color: 'rgb(148, 163, 184)',
                      callback: (value) => `₹${value}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* AI Insights Section */}
      <div className="animate-scale-in" style={{animationDelay: '0.7s'}}>
        <SubscriptionAIInsights />
      </div>
    </div>
  );
};

export default SubscriptionAnalytics;