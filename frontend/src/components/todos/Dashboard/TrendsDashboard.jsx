// src/components/TrendsDashboard.jsx
import { Line, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUp, ArrowDown, Activity,CheckCircle2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// A utility to get dates in the past
const getDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const TrendsDashboard = ({ todos = [] }) => {
  const [timeRange, setTimeRange] = useState(30); // 7, 30, 90

  // Memoized calculations to prevent re-rendering on every prop change
  const analyticsData = useMemo(() => {
    const today = new Date();
    const startDate = getDateDaysAgo(timeRange - 1);
    
    const labels = [];
    const completions = new Array(timeRange).fill(0);
    const creations = new Array(timeRange).fill(0);

    // Populate labels for the chart
    for (let i = 0; i < timeRange; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    // Process todos to get daily counts
    todos.forEach(todo => {
      const createdDate = new Date(todo.created_at);
      const completedDate = todo.completed_at ? new Date(todo.completed_at) : null;
      
      const dayDiffCreated = Math.floor((createdDate - startDate) / (1000 * 60 * 60 * 24));
      if (dayDiffCreated >= 0 && dayDiffCreated < timeRange) {
        creations[dayDiffCreated]++;
      }
      
      if (completedDate) {
        const dayDiffCompleted = Math.floor((completedDate - startDate) / (1000 * 60 * 60 * 24));
        if (dayDiffCompleted >= 0 && dayDiffCompleted < timeRange) {
          completions[dayDiffCompleted]++;
        }
      }
    });

    // --- Advanced Metrics ---
    const totalCompleted = completions.reduce((a, b) => a + b, 0);
    const totalCreated = creations.reduce((a, b) => a + b, 0);
    const productivityScore = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 100;
    
    const cycleTimes = todos
      .filter(t => t.is_completed && t.created_at && t.completed_at)
      .map(t => (new Date(t.completed_at) - new Date(t.created_at)) / (1000 * 60 * 60 * 24)); // in days
    const avgCycleTime = cycleTimes.length > 0 ? (cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length).toFixed(1) : 0;
    
    return { labels, completions, creations, totalCompleted, totalCreated, productivityScore, avgCycleTime };
  }, [todos, timeRange]);
  
  const chartData = {
    labels: analyticsData.labels,
    datasets: [
      {
        type: 'bar',
        label: 'Tasks Completed',
        data: analyticsData.completions,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        barThickness: 6,
        borderRadius: 4,
        order: 2,
      },
      {
        type: 'line',
        label: 'Tasks Created',
        data: analyticsData.creations,
        borderColor: 'rgba(16, 185, 129, 0.5)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        order: 1,
      },
    ]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#9ca3af' } }, x: { grid: { display: false }, ticks: { color: '#9ca3af', maxRotation: 45, minRotation: 0 } } },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 12, boxPadding: 6 } },
    interaction: { mode: 'index', intersect: false }
  };
  
  const renderTimeRangeButton = (days, label) => (
    <button
      onClick={() => setTimeRange(days)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeRange === days ? 'bg-blue-600 text-white' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/80'}`}
    >
      {label}
    </button>
  );

  const InsightCard = ({ title, value, change, isPositive, icon }) => (
    <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700/50">
        <div className="flex items-center text-slate-400 text-sm mb-1">
            {icon}
            <span className="ml-2">{title}</span>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {/* Example change indicator - needs real logic */}
        {change && (
            <div className={`flex items-center text-xs mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span className="font-semibold ml-1">{change}%</span> vs prev. period
            </div>
        )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={22} className="text-blue-400" />
            Performance Trends
          </h3>
          <p className="text-sm text-slate-400">Your task velocity and efficiency over time.</p>
        </div>
        <div className="flex items-center gap-2">
            {renderTimeRangeButton(7, "7D")}
            {renderTimeRangeButton(30, "30D")}
            {renderTimeRangeButton(90, "90D")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <InsightCard title="Productivity Score" value={`${analyticsData.productivityScore}%`} icon={<TrendingUp size={14}/>} isPositive={analyticsData.productivityScore > 75}/>
        <InsightCard title="Tasks Completed" value={analyticsData.totalCompleted} icon={<CheckCircle2 size={14}/>} />
        <InsightCard title="Avg. Task Cycle" value={`${analyticsData.avgCycleTime} days`} icon={<Activity size={14}/>} />
      </div>
      
      <div className="h-72 w-full">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </motion.div>
  );
};

export default TrendsDashboard;