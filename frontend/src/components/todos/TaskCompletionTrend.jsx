import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TaskCompletionTrend = ({ todos = [] }) => {
  // Generate data for the last 30 days
  const trendData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Create an array of the last 30 days
    const days = [];
    const completionCounts = [];
    const creationCounts = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push(dateString);
      
      // Count tasks completed on this day
      const completedOnDay = todos.filter(todo => {
        if (!todo.completed_at) return false;
        const completedDate = new Date(todo.completed_at);
        return completedDate.toDateString() === date.toDateString();
      }).length;
      completionCounts.push(completedOnDay);
      
      // Count tasks created on this day
      const createdOnDay = todos.filter(todo => {
        if (!todo.created_at) return false;
        const createdDate = new Date(todo.created_at);
        return createdDate.toDateString() === date.toDateString();
      }).length;
      creationCounts.push(createdOnDay);
    }
    
    return { days, completionCounts, creationCounts };
  }, [todos]);
  
  // Calculate 7-day moving average for completion
  const movingAverage = useMemo(() => {
    const result = [];
    const { completionCounts } = trendData;
    
    for (let i = 0; i < completionCounts.length; i++) {
      if (i < 6) {
        // Not enough data for 7-day average yet
        result.push(null);
      } else {
        // Calculate average of last 7 days
        const sum = completionCounts.slice(i - 6, i + 1).reduce((acc, val) => acc + val, 0);
        result.push(parseFloat((sum / 7).toFixed(1)));
      }
    }
    
    return result;
  }, [trendData]);
  
  // Calculate productivity score (completed tasks vs created tasks)
  const productivityScore = useMemo(() => {
    const totalCompleted = trendData.completionCounts.reduce((sum, count) => sum + count, 0);
    const totalCreated = trendData.creationCounts.reduce((sum, count) => sum + count, 0);
    
    if (totalCreated === 0) return 100; // Perfect score if no tasks were created
    return Math.round((totalCompleted / totalCreated) * 100);
  }, [trendData]);
  
  // Prepare chart data
  const chartData = {
    labels: trendData.days,
    datasets: [
      {
        label: 'Tasks Completed',
        data: trendData.completionCounts,
        borderColor: 'rgba(59, 130, 246, 1)', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: '7-Day Average',
        data: movingAverage,
        borderColor: 'rgba(139, 92, 246, 1)', // Purple
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Tasks Created',
        data: trendData.creationCounts,
        borderColor: 'rgba(16, 185, 129, 1)', // Green
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
      }
    ]
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.7)',
        borderColor: 'rgba(100, 116, 139, 0.5)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          title: (tooltipItems) => {
            return tooltipItems[0].label;
          }
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-400" />
          Task Completion Trend
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            <Calendar size={14} className="inline mr-1" />
            Last 30 Days
          </span>
          <div className="bg-slate-700/50 px-3 py-1 rounded-full text-sm">
            <span className="text-slate-300">Productivity Score: </span>
            <span className={`font-semibold ${productivityScore >= 80 ? 'text-green-400' : productivityScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {productivityScore}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-slate-700/30 rounded-lg p-3">
          <p className="text-xs text-slate-400">Tasks Completed</p>
          <p className="text-xl font-semibold text-blue-400">
            {trendData.completionCounts.reduce((sum, count) => sum + count, 0)}
          </p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3">
          <p className="text-xs text-slate-400">Tasks Created</p>
          <p className="text-xl font-semibold text-green-400">
            {trendData.creationCounts.reduce((sum, count) => sum + count, 0)}
          </p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3">
          <p className="text-xs text-slate-400">Daily Average</p>
          <p className="text-xl font-semibold text-purple-400">
            {(trendData.completionCounts.reduce((sum, count) => sum + count, 0) / 30).toFixed(1)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCompletionTrend;