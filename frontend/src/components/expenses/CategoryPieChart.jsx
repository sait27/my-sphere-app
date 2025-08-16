// src/components/CategoryPieChart.jsx

import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function CategoryPieChart({ expenses }) {
  // This logic processes your expenses to get the total amount for each category
  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    acc[category] = (acc[category] || 0) + parseFloat(expense.amount);
    return acc;
  }, {});

  // Generate vibrant colors using HSL
  const generateColors = (count) => {
    const colors = [];
    const borderColors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 60) % 360; // Spread colors evenly around color wheel
      const saturation = 70;
      const lightness = 60;
      const alpha = 0.8;
      
      colors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`);
      borderColors.push(`hsla(${hue}, ${saturation}%, ${lightness - 10}%, 1)`);
    }
    return { colors, borderColors };
  };

  const categoryCount = Object.keys(categoryTotals).length;
  const { colors, borderColors } = generateColors(categoryCount);

  const data = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: 'Amount Spent',
        data: Object.values(categoryTotals),
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: {
            size: 12,
            weight: '500',
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ₹${context.parsed.toLocaleString('en-IN')} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return <Pie data={data} options={options} />;
}

export default CategoryPieChart;