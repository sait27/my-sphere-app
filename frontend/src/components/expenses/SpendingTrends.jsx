import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card } from '../ui/Card';

const SpendingTrends = ({ trends }) => {
  if (!trends?.monthly_trends?.length) return null;

  return (
    <Card>
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <BarChart3 className="mr-2" size={20} />
        Spending Trends
      </h3>
      <div className="space-y-4">
        {trends.monthly_trends.map((trend) => (
          <div key={trend.month} className="flex items-center justify-between p-4 bg-slate-700/40 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
            <span className="text-slate-300 font-medium group-hover:text-white transition-colors duration-300">{trend.month}</span>
            <div className="flex items-center space-x-6">
              <span className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors duration-300">{trend.count || 0} expenses</span>
              <span className="text-white font-semibold text-lg group-hover:text-white/90 transition-colors duration-300">₹{(trend.total || 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SpendingTrends;