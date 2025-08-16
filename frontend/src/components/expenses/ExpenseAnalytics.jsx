import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Target, PieChart, Activity } from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import CategoryPieChart from './CategoryPieChart';

const ExpenseAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [budgetAnalysis, setBudgetAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, trendsRes, budgetRes] = await Promise.all([
        apiClient.get(`/expenses/advanced/analytics/?period=${period}`),
        apiClient.get('/expenses/advanced/trends/?months=6'),
        apiClient.get('/expenses/advanced/budget_analysis/')
      ]);
      
      setAnalytics(analyticsRes.data);
      setTrends(trendsRes.data);
      setBudgetAnalysis(budgetRes.data);
    } catch (error) {
      // Failed to fetch analytics
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Expense Analytics</h2>
        <div className="flex space-x-2">
          {['month', 'quarter', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-6 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Total Spent</p>
                <p className="text-3xl font-bold text-white mb-1">₹{analytics.summary.total_amount.toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-green-400">This {period}</p>
                </div>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <DollarSign className="text-green-400" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-6 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Average Expense</p>
                <p className="text-3xl font-bold text-white mb-1">₹{analytics.summary.average_amount.toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} className="text-blue-400" />
                  <p className="text-xs text-blue-400">Per transaction</p>
                </div>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <BarChart3 className="text-blue-400" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-6 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Total Transactions</p>
                <p className="text-3xl font-bold text-white mb-1">{analytics.summary.expense_count}</p>
                <div className="flex items-center gap-1">
                  <Activity size={12} className="text-purple-400" />
                  <p className="text-xs text-purple-400">Expenses logged</p>
                </div>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Activity className="text-purple-400" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/5 p-6 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm font-medium">Daily Average</p>
                <p className="text-3xl font-bold text-white mb-1">₹{analytics.summary.daily_average.toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-1">
                  <Calendar size={12} className="text-orange-400" />
                  <p className="text-xs text-orange-400">Per day</p>
                </div>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <Calendar className="text-orange-400" size={28} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Category Breakdown */}
      {analytics && analytics.category_breakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category List */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <PieChart className="mr-2" size={20} />
              Top Categories
            </h3>
            <div className="space-y-4">
              {analytics.category_breakdown.slice(0, 6).map((category, index) => {
                const percentage = (category.total / analytics.summary.total_amount * 100);
                return (
                  <div key={category.category} className="group hover:bg-slate-700/30 p-3 rounded-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3 shadow-lg"
                          style={{ backgroundColor: `hsl(${index * 60}, 70%, 60%)` }}
                        ></div>
                        <span className="text-slate-200 font-medium">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">₹{category.total.toLocaleString('en-IN')}</p>
                        <p className="text-slate-400 text-xs">{category.count} transactions</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-600/50 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500 group-hover:shadow-lg"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: `hsl(${index * 60}, 70%, 60%)`
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{percentage.toFixed(1)}% of total spending</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spending Insights */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Spending Insights
            </h3>
            <div className="space-y-4">
              {analytics.category_breakdown.slice(0, 3).map((category, index) => {
                const isHighest = index === 0;
                const percentage = (category.total / analytics.summary.total_amount * 100);
                return (
                  <div key={category.category} className={`p-4 rounded-lg ${isHighest ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30' : 'bg-slate-700/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {isHighest && <TrendingUp className="text-red-400 mr-2" size={16} />}
                        <span className={`font-medium ${isHighest ? 'text-red-300' : 'text-slate-200'}`}>
                          {isHighest ? 'Highest Spending' : `#${index + 1} Category`}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-lg">{category.category}</span>
                      <span className="text-white font-bold">₹{category.total.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{category.count} transactions</p>
                  </div>
                );
              })}
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="text-blue-400" size={16} />
                    <span className="text-blue-300 text-sm font-medium">Avg per Category</span>
                  </div>
                  <p className="text-white font-bold text-lg">
                    ₹{(analytics.summary.total_amount / analytics.category_breakdown.length).toLocaleString('en-IN')}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="text-purple-400" size={16} />
                    <span className="text-purple-300 text-sm font-medium">Categories Used</span>
                  </div>
                  <p className="text-white font-bold text-lg">{analytics.category_breakdown.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      {analytics && analytics.payment_method_breakdown.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {analytics.payment_method_breakdown.map((method, index) => (
              <div key={method.payment_method} className="flex items-center justify-between">
                <span className="text-slate-300 capitalize">{method.payment_method.replace('_', ' ')}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-slate-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ 
                        width: `${(method.total / analytics.summary.total_amount) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-white font-semibold w-20 text-right">
                    ₹{method.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Analysis */}
      {budgetAnalysis && budgetAnalysis.budget_analysis.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Target className="mr-2" size={20} />
            Budget Analysis
          </h3>
          <div className="space-y-4">
            {budgetAnalysis.budget_analysis.map((budget) => (
              <div key={budget.category} className="p-4 bg-slate-700/30 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300 font-medium">{budget.category}</span>
                  <span className={`text-sm font-semibold ${
                    budget.is_over_budget ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {budget.percentage_used.toFixed(1)}% used
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full ${
                      budget.is_over_budget 
                        ? 'bg-gradient-to-r from-red-500 to-red-600' 
                        : 'bg-gradient-to-r from-green-500 to-green-600'
                    }`}
                    style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Spent: ₹{budget.spent.toFixed(2)}
                  </span>
                  <span className="text-slate-400">
                    Budget: ₹{budget.budget_limit.toFixed(2)}
                  </span>
                </div>
                {budget.remaining < 0 && (
                  <p className="text-red-400 text-sm mt-1">
                    Over budget by ₹{Math.abs(budget.remaining).toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Trends */}
      {trends && trends.monthly_trends.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Spending Trends
          </h3>
          <div className="space-y-3">
            {trends.monthly_trends.map((month) => (
              <div key={month.month} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">{month.month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400 text-sm">{month.count} expenses</span>
                  <span className="text-white font-semibold">₹{month.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseAnalytics;
