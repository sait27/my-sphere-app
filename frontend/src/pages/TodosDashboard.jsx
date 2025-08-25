import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosConfig';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#06b6d4', '#7c3aed', '#f97316', '#ef4444', '#10b981', '#f59e0b'];

export default function TodosDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
  apiClient.get('/todos/tasks/advanced_dashboard/')
      .then(res => {
        if (!mounted) return;
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
    return () => mounted = false;
  }, []);

  if (loading) return <div className="p-6">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-400">Error loading dashboard</div>;

  // Prepare trends data
  const createdTrend = (data.created_trend || []).map(d => ({ day: d.day, created: d.count }));
  const completedTrend = (data.completed_trend || []).map(d => ({ day: d.day, completed: d.count }));

  // Merge by day
  const daysMap = {};
  createdTrend.forEach(d => { daysMap[d.day] = { day: d.day, created: d.created, completed: 0 }; });
  completedTrend.forEach(d => {
    daysMap[d.day] = daysMap[d.day] ? { ...daysMap[d.day], completed: d.completed } : { day: d.day, created: 0, completed: d.completed };
  });
  const trendSeries = Object.values(daysMap).sort((a, b) => new Date(a.day) - new Date(b.day));

  // Priority distribution pie from by_priority
  const priorityData = Object.entries(data.by_priority || {}).map(([k, v]) => ({ name: k, value: v }));

  // Top tags
  const topTags = data.top_tags || [];

  // Time spent top tasks
  const timeSpent = data.time_spent_top_tasks || [];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Todos Advanced Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Created vs Completed (last 30 days)</h3>
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

        <div className="bg-slate-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Priority Distribution</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Top Tags</h3>
          <ul className="space-y-2">
            {topTags.map((t, i) => (
              <li key={i} className="flex justify-between">
                <span>{t.name}</span>
                <span className="text-slate-400">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Top Time Spent Tasks (minutes)</h3>
          <ul className="space-y-2">
            {timeSpent.map((t, i) => (
              <li key={i} className="flex justify-between">
                <span>Task {t.task}</span>
                <span className="text-slate-400">{t.total_minutes || 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Top AI Priority Tasks</h3>
          <ul className="space-y-2">
            {data.top_ai_tasks.map(t => (
              <li key={t.id} className="flex justify-between">
                <span>{t.title}</span>
                <span className="text-slate-400">{t.ai_priority_score.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Quick KPIs</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-700 rounded">
              <div className="text-sm text-slate-400">Total Tasks</div>
              <div className="text-2xl font-bold">{data.total_tasks}</div>
            </div>
            <div className="p-3 bg-slate-700 rounded">
              <div className="text-sm text-slate-400">Completion Rate</div>
              <div className="text-2xl font-bold">{data.completion_rate_percent}%</div>
            </div>
            <div className="p-3 bg-slate-700 rounded">
              <div className="text-sm text-slate-400">Avg Duration (min)</div>
              <div className="text-2xl font-bold">{data.avg_actual_duration_minutes}</div>
            </div>
            <div className="p-3 bg-slate-700 rounded">
              <div className="text-sm text-slate-400">Overdue</div>
              <div className="text-2xl font-bold">{data.overdue_count}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
