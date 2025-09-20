import React from 'react';
import { ChevronsRight, Sun, Moon, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '../ui/Card';

const FinancialHabits = ({ spendingPatterns, highValueTransactions }) => {
  if (!spendingPatterns && (!highValueTransactions || !highValueTransactions.length)) return null;

  return (
    <Card>
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <ChevronsRight className="mr-2" size={20} />
        Financial Habits
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {spendingPatterns && (
          <div className="bg-slate-700/40 p-5 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:shadow-lg group">
            <h4 className="font-semibold text-slate-200 mb-4 group-hover:text-white transition-colors duration-300 flex items-center">
              <DollarSign size={16} className="mr-2" />
              Spending Patterns
            </h4>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <Sun size={18} className="text-yellow-400 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-slate-300 group-hover:text-white transition-colors duration-300">Weekday Average</span>
              </div>
              <span className="font-bold text-white group-hover:text-white/90 transition-colors duration-300">
                ₹{(spendingPatterns.weekday_average || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Moon size={18} className="text-purple-400 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-slate-300 group-hover:text-white transition-colors duration-300">Weekend Average</span>
              </div>
              <span className="font-bold text-white group-hover:text-white/90 transition-colors duration-300">
                ₹{(spendingPatterns.weekend_average || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {highValueTransactions && highValueTransactions.length > 0 && (
          <div className="bg-slate-700/40 p-5 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:shadow-lg group">
            <h4 className="font-semibold text-slate-200 mb-4 group-hover:text-white transition-colors duration-300 flex items-center">
              <TrendingUp size={16} className="mr-2" />
              Top Transactions
            </h4>
            <div className="space-y-3">
              {highValueTransactions.map((t) => (
                <div key={t.id} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-600/30 transition-all duration-200">
                  <span className="text-slate-300 capitalize truncate pr-4 group-hover:text-white transition-colors duration-300">{t.description || 'N/A'}</span>
                  <span className="font-semibold text-white group-hover:text-white/90 transition-colors duration-300">
                    ₹{(t.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FinancialHabits;