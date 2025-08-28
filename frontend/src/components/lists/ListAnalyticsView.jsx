import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, PieChart, TrendingUp, Clock, Target, 
  CheckCircle, List, Users, Calendar, Award,
  ArrowUp, ArrowDown, Minus, Zap, AlertCircle
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const ListAnalyticsView = ({ analytics, loading, error, fetchAnalytics }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    if (fetchAnalytics) {
      console.log('ListAnalyticsView: Fetching analytics for period:', selectedPeriod);
      fetchAnalytics(selectedPeriod);
    }
  }, [selectedPeriod, fetchAnalytics]);



  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
  };

  const periods = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!analytics || Object.keys(analytics).length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-64 text-slate-400"
      >
        <BarChart3 size={64} className="mb-6 opacity-50" />
        <h3 className="text-2xl font-semibold mb-4 text-white">No Analytics Data Available</h3>
        <p className="text-center mb-6 max-w-md">
          Create some lists and add items to see your productivity analytics and insights
        </p>
        <button 
          onClick={() => fetchAnalytics && fetchAnalytics(selectedPeriod)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
        >
          Refresh Analytics
        </button>
      </motion.div>
    );
  }

  const AnalyticsCard = ({ icon: Icon, title, value, subtitle, color, trend }) => {
    const colorClasses = {
      blue: 'from-blue-500/20 to-cyan-500/20 text-blue-400',
      green: 'from-green-500/20 to-emerald-500/20 text-green-400',
      purple: 'from-purple-500/20 to-pink-500/20 text-purple-400',
      orange: 'from-orange-500/20 to-red-500/20 text-orange-400'
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-gradient-to-br ${colorClasses[color]} rounded-xl`}>
            <Icon size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-3xl font-bold text-white">{value}</div>
              {trend && (
                <div className={`flex items-center text-sm ${
                  trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {trend > 0 ? <ArrowUp size={16} /> : trend < 0 ? <ArrowDown size={16} /> : <Minus size={16} />}
                  {Math.abs(trend)}%
                </div>
              )}
            </div>
            <div className="text-sm font-medium text-slate-300 mb-1">{title}</div>
            <div className="text-xs text-slate-400">{subtitle}</div>
          </div>
        </div>
      </motion.div>
    );
  };

  const InsightCard = ({ insight }) => {
    const getInsightIcon = (type) => {
      switch (type) {
        case 'productivity': return TrendingUp;
        case 'completion': return CheckCircle;
        case 'time': return Clock;
        default: return Award;
      }
    };
    
    const Icon = getInsightIcon(insight.type);
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Icon className="text-yellow-400" size={16} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
            <p className="text-slate-400 text-sm">{insight.description}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Error notification */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedPeriod === p.value
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          icon={List}
          title="Total Lists"
          value={analytics.summary?.total_lists || 0}
          subtitle={`${analytics.summary?.active_lists || 0} active lists`}
          color="blue"
        />
        
        <AnalyticsCard
          icon={CheckCircle}
          title="Completion Rate"
          value={`${Math.round(analytics.summary?.average_completion || 0)}%`}
          subtitle={`${analytics.summary?.completed_items || 0} items completed`}
          color="green"
        />
        
        <AnalyticsCard
          icon={Zap}
          title="Productivity Score"
          value={Math.round(analytics.productivity?.productivity_score || 0)}
          subtitle="Based on completion speed"
          color="purple"
        />
        
        <AnalyticsCard
          icon={Target}
          title="Total Items"
          value={analytics.summary?.total_items || 0}
          subtitle={`${(analytics.summary?.total_items || 0) - (analytics.summary?.completed_items || 0)} remaining`}
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Completion Trends Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
              <TrendingUp className="text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Completion Trends</h3>
              <p className="text-sm text-slate-400">Daily completion activity</p>
            </div>
          </div>
          
          <div className="h-64">
            {analytics.completion_trends && analytics.completion_trends.length > 0 ? (
              <Line
                data={{
                  labels: analytics.completion_trends.slice(-7).map(trend => 
                    new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  ),
                  datasets: [{
                    label: 'Completed Items',
                    data: analytics.completion_trends.slice(-7).map(trend => trend.completed_items),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      titleColor: '#fff',
                      bodyColor: '#cbd5e1',
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                      borderWidth: 1
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(148, 163, 184, 0.1)' },
                      ticks: { color: 'rgba(148, 163, 184, 0.7)' }
                    },
                    y: {
                      grid: { color: 'rgba(148, 163, 184, 0.1)' },
                      ticks: { color: 'rgba(148, 163, 184, 0.7)' },
                      beginAtZero: true
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No completion data available</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* List Types Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
              <PieChart className="text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">List Types</h3>
              <p className="text-sm text-slate-400">Distribution by category</p>
            </div>
          </div>
          
          <div className="h-64">
            {analytics.list_types && analytics.list_types.length > 0 ? (
              <Doughnut
                data={{
                  labels: analytics.list_types.map(type => type.list_type.charAt(0).toUpperCase() + type.list_type.slice(1)),
                  datasets: [{
                    data: analytics.list_types.map(type => type.count),
                    backgroundColor: [
                      'rgba(168, 85, 247, 0.8)',
                      'rgba(59, 130, 246, 0.8)', 
                      'rgba(34, 197, 94, 0.8)',
                      'rgba(251, 146, 60, 0.8)',
                      'rgba(236, 72, 153, 0.8)'
                    ],
                    borderColor: [
                      'rgb(168, 85, 247)',
                      'rgb(59, 130, 246)',
                      'rgb(34, 197, 94)',
                      'rgb(251, 146, 60)',
                      'rgb(236, 72, 153)'
                    ],
                    borderWidth: 2
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: 'rgba(148, 163, 184, 0.9)',
                        padding: 20,
                        usePointStyle: true
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      titleColor: '#fff',
                      bodyColor: '#cbd5e1',
                      borderColor: 'rgba(168, 85, 247, 0.3)',
                      borderWidth: 1
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <PieChart size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No list type data available</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
            <Target className="text-green-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Performance Metrics</h3>
            <p className="text-sm text-slate-400">Key productivity indicators</p>
          </div>
        </div>
        
        <div className="h-64">
          <Bar
            data={{
              labels: ['Completion Time (hrs)', 'Items per List', 'Productivity Score'],
              datasets: [{
                label: 'Metrics',
                data: [
                  Math.round((analytics.productivity?.average_completion_time_hours || 0) * 24),
                  Math.round((analytics.summary?.total_items || 0) / (analytics.summary?.total_lists || 1)),
                  analytics.productivity?.productivity_score || 0
                ],
                backgroundColor: [
                  'rgba(34, 197, 94, 0.8)',
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(168, 85, 247, 0.8)'
                ],
                borderColor: [
                  'rgb(34, 197, 94)',
                  'rgb(59, 130, 246)',
                  'rgb(168, 85, 247)'
                ],
                borderWidth: 2,
                borderRadius: 8
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  titleColor: '#fff',
                  bodyColor: '#cbd5e1',
                  borderColor: 'rgba(34, 197, 94, 0.3)',
                  borderWidth: 1
                }
              },
              scales: {
                x: {
                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                  ticks: { color: 'rgba(148, 163, 184, 0.7)' }
                },
                y: {
                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                  ticks: { color: 'rgba(148, 163, 184, 0.7)' },
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
            <div className="text-lg font-bold text-white">
              ${(analytics.summary?.total_estimated_cost || 0).toFixed(2)}
            </div>
            <div className="text-xs text-slate-400">Total Estimated Cost</div>
          </div>
          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
            <div className="text-lg font-bold text-white">
              {analytics.summary?.completed_lists || 0}
            </div>
            <div className="text-xs text-slate-400">Completed Lists</div>
          </div>
          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
            <div className="text-lg font-bold text-white">
              {analytics.productivity?.items_completed || 0}
            </div>
            <div className="text-xs text-slate-400">Items Completed</div>
          </div>
        </div>
      </motion.div>

      {/* AI Insights */}
      {analytics.insights && analytics.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl">
              <Award className="text-yellow-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Insights</h3>
              <p className="text-sm text-slate-400">Personalized productivity insights</p>
            </div>
          </div>
          
          <div className="grid gap-4">
            {analytics.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ListAnalyticsView;