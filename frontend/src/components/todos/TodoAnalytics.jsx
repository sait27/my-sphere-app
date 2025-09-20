import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Target, Calendar, Zap, Activity, Brain } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { useTodos } from '../../hooks/useTodos';

const TodoAnalytics = () => {
  const { getAdvancedDashboard } = useTodos();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await getAdvancedDashboard();
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [getAdvancedDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center text-slate-400 py-12">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        <p>No analytics data available</p>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue', gradient = false }) => (
    <div className={`${gradient ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80' : 'bg-slate-800/50'} backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 group`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-3 bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} className={`text-${color}-400`} />
        </div>
        <h3 className="text-slate-300 font-semibold">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          title="Total Tasks"
          value={analytics.total_tasks}
          color="blue"
          gradient={true}
        />
        <StatCard
          icon={Zap}
          title="Completed"
          value={analytics.completed_tasks}
          subtitle={`${analytics.completion_rate_percent}% completion rate`}
          color="green"
          gradient={true}
        />
        <StatCard
          icon={Clock}
          title="Avg Duration"
          value={`${Math.round(analytics.avg_estimated_duration_minutes)}m`}
          subtitle="Estimated time"
          color="yellow"
          gradient={true}
        />
        <StatCard
          icon={Calendar}
          title="Overdue"
          value={analytics.overdue_count}
          color="red"
          gradient={true}
        />
      </div>

      {/* Advanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-400" />
            Task Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={Object.entries(analytics.by_status || {}).map(([status, count], index) => ({
                  name: status.replace('_', ' '),
                  value: count,
                  fill: COLORS[index % COLORS.length]
                }))}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {Object.entries(analytics.by_status || {}).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Bar Chart */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-400" />
            Priority Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={Object.entries(analytics.by_priority || {}).map(([priority, count]) => ({
              priority: priority.charAt(0).toUpperCase() + priority.slice(1),
              count,
              fill: priority === 'urgent' ? '#EF4444' :
                    priority === 'high' ? '#F59E0B' :
                    priority === 'medium' ? '#10B981' : '#3B82F6'
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="priority" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Productivity Trends */}
      {analytics.created_trend?.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Activity size={20} className="text-green-400" />
            Productivity Trends (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.created_trend.map(item => ({
              date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              created: item.count,
              completed: analytics.completed_trend?.find(c => c.day === item.day)?.count || 0
            }))}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Area type="monotone" dataKey="created" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCreated)" />
              <Area type="monotone" dataKey="completed" stroke="#10B981" fillOpacity={1} fill="url(#colorCompleted)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top AI Tasks */}
      {analytics.top_ai_tasks?.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Top AI Priority Tasks</h3>
          <div className="space-y-3">
            {analytics.top_ai_tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm">{task.title}</p>
                  <p className="text-slate-400 text-xs">
                    AI Score: {task.ai_priority_score?.toFixed(1)} | Status: {task.status}
                  </p>
                </div>
                {task.due_date && (
                  <div className="text-slate-400 text-xs">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {analytics.ai_insights?.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">AI Insights</h3>
          <div className="space-y-3">
            {analytics.ai_insights.slice(0, 3).map(insight => (
              <div key={insight.id} className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <h4 className="text-purple-300 font-medium mb-2">{insight.title}</h4>
                <p className="text-slate-300 text-sm">{insight.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-purple-400 capitalize">{insight.insight_type}</span>
                  <span className="text-xs text-slate-400">
                    Confidence: {(insight.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoAnalytics;