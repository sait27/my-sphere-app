import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Target, PieChart, Activity } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

const ExpenseAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [budgetAnalysis, setBudgetAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [analyticsRes, trendsRes, budgetRes] = await Promise.allSettled([
          apiClient.get(`/expenses/advanced/analytics/?period=${period}`),
          apiClient.get('/expenses/advanced/trends/?months=6'),
          apiClient.get('/expenses/advanced/budget_analysis/')
        ]);
        
        if (analyticsRes.status === 'fulfilled') {
            setAnalytics(analyticsRes.value.data);
        } else {
            console.error("Failed to fetch analytics:", analyticsRes.reason);
        }

        if (trendsRes.status === 'fulfilled') {
            setTrends(trendsRes.value.data);
        } else {
            console.error("Failed to fetch trends:", trendsRes.reason);
        }

        if (budgetRes.status === 'fulfilled') {
            setBudgetAnalysis(budgetRes.value.data.budget_analysis);
        } else {
             console.error("Failed to fetch budget analysis:", budgetRes.reason);
        }

      } catch (error) {
        console.error("Failed to fetch analytics data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const categoryBreakdown = analytics?.category_insights?.category_breakdown || [];
  const paymentMethodBreakdown = analytics?.payment_method_breakdown || [];
  const summary = analytics?.summary;

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
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-6 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Total Spent</p>
                <p className="text-3xl font-bold text-white mb-1">₹{(summary.total_amount || 0).toLocaleString('en-IN')}</p>
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
                <p className="text-3xl font-bold text-white mb-1">₹{(summary.average_amount || 0).toLocaleString('en-IN')}</p>
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
                <p className="text-3xl font-bold text-white mb-1">{summary.expense_count || 0}</p>
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
                <p className="text-3xl font-bold text-white mb-1">₹{(summary.daily_average || 0).toLocaleString('en-IN')}</p>
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

      {categoryBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <PieChart className="mr-2" size={20} />
              Top Categories
            </h3>
            <div className="space-y-4">
            {categoryBreakdown.slice(0, 6).map((category, index) => {
                const percentage = category.percentage_of_total || 0;
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
                        <p className="text-white font-bold">₹{(category.total_spent || 0).toLocaleString('en-IN')}</p>
                        <p className="text-slate-400 text-xs">{category.transaction_count || 0} transactions</p>
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

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Spending Insights
            </h3>
            <div className="space-y-4">
            {categoryBreakdown.slice(0, 3).map((category, index) => {
                const isHighest = index === 0;
                const percentage = category.percentage_of_total || 0;
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
                      <p className="text-white font-bold">₹{(category.total_spent || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{category.transaction_count || 0} transactions</p>
                  </div>
                );
              })}
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="text-blue-400" size={16} />
                    <span className="text-blue-300 text-sm font-medium">Avg per Category</span>
                  </div>
                  <p className="text-white font-bold text-lg">
                    ₹{ (summary && categoryBreakdown.length > 0) ? (summary.total_amount / categoryBreakdown.length).toLocaleString('en-IN', {maximumFractionDigits: 0}) : '0'}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="text-purple-400" size={16} />
                    <span className="text-purple-300 text-sm font-medium">Categories Used</span>
                  </div>
                  <p className="text-white font-bold text-lg">{categoryBreakdown.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods - THIS IS THE FIXED BLOCK */}
      {paymentMethodBreakdown.length > 0 && summary?.total_amount > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {paymentMethodBreakdown.map((method) => (
              <div key={method.payment_method || `method-${index}`} className="flex items-center justify-between">
                <span className="text-slate-300 capitalize">{(method.payment_method || 'N/A').replace('_', ' ')}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-slate-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ 
                        width: `${((method.total || 0) / summary.total_amount) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-white font-semibold w-20 text-right">
                    ₹{(method.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Analysis */}
      {budgetAnalysis && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Target className="mr-2" size={20} />
            Budget Analysis
          </h3>
          {budgetAnalysis.length > 0 ? (
            <div className="space-y-4">
              {budgetAnalysis.map((budget) => (
                <div key={budget.category} className="p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300 font-medium">{budget.category}</span>
                    <span className={`text-sm font-semibold ${
                      budget.status === 'over_budget' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {(budget.utilization_percentage || 0).toFixed(1)}% used
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full ${
                        budget.status === 'over_budget'
                          ? 'bg-gradient-to-r from-red-500 to-red-600' 
                          : 'bg-gradient-to-r from-green-500 to-green-600'
                      }`}
                      style={{ width: `${Math.min(budget.utilization_percentage || 0, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      Spent: ₹{(budget.spent_amount || 0).toFixed(2)}
                    </span>
                    <span className="text-slate-400">
                      Budget: ₹{(budget.budget_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  {budget.remaining_amount < 0 && (
                    <p className="text-red-400 text-sm mt-1">
                      Over budget by ₹{Math.abs(budget.remaining_amount || 0).toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">No budget data for this period.</p>
          )}
        </div>
      )}

      {trends?.monthly_data && Object.keys(trends.monthly_data).length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Spending Trends
          </h3>
          <div className="space-y-3">
            {Object.entries(trends.monthly_data).map(([month, data]) => (
              <div key={month} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">{month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400 text-sm">{data.expense_count || 0} expenses</span>
                  <span className="text-white font-semibold">₹{(data.total_spent || 0).toFixed(2)}</span>
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