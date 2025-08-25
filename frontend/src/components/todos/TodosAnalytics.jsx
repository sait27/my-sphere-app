import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, BarChart4 } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

const COLORS = ['#06b6d4', '#7c3aed', '#f97316', '#ef4444', '#10b981', '#f59e0b'];

export default function TodosAnalytics({ fetchAdvancedDashboard, todos = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = fetchAdvancedDashboard ? await fetchAdvancedDashboard() : (await apiClient.get('/todos/tasks/advanced_dashboard/')).data;
        if (!mounted) return;
        setData(res);
      } catch (err) {
        console.error('Failed to load todos analytics:', err);
        if (!mounted) return;
        setError(err.message || 'Failed to load analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [fetchAdvancedDashboard]);

  if (loading) return <div className="p-6">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-400">Error loading analytics: {error}</div>;

  const createdTrend = (data?.created_trend || []).map(d => ({ day: d.day, created: d.count }));
  const completedTrend = (data?.completed_trend || []).map(d => ({ day: d.day, completed: d.count }));

  const daysMap = {};
  createdTrend.forEach(d => { daysMap[d.day] = { day: d.day, created: d.created, completed: 0 }; });
  completedTrend.forEach(d => { daysMap[d.day] = daysMap[d.day] ? { ...daysMap[d.day], completed: d.completed } : { day: d.day, created: 0, completed: d.completed }; });
  const trendSeries = Object.values(daysMap).sort((a, b) => new Date(a.day) - new Date(b.day));

  const priorityData = Object.entries(data?.by_priority || {}).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Todos Analytics</h2>
        <div className="flex items-center gap-3">
          <button onClick={async () => { setLoading(true); try { const d = fetchAdvancedDashboard ? await fetchAdvancedDashboard() : (await apiClient.get('/todos/tasks/advanced_dashboard/')).data; setData(d); setError(null);} catch(e){ setError(e.message || 'Failed'); } finally { setLoading(false); } }} className="px-3 py-1 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700">Refresh</button>
          {loading && <div className="text-sm text-slate-400">Loading...</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
          <p className="text-sm text-blue-300">Total Tasks</p>
          <p className="text-3xl font-bold text-white">{data?.total_tasks ?? todos.length}</p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
          <p className="text-sm text-green-300">Completed</p>
          <p className="text-3xl font-bold text-white">{data?.completed_tasks ?? todos.filter(t => t.status === 'completed').length}</p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20">
          <p className="text-sm text-yellow-300">In Progress</p>
          <p className="text-3xl font-bold text-white">{data?.by_status?.in_progress ?? todos.filter(t => t.status === 'in_progress').length}</p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/5 border border-red-500/20">
          <p className="text-sm text-red-300">Overdue</p>
          <p className="text-3xl font-bold text-white">{data?.overdue_count ?? todos.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
          <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><TrendingUp className="text-cyan-400" size={18} />Completion Trend</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="created" stroke="#06b6d4" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
          <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2"><BarChart4 className="text-purple-400" size={18} />Priority Distribution</h3>
          <div className="space-y-3">
            {priorityData.map((entry, index) => {
              const count = entry.value;
              const total = data?.total_tasks ?? todos.length;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const color = COLORS[index % COLORS.length];
              return (
                <div key={entry.name}>
                  <div className="flex justify-between text-sm text-slate-300 mb-1">
                    <span className="capitalize">{entry.name}</span>
                    <span>{count}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-slate-800 rounded">
          <h3 className="text-lg font-semibold mb-2">Top AI Priority Tasks</h3>
          <ul className="space-y-2">
            {(data?.top_ai_tasks || []).map(t => (
              <li key={t.id} className="flex justify-between">
                <span>{t.title}</span>
                <span className="text-slate-400">{(t.ai_priority_score || 0).toFixed ? t.ai_priority_score.toFixed(2) : t.ai_priority_score}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-slate-800 rounded">
          <h3 className="text-lg font-semibold mb-2">Quick KPIs</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-700 rounded">
              <div className="text-sm text-slate-400">Total Tasks</div>
              <div className="text-2xl font-bold">{data?.total_tasks}</div>
            </div>
            <div className="p-3 bg-slate-700 rounded">
              <div className="text-sm text-slate-400">Completion Rate</div>
              <div className="text-2xl font-bold">{data?.completion_rate_percent}%</div>
            </div>
            <div className="p-3 bg-slate-700 rounded">
              <div className="text-sm text-slate-400">Avg Duration (min)</div>
              <div className="text-2xl font-bold">{data?.avg_actual_duration_minutes}</div>
            </div>
            <div className="p-3 bg-slate-700 rounded">
              <div className="text-sm text-slate-400">Overdue</div>
              <div className="text-2xl font-bold">{data?.overdue_count}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
