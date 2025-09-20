import React from 'react';
import { TrendingUp } from 'lucide-react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-600/30 shadow-xl hover:shadow-2xl hover:border-slate-500/50 transition-all duration-500 hover:scale-[1.02] ${className}`}>
    {children}
  </div>
);

export const SummaryCard = ({ title, value, subtitle, icon: Icon, gradient, iconColor }) => (
  <div className={`bg-gradient-to-br ${gradient} backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl hover:border-white/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium mb-1 transition-colors duration-300" style={{ color: iconColor }}>{title}</p>
        <p className="text-3xl font-bold text-white mb-1 group-hover:text-white/90 transition-colors duration-300">{value}</p>
        <p className="text-xs transition-colors duration-300" style={{ color: iconColor }}>{subtitle}</p>
      </div>
      <div className="p-3 rounded-2xl transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: `${iconColor}20` }}>
        <Icon size={28} style={{ color: iconColor }} className="transition-transform duration-300 group-hover:rotate-6" />
      </div>
    </div>
  </div>
);

export const InsightCard = ({ category, total, count, percentage, isHighest, index }) => (
  <div className={`p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 group ${isHighest ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/40 shadow-lg hover:shadow-red-500/20 hover:border-red-400/60' : 'bg-slate-700/40 border border-slate-600/30 hover:border-slate-500/50 shadow-lg hover:shadow-slate-500/20'}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center">
        {isHighest && <TrendingUp className="text-red-400 mr-2 transition-transform duration-300 group-hover:scale-110" size={16} />}
        <span className={`font-medium transition-colors duration-300 ${isHighest ? 'text-red-300 group-hover:text-red-200' : 'text-slate-200 group-hover:text-white'}`}>
          {isHighest ? 'Highest Spending' : `#${index + 1} Category`}
        </span>
      </div>
      <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-300">{percentage.toFixed(1)}%</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-white font-bold text-lg group-hover:text-white/90 transition-colors duration-300">{category}</span>
      <p className="text-white font-bold group-hover:text-white/90 transition-colors duration-300">₹{total.toLocaleString('en-IN')}</p>
    </div>
    <p className="text-xs text-slate-400 mt-1 group-hover:text-slate-300 transition-colors duration-300">{count} transactions</p>
  </div>
);