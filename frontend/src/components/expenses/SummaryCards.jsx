import React from 'react';
import { DollarSign, BarChart3, Activity, Calendar, TrendingUp } from 'lucide-react';
import { SummaryCard } from '../ui/Card';

const SummaryCards = ({ summary, period }) => {
  if (!summary) return null;

  const cards = [
    {
      title: 'Total Spent',
      value: `₹${(summary.total_amount || 0).toLocaleString('en-IN')}`,
      subtitle: `This ${period}`,
      icon: DollarSign,
      gradient: 'from-green-500/20 to-emerald-500/10',
      iconColor: '#10b981'
    },
    {
      title: 'Average Expense',
      value: `₹${(summary.average_amount || 0).toLocaleString('en-IN')}`,
      subtitle: 'Per transaction',
      icon: BarChart3,
      gradient: 'from-blue-500/20 to-cyan-500/10',
      iconColor: '#3b82f6'
    },
    {
      title: 'Total Transactions',
      value: summary.expense_count || 0,
      subtitle: 'Expenses logged',
      icon: Activity,
      gradient: 'from-purple-500/20 to-pink-500/10',
      iconColor: '#8b5cf6'
    },
    {
      title: 'Daily Average',
      value: `₹${(summary.daily_average || 0).toLocaleString('en-IN')}`,
      subtitle: 'Per day',
      icon: Calendar,
      gradient: 'from-orange-500/20 to-yellow-500/10',
      iconColor: '#f97316'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="transform transition-all duration-300 hover:z-10">
          <SummaryCard {...card} />
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;