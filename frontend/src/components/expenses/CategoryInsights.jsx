import React from 'react';
import { PieChart, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { Card, InsightCard } from '../ui/Card';
import { calculatePercentage, getCategoryColor } from '../../utils/expenseAnalytics';

const CategoryInsights = ({ categoryBreakdown, summary }) => {
  if (!categoryBreakdown.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <PieChart className="mr-2" size={20} />
          Top Categories
        </h3>
        <div className="space-y-4">
          {categoryBreakdown.slice(0, 6).map((category, index) => {
            const percentage = calculatePercentage(category.total, summary?.total_amount);
            return (
              <div key={category.category} className="group hover:bg-slate-700/40 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-transparent hover:border-slate-500/30 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-3 shadow-lg transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: getCategoryColor(index) }}
                    ></div>
                    <span className="text-slate-200 font-medium group-hover:text-white transition-colors duration-300">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold group-hover:text-white/90 transition-colors duration-300">
                      ₹{(category.total || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-slate-400 text-xs group-hover:text-slate-300 transition-colors duration-300">
                      {category.count || 0} transactions
                    </p>
                  </div>
                </div>
                <div className="w-full bg-slate-600/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-700 group-hover:shadow-lg"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getCategoryColor(index),
                      boxShadow: `0 0 10px ${getCategoryColor(index)}40`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-2 group-hover:text-slate-400 transition-colors duration-300">{percentage.toFixed(1)}% of total spending</p>
              </div>
            );
          })}
        </div>
      </Card>
      
      <Card>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <TrendingUp className="mr-2" size={20} />
          Spending Insights
        </h3>
        <div className="space-y-4">
          {categoryBreakdown.slice(0, 3).map((category, index) => {
            const percentage = calculatePercentage(category.total, summary?.total_amount);
            return (
              <InsightCard
                key={category.category}
                category={category.category}
                total={category.total || 0}
                count={category.count || 0}
                percentage={percentage}
                isHighest={index === 0}
                index={index}
              />
            );
          })}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-500/15 to-cyan-500/10 p-4 rounded-xl border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20 group">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="text-blue-400 transition-transform duration-300 group-hover:scale-110" size={16} />
                <span className="text-blue-300 text-sm font-medium group-hover:text-blue-200 transition-colors duration-300">Avg per Category</span>
              </div>
              <p className="text-white font-bold text-lg group-hover:text-white/90 transition-colors duration-300">
                ₹{(summary && categoryBreakdown.length > 0) ? (summary.total_amount / categoryBreakdown.length).toLocaleString('en-IN', {maximumFractionDigits: 0}) : '0'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/15 to-pink-500/10 p-4 rounded-xl border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 group">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="text-purple-400 transition-transform duration-300 group-hover:scale-110" size={16} />
                <span className="text-purple-300 text-sm font-medium group-hover:text-purple-200 transition-colors duration-300">Categories Used</span>
              </div>
              <p className="text-white font-bold text-lg group-hover:text-white/90 transition-colors duration-300">{categoryBreakdown.length}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CategoryInsights;