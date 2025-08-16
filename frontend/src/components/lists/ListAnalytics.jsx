// components/ListAnalytics.jsx

import React, { useState, useEffect } from 'react';
import { useListAnalytics } from '../../hooks/useListAnalytics';
import { 
  BarChart3, PieChart, TrendingUp, Clock, Target, 
  CheckCircle, ListChecks, Users, Calendar, Award,
  ArrowUp, ArrowDown, Minus, Zap
} from 'lucide-react';
import { Pie, Line, Bar } from 'react-chartjs-2';
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

// Register Chart.js components
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

// LoadingSpinner component
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className={`animate-spin rounded-full border-b-2 border-cyan-400 ${sizeClasses[size]}`}></div>
  );
};

// AnalyticsCard component
const AnalyticsCard = ({ icon: Icon, title, value, subtitle, color }) => {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-blue-500/20 text-cyan-400',
    green: 'from-green-500/20 to-emerald-500/20 text-green-400',
    purple: 'from-purple-500/20 to-pink-500/20 text-purple-400',
    orange: 'from-orange-500/20 to-red-500/20 text-orange-400'
  };
  
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`p-3 bg-gradient-to-br ${colorClasses[color]} rounded-xl`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-white mb-1">{value}</div>
          <div className="text-sm font-medium text-slate-300 mb-1">{title}</div>
          <div className="text-xs text-slate-400">{subtitle}</div>
        </div>
      </div>
    </div>
  );
};

// CompletionChart component
const CompletionChart = ({ trends }) => {
  if (!trends || trends.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No completion data available
      </div>
    );
  }
  
  const data = {
    labels: trends.map(t => new Date(t.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Completed Items',
        data: trends.map(t => t.completed_items),
        borderColor: 'rgb(34, 211, 238)',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.7)'
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.7)'
        }
      }
    }
  };
  
  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
};

// ListTypeBreakdown component
const ListTypeBreakdown = ({ types }) => {
  if (!types || types.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No list type data available
      </div>
    );
  }
  
  const data = {
    labels: types.map(t => t.category),
    datasets: [
      {
        data: types.map(t => t.count),
        backgroundColor: [
          'rgba(34, 211, 238, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)'
        ],
        borderColor: [
          'rgb(34, 211, 238)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)'
        ],
        borderWidth: 2
      }
    ]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(148, 163, 184, 0.9)',
          padding: 20
        }
      }
    }
  };
  
  return (
    <div className="h-64">
      <Pie data={data} options={options} />
    </div>
  );
};

// InsightCard component
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
    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <Icon className="text-yellow-400" size={16} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
          <p className="text-slate-400 text-sm">{insight.description}</p>
        </div>
      </div>
    </div>
  );
};

const ListAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { analytics, loading, error, fetchAnalytics } = useListAnalytics();

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
  }, [selectedPeriod, fetchAnalytics]);

  const periods = [
    { value: 'week', label: '7 Days' },
    { value: 'month', label: '30 Days' },
    { value: 'quarter', label: '3 Months' },
    { value: 'year', label: '1 Year' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-2">Failed to load analytics</div>
        <button 
          onClick={() => fetchAnalytics(selectedPeriod)}
          className="text-cyan-400 hover:text-cyan-300"
        >
          Try again
        </button>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const productivity = analytics?.productivity || {};
  const insights = analytics?.insights || [];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
          {periods.map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedPeriod === period.value
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          icon={ListChecks}
          title="Total Lists"
          value={summary.total_lists || 0}
          subtitle={`${summary.active_lists || 0} active`}
          color="cyan"
        />
        
        <AnalyticsCard
          icon={CheckCircle}
          title="Completion Rate"
          value={`${(summary.average_completion || 0).toFixed(1)}%`}
          subtitle={`${summary.completed_items || 0} items done`}
          color="green"
        />
        
        <AnalyticsCard
          icon={Zap}
          title="Productivity Score"
          value={productivity.productivity_score?.toFixed(0) || 0}
          subtitle="Based on completion speed"
          color="purple"
        />
        
        <AnalyticsCard
          icon={Target}
          title="Total Items"
          value={summary.total_items || 0}
          subtitle={`${summary.completed_items || 0} completed`}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Completion Trends */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
              <TrendingUp className="text-cyan-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Completion Trends</h3>
              <p className="text-sm text-slate-400">Daily completion activity</p>
            </div>
          </div>
          
          <CompletionChart trends={analytics?.completion_trends || []} />
        </div>

        {/* List Types Breakdown */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
              <PieChart className="text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">List Types</h3>
              <p className="text-sm text-slate-400">Distribution by type</p>
            </div>
          </div>
          
          <ListTypeBreakdown types={analytics?.list_types || []} />
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50">
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
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListAnalytics;
